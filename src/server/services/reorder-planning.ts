import { db } from "~/server/db";

/**
 * Reorder / demand planning (closes gap G6). Each InventoryItem can carry a
 * reorder point and a replenish-up-to target level; when net-available stock
 * drops to/below the point, a purchase suggestion is raised. The planning maths
 * are pure and unit-tested.
 */

/** Stock available to promise = on-hand minus reserved (never below 0). Pure. */
export function netAvailable(quantity: number, reserved: number): number {
  return Math.max(0, quantity - reserved);
}

/** Suggested reorder quantity: replenish up to the target when at/below point. Pure. */
export function suggestReorderQuantity(input: {
  available: number;
  reorderPoint: number;
  targetLevel: number;
}): number {
  if (input.reorderPoint <= 0) return 0; // no policy
  if (input.available > input.reorderPoint) return 0;
  return Math.max(0, input.targetLevel - input.available);
}

/** Reorder posture. Pure. */
export function reorderStatus(
  available: number,
  reorderPoint: number,
): "OK" | "REORDER" | "CRITICAL" {
  if (available <= 0) return "CRITICAL";
  if (reorderPoint > 0 && available <= reorderPoint) return "REORDER";
  return "OK";
}

/** Average daily demand over a window. Pure. */
export function computeDailyVelocity(unitsConsumed: number, windowDays: number): number {
  if (windowDays <= 0) return 0;
  return Math.round((Math.max(0, unitsConsumed) / windowDays) * 100) / 100;
}

/** Suggested reorder point = demand over the lead time + safety stock. Pure. */
export function dynamicReorderPoint(input: {
  velocityPerDay: number;
  leadTimeDays: number;
  safetyStock: number;
}): number {
  const demand = Math.ceil(Math.max(0, input.velocityPerDay) * Math.max(0, input.leadTimeDays));
  return demand + Math.max(0, input.safetyStock);
}

/** Sets (or clears) the reorder policy on an inventory item. */
export async function setReorderPolicy(input: {
  inventoryItemId: string;
  reorderPoint: number;
  targetLevel: number;
}) {
  const reorderPoint = Math.max(0, Math.trunc(input.reorderPoint));
  const targetLevel = Math.max(reorderPoint, Math.trunc(input.targetLevel));
  return db.inventoryItem.update({
    where: { id: input.inventoryItemId },
    data: { reorderPoint, targetLevel },
  });
}

/** Items at/below their reorder point, with a suggested purchase quantity. */
export async function listReorderSuggestions(limit = 40) {
  const items = await db.inventoryItem.findMany({
    where: { reorderPoint: { gt: 0 } },
    orderBy: { quantity: "asc" },
    take: 200,
    select: {
      id: true,
      quantity: true,
      reserved: true,
      reorderPoint: true,
      targetLevel: true,
      branch: { select: { name: true } },
      variant: { select: { sku: true, name: true } },
    },
  });

  return items
    .map((item) => {
      const available = netAvailable(item.quantity, item.reserved);
      return {
        id: item.id,
        sku: item.variant.sku,
        variantName: item.variant.name,
        branchName: item.branch.name,
        available,
        reorderPoint: item.reorderPoint,
        targetLevel: item.targetLevel,
        status: reorderStatus(available, item.reorderPoint),
        suggested: suggestReorderQuantity({
          available,
          reorderPoint: item.reorderPoint,
          targetLevel: item.targetLevel,
        }),
      };
    })
    .filter((item) => item.suggested > 0)
    .slice(0, limit);
}

/** Demand not counted as real consumption (internal moves / corrections). */
const NON_DEMAND_REASONS = ["transfer_out", "cycle_count_adjustment"];

/**
 * Lowest-stock inventory items for setting reorder policies, each with a velocity-
 * based suggested reorder point (demand over the lead time + safety stock).
 */
export async function listInventoryForPolicy(input: { limit?: number; windowDays?: number; leadTimeDays?: number } = {}) {
  const limit = input.limit ?? 30;
  const windowDays = input.windowDays ?? 30;
  const leadTimeDays = input.leadTimeDays ?? 14;

  const items = await db.inventoryItem.findMany({
    orderBy: { quantity: "asc" },
    take: limit,
    select: {
      id: true,
      branchId: true,
      variantId: true,
      quantity: true,
      reserved: true,
      safetyStock: true,
      reorderPoint: true,
      targetLevel: true,
      branch: { select: { name: true } },
      variant: { select: { sku: true, name: true } },
    },
  });

  const windowStart = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);
  const consumption = await db.inventoryLedger.groupBy({
    by: ["branchId", "variantId"],
    where: {
      createdAt: { gte: windowStart },
      delta: { lt: 0 },
      reason: { notIn: NON_DEMAND_REASONS },
      variantId: { in: items.map((item) => item.variantId) },
    },
    _sum: { delta: true },
  });
  const consumedByKey = new Map(
    consumption.map((row) => [`${row.branchId}:${row.variantId}`, -Number(row._sum.delta ?? 0)]),
  );

  return items.map((item) => {
    const consumed = consumedByKey.get(`${item.branchId}:${item.variantId}`) ?? 0;
    const velocity = computeDailyVelocity(consumed, windowDays);
    return {
      id: item.id,
      sku: item.variant.sku,
      variantName: item.variant.name,
      branchName: item.branch.name,
      available: netAvailable(item.quantity, item.reserved),
      reorderPoint: item.reorderPoint,
      targetLevel: item.targetLevel,
      velocity,
      suggestedReorderPoint: dynamicReorderPoint({
        velocityPerDay: velocity,
        leadTimeDays,
        safetyStock: item.safetyStock,
      }),
    };
  });
}

export async function getReorderSummary() {
  const [withPolicy, items] = await Promise.all([
    db.inventoryItem.count({ where: { reorderPoint: { gt: 0 } } }),
    db.inventoryItem.findMany({
      where: { reorderPoint: { gt: 0 } },
      select: { quantity: true, reserved: true, reorderPoint: true },
    }),
  ]);

  let needsReorder = 0;
  let critical = 0;
  for (const item of items) {
    const available = netAvailable(item.quantity, item.reserved);
    const status = reorderStatus(available, item.reorderPoint);
    if (status === "CRITICAL") critical += 1;
    else if (status === "REORDER") needsReorder += 1;
  }

  return { withPolicy, needsReorder, critical };
}
