import type { Prisma } from "@prisma/client";

import { db } from "~/server/db";

/**
 * Dynamic segmentation engine (CRM-MKT-001). Evaluates the rule JSON already
 * stored on CustomerSegment against computed customer traits and recomputes
 * rule-based memberships — turning the previously static segments dynamic.
 *
 * The evaluator and trait builder are pure and exported for unit testing.
 */

const dayMs = 24 * 60 * 60 * 1000;

export type SegmentTraits = Record<string, number | string | boolean | null>;

export function buildCustomerTraits(
  snapshot: {
    lifetimeValue: Prisma.Decimal | number;
    orderCount: number;
    averageOrderValue: Prisma.Decimal | number;
    wishlistItems: number;
    serviceRequests: number;
    appointments: number;
    lastOrderAt: Date | null;
  },
  asOf: Date = new Date(),
): SegmentTraits {
  const recencyDays = snapshot.lastOrderAt
    ? Math.floor((asOf.getTime() - snapshot.lastOrderAt.getTime()) / dayMs)
    : null;

  return {
    lifetimeValue: Number(snapshot.lifetimeValue),
    orderCount: snapshot.orderCount,
    averageOrderValue: Number(snapshot.averageOrderValue),
    wishlistItems: snapshot.wishlistItems,
    serviceRequests: snapshot.serviceRequests,
    appointments: snapshot.appointments,
    recencyDays,
    hasOrdered: snapshot.orderCount > 0,
  };
}

function evaluateLeaf(
  trait: string,
  op: string,
  value: unknown,
  traits: SegmentTraits,
): boolean {
  const actual = traits[trait] ?? null;

  if (op === "eq") return actual === value;
  if (op === "neq") return actual !== value;

  if (typeof actual !== "number" || typeof value !== "number") return false;
  switch (op) {
    case "gte":
      return actual >= value;
    case "lte":
      return actual <= value;
    case "gt":
      return actual > value;
    case "lt":
      return actual < value;
    default:
      return false;
  }
}

/**
 * Evaluates a segment rule (recursive all/any/not + trait leaf) against traits.
 * Unknown/empty rules evaluate to false (a segment with no rule matches nobody).
 */
export function evaluateSegmentRule(
  rule: unknown,
  traits: SegmentTraits,
): boolean {
  if (!rule || typeof rule !== "object") return false;
  const node = rule as Record<string, unknown>;

  if (Array.isArray(node.all)) {
    return node.all.every((sub) => evaluateSegmentRule(sub, traits));
  }
  if (Array.isArray(node.any)) {
    return node.any.some((sub) => evaluateSegmentRule(sub, traits));
  }
  if ("not" in node) {
    return !evaluateSegmentRule(node.not, traits);
  }
  if (typeof node.trait === "string" && typeof node.op === "string") {
    return evaluateLeaf(node.trait, node.op, node.value, traits);
  }

  return false;
}

/**
 * Recomputes rule-based memberships for segments that have a rule. Only manages
 * memberships it owns (reason = "rule_engine"); manual/system memberships are
 * left untouched. Idempotent.
 */
export async function recomputeSegmentMemberships(
  input: { segmentId?: string } = {},
) {
  const segments = (
    await db.customerSegment.findMany({
      where: { ...(input.segmentId ? { id: input.segmentId } : {}) },
      select: { id: true, rule: true },
    })
  ).filter((segment) => segment.rule != null);
  if (segments.length === 0) {
    return { segments: 0, added: 0, removed: 0 };
  }

  const snapshots = await db.customerMetricSnapshot.findMany({
    select: {
      customerId: true,
      lifetimeValue: true,
      orderCount: true,
      averageOrderValue: true,
      wishlistItems: true,
      serviceRequests: true,
      appointments: true,
      lastOrderAt: true,
    },
  });
  const traitsByCustomer = new Map(
    snapshots.map((snapshot) => [
      snapshot.customerId,
      buildCustomerTraits(snapshot),
    ]),
  );

  let added = 0;
  let removed = 0;

  for (const segment of segments) {
    const matched = new Set<string>();
    for (const [customerId, traits] of traitsByCustomer) {
      if (evaluateSegmentRule(segment.rule, traits)) matched.add(customerId);
    }

    const ruleMemberships = await db.customerSegmentMembership.findMany({
      where: { segmentId: segment.id, reason: "rule_engine" },
      select: { customerId: true },
    });
    const ruleMemberSet = new Set(ruleMemberships.map((m) => m.customerId));

    const toRemove = [...ruleMemberSet].filter(
      (customerId) => !matched.has(customerId),
    );
    if (toRemove.length > 0) {
      const result = await db.customerSegmentMembership.deleteMany({
        where: {
          segmentId: segment.id,
          reason: "rule_engine",
          customerId: { in: toRemove },
        },
      });
      removed += result.count;
    }

    for (const customerId of matched) {
      if (ruleMemberSet.has(customerId)) continue;
      await db.customerSegmentMembership.upsert({
        where: { customerId_segmentId: { customerId, segmentId: segment.id } },
        create: { customerId, segmentId: segment.id, reason: "rule_engine" },
        update: {},
      });
      added += 1;
    }
  }

  return { segments: segments.length, added, removed };
}
