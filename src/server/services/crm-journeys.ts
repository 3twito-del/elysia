import type { Prisma } from "@prisma/client";

import { db } from "~/server/db";
import { BUSINESS_EVENTS, createOutboxEvent } from "~/server/services/outbox";

/**
 * Multi-step marketing automation (CRM-MKT-002, Phase 2).
 *
 * A journey is an ordered list of steps. Customers are enrolled (from a segment
 * or manually) and advanced one step per tick once each step's delay has
 * elapsed. The scheduling engine (computeNextRunAt / advanceEnrollment) is pure
 * and exported for unit testing; the tick applies it and dispatches actions
 * (currently send_email via the outbox).
 */

export type JourneyStepLite = {
  stepOrder: number;
  actionType: string;
  delayHours: number;
};

const hourMs = 60 * 60 * 1000;

/** When a step with the given delay should run, measured from `from`. Pure. */
export function computeNextRunAt(from: Date, delayHours: number): Date {
  return new Date(from.getTime() + Math.max(0, delayHours) * hourMs);
}

export type AdvanceResult =
  | { due: false }
  | {
      due: true;
      dueStep: JourneyStepLite;
      currentStepOrder: number;
      status: "ACTIVE" | "COMPLETED";
      nextRunAt: Date | null;
    };

/**
 * Decides the single step due now for an enrollment. Returns the step to run,
 * the advanced progress, the resulting status, and when the following step is
 * due (or null when the journey completes). Pure.
 */
export function advanceEnrollment(input: {
  currentStepOrder: number;
  steps: JourneyStepLite[];
  nextRunAt: Date | null;
  now: Date;
}): AdvanceResult {
  const ordered = [...input.steps].sort((a, b) => a.stepOrder - b.stepOrder);

  const dueStep = ordered.find((step) => step.stepOrder > input.currentStepOrder);
  if (!dueStep) return { due: false };
  if (!input.nextRunAt || input.nextRunAt.getTime() > input.now.getTime()) {
    return { due: false };
  }

  const following = ordered.find((step) => step.stepOrder > dueStep.stepOrder);

  return {
    due: true,
    dueStep,
    currentStepOrder: dueStep.stepOrder,
    status: following ? "ACTIVE" : "COMPLETED",
    nextRunAt: following ? computeNextRunAt(input.now, following.delayHours) : null,
  };
}

/** Segments available as a journey trigger. */
export async function listSegmentsForSelect() {
  return db.customerSegment.findMany({
    orderBy: { name: "asc" },
    select: { id: true, key: true, name: true },
  });
}

/** Creates a DRAFT journey (segment-triggered when a segment is given). */
export async function createJourney(input: {
  key: string;
  name: string;
  description?: string;
  segmentId?: string;
}) {
  return db.journey.create({
    data: {
      key: input.key,
      name: input.name,
      description: input.description,
      segmentId: input.segmentId,
      triggerType: input.segmentId ? "segment_entered" : "manual",
    },
  });
}

/** Appends a step to a journey (order auto-assigned after the last step). */
export async function addJourneyStep(input: {
  journeyId: string;
  actionType: string;
  delayHours: number;
  actionConfig?: Prisma.InputJsonValue;
}) {
  const last = await db.journeyStep.findFirst({
    where: { journeyId: input.journeyId },
    orderBy: { stepOrder: "desc" },
    select: { stepOrder: true },
  });

  return db.journeyStep.create({
    data: {
      journeyId: input.journeyId,
      stepOrder: (last?.stepOrder ?? 0) + 1,
      actionType: input.actionType,
      delayHours: Math.max(0, Math.trunc(input.delayHours)),
      actionConfig: input.actionConfig,
    },
  });
}

/** Activates a journey (requires at least one step). */
export async function activateJourney(journeyId: string) {
  const stepCount = await db.journeyStep.count({ where: { journeyId } });
  if (stepCount === 0) {
    throw new Error("לא ניתן להפעיל מסע ללא צעדים.");
  }

  return db.journey.update({
    where: { id: journeyId },
    data: { status: "ACTIVE" },
  });
}

/** Archives a journey and cancels its active enrollments. */
export async function archiveJourney(journeyId: string) {
  return db.$transaction(async (tx) => {
    await tx.journeyEnrollment.updateMany({
      where: { journeyId, status: "ACTIVE" },
      data: { status: "CANCELLED" },
    });
    return tx.journey.update({
      where: { id: journeyId },
      data: { status: "ARCHIVED" },
    });
  });
}

