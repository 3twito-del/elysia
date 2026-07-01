import { db } from "~/server/db";

/**
 * Unified CRM activity timeline (CRM-SAL-004): calls, emails, meetings, notes
 * and tasks logged against a customer / lead / opportunity. The timeline
 * summary is pure + unit-tested.
 */

export const ACTIVITY_TYPES = [
  "CALL",
  "EMAIL",
  "MEETING",
  "NOTE",
  "TASK",
] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number];

/** Normalizes free-text input to a known activity type (defaults to NOTE). Pure. */
export function normalizeActivityType(value: string | undefined): ActivityType {
  const upper = (value ?? "").toUpperCase();
  return (ACTIVITY_TYPES as readonly string[]).includes(upper)
    ? (upper as ActivityType)
    : "NOTE";
}

export type TimelineEntry = { type: string; occurredAt: Date };

export type TimelineSummary = {
  total: number;
  byType: Record<ActivityType, number>;
  lastActivityAt: Date | null;
};

/** Aggregates a timeline: total, per-type counts, and the most recent date. Pure. */
export function summarizeActivityTimeline(
  activities: TimelineEntry[],
): TimelineSummary {
  const byType: Record<ActivityType, number> = {
    CALL: 0,
    EMAIL: 0,
    MEETING: 0,
    NOTE: 0,
    TASK: 0,
  };
  let lastActivityAt: Date | null = null;

  for (const activity of activities) {
    const type = normalizeActivityType(activity.type);
    byType[type] += 1;
    if (!lastActivityAt || activity.occurredAt > lastActivityAt) {
      lastActivityAt = activity.occurredAt;
    }
  }

  return { total: activities.length, byType, lastActivityAt };
}

/** Logs a CRM activity, optionally resolving a customer by email. */
export async function logActivity(input: {
  type: string;
  subject: string;
  body?: string;
  occurredAt?: Date;
  customerId?: string;
  customerEmail?: string;
  leadId?: string;
  opportunityId?: string;
  createdByAdminUserId?: string;
}) {
  const subject = input.subject.trim();
  if (!subject) throw new Error("נדרש נושא לפעילות.");

  let customerId = input.customerId;
  if (!customerId && input.customerEmail?.trim()) {
    const email = input.customerEmail.trim().toLowerCase();
    const customer = await db.customer.findFirst({
      where: { email },
      select: { id: true },
    });
    if (!customer) throw new Error("לא נמצא לקוח עם כתובת זו.");
    customerId = customer.id;
  }

  return db.crmActivity.create({
    data: {
      type: normalizeActivityType(input.type),
      subject,
      body: input.body?.trim() ? input.body.trim() : null,
      occurredAt: input.occurredAt ?? new Date(),
      customerId,
      leadId: input.leadId,
      opportunityId: input.opportunityId,
      createdByAdminUserId: input.createdByAdminUserId,
    },
  });
}

/** Recent activities across the CRM, with the linked customer name resolved. */
export async function listRecentActivities(limit = 25) {
  const activities = await db.crmActivity.findMany({
    orderBy: { occurredAt: "desc" },
    take: limit,
    select: {
      id: true,
      type: true,
      subject: true,
      occurredAt: true,
      customerId: true,
    },
  });

  const customerIds = [
    ...new Set(
      activities.map((activity) => activity.customerId).filter(Boolean),
    ),
  ] as string[];
  const customers =
    customerIds.length > 0
      ? await db.customer.findMany({
          where: { id: { in: customerIds } },
          select: { id: true, firstName: true, lastName: true, email: true },
        })
      : [];
  const labelById = new Map(
    customers.map((customer) => {
      const name = [customer.firstName, customer.lastName]
        .filter(Boolean)
        .join(" ")
        .trim();
      return [customer.id, name.length > 0 ? name : (customer.email ?? "לקוח")];
    }),
  );

  return activities.map((activity) => ({
    id: activity.id,
    type: activity.type,
    subject: activity.subject,
    occurredAt: activity.occurredAt,
    customerLabel: activity.customerId
      ? (labelById.get(activity.customerId) ?? "לקוח")
      : null,
  }));
}

/** The full timeline for one customer (for the 360 view). */
export async function listActivitiesForCustomer(customerId: string) {
  return db.crmActivity.findMany({
    where: { customerId },
    orderBy: { occurredAt: "desc" },
    select: {
      id: true,
      type: true,
      subject: true,
      body: true,
      occurredAt: true,
    },
  });
}

export async function getActivityTimelineSummary() {
  const activities = await db.crmActivity.findMany({
    select: { type: true, occurredAt: true },
  });
  return summarizeActivityTimeline(activities);
}