/** Enrolls a journey's segment members who are not already enrolled. */
export async function enrollSegmentMembers(journeyId: string) {
  const journey = await db.journey.findUnique({
    where: { id: journeyId },
    include: { steps: { orderBy: { stepOrder: "asc" }, take: 1 } },
  });
  if (!journey) throw new Error("מסע לא נמצא.");
  if (journey.status !== "ACTIVE") {
    throw new Error("ניתן לרשום נמענים רק למסע פעיל.");
  }
  if (!journey.segmentId) throw new Error("למסע אין סגמנט מקושר.");
  const firstStep = journey.steps[0];
  if (!firstStep) throw new Error("למסע אין צעדים.");

  const [members, existing] = await Promise.all([
    db.customerSegmentMembership.findMany({
      where: { segmentId: journey.segmentId },
      select: { customerId: true },
    }),
    db.journeyEnrollment.findMany({
      where: { journeyId },
      select: { customerId: true },
    }),
  ]);

  const enrolled = new Set(existing.map((row) => row.customerId));
  const toEnroll = members
    .map((row) => row.customerId)
    .filter((customerId) => !enrolled.has(customerId));

  if (toEnroll.length === 0) return 0;

  const nextRunAt = computeNextRunAt(new Date(), firstStep.delayHours);
  const created = await db.journeyEnrollment.createMany({
    data: toEnroll.map((customerId) => ({
      journeyId,
      customerId,
      nextRunAt,
    })),
    skipDuplicates: true,
  });

  return created.count;
}

/**
 * Advances every due enrollment by one step, dispatching its action. Returns the
 * number of enrollments processed and actions dispatched.
 */
export async function runJourneyTick(now: Date = new Date()) {
  const due = await db.journeyEnrollment.findMany({
    where: { status: "ACTIVE", nextRunAt: { lte: now } },
    include: {
      customer: { select: { id: true, email: true } },
      journey: {
        select: {
          id: true,
          key: true,
          steps: {
            select: { stepOrder: true, actionType: true, delayHours: true, actionConfig: true },
          },
        },
      },
    },
    take: 200,
  });

  let processed = 0;
  let dispatched = 0;

  for (const enrollment of due) {
    const result = advanceEnrollment({
      currentStepOrder: enrollment.currentStepOrder,
      steps: enrollment.journey.steps,
      nextRunAt: enrollment.nextRunAt,
      now,
    });
    if (!result.due) continue;

    const config =
      enrollment.journey.steps.find(
        (step) => step.stepOrder === result.dueStep.stepOrder,
      )?.actionConfig ?? null;

    await db.$transaction(async (tx) => {
      if (result.dueStep.actionType === "send_email" && enrollment.customer.email) {
        const template =
          config && typeof config === "object" && "template" in config
            ? String((config as Record<string, unknown>).template)
            : "journey_step";

        await createOutboxEvent(tx, {
          type: BUSINESS_EVENTS.emailRequested,
          aggregateType: "JourneyEnrollment",
          aggregateId: enrollment.id,
          idempotencyKey: `journey:${enrollment.id}:${result.dueStep.stepOrder}`,
          payload: {
            customerId: enrollment.customer.id,
            customerEmail: enrollment.customer.email,
            template,
            journeyKey: enrollment.journey.key,
            stepOrder: result.dueStep.stepOrder,
          },
        });
        dispatched += 1;
      }

      await tx.journeyEnrollment.update({
        where: { id: enrollment.id },
        data: {
          currentStepOrder: result.currentStepOrder,
          status: result.status,
          nextRunAt: result.nextRunAt,
          completedAt: result.status === "COMPLETED" ? now : null,
        },
      });
    });

    processed += 1;
  }

  return { processed, dispatched };
}

/** Journeys with step and enrollment counts for the CRM workbench. */
export async function listJourneys(limit = 20) {
  const journeys = await db.journey.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      segment: { select: { name: true } },
      steps: {
        orderBy: { stepOrder: "asc" },
        select: { id: true, stepOrder: true, actionType: true, delayHours: true },
      },
      _count: { select: { enrollments: true } },
    },
  });

  const activeCounts = await db.journeyEnrollment.groupBy({
    by: ["journeyId"],
    where: { status: "ACTIVE" },
    _count: { _all: true },
  });
  const activeByJourney = new Map(
    activeCounts.map((row) => [row.journeyId, row._count._all]),
  );

  return journeys.map((journey) => ({
    id: journey.id,
    key: journey.key,
    name: journey.name,
    status: journey.status,
    segmentName: journey.segment?.name ?? null,
    steps: journey.steps,
    enrollmentCount: journey._count.enrollments,
    activeEnrollmentCount: activeByJourney.get(journey.id) ?? 0,
  }));
}
