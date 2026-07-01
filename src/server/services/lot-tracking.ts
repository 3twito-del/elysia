import { db } from "~/server/db";

/**
 * Lot/batch tracking with FEFO allocation and expiry (INV-008). A parallel
 * tracking layer over InventoryItem: lots record which batch is on hand and
 * when it expires. Allocation and expiry logic are pure + unit-tested.
 */

export type Lot = {
  id: string;
  quantity: number;
  expiryDate: Date | null;
};

/**
 * FEFO comparator: earliest expiry first; lots without an expiry sort last.
 * Pure.
 */
export function compareExpiry(
  a: Date | null,
  b: Date | null,
): number {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return a.getTime() - b.getTime();
}

/** Sorts lots First-Expired-First-Out (new array). Pure. */
export function sortLotsFefo<T extends { expiryDate: Date | null }>(
  lots: T[],
): T[] {
  return [...lots].sort((x, y) => compareExpiry(x.expiryDate, y.expiryDate));
}

export type LotAllocation = { lotId: string; quantity: number };

/**
 * Allocates a demand across lots FEFO. Returns per-lot picks, the total
 * fulfilled and any shortfall. Pure.
 */
export function allocateFefo(
  lots: Lot[],
  demand: number,
): { allocations: LotAllocation[]; fulfilled: number; shortfall: number } {
  let remaining = Math.max(0, Math.trunc(demand));
  const allocations: LotAllocation[] = [];

  for (const lot of sortLotsFefo(lots)) {
    if (remaining <= 0) break;
    if (lot.quantity <= 0) continue;
    const take = Math.min(remaining, lot.quantity);
    allocations.push({ lotId: lot.id, quantity: take });
    remaining -= take;
  }

  const fulfilled = allocations.reduce((sum, a) => sum + a.quantity, 0);
  return { allocations, fulfilled, shortfall: Math.max(0, remaining) };
}

/** Whether a lot is expired as of a date. Pure. */
export function isExpired(expiryDate: Date | null, asOf: Date): boolean {
  return expiryDate != null && expiryDate.getTime() < asOf.getTime();
}

/** Expiry posture for display. Pure. */
export function expiryStatus(
  expiryDate: Date | null,
  asOf: Date,
  warnDays = 30,
): "NONE" | "OK" | "EXPIRING" | "EXPIRED" {
  if (!expiryDate) return "NONE";
  if (isExpired(expiryDate, asOf)) return "EXPIRED";
  const warnMs = warnDays * 24 * 60 * 60 * 1000;
  return expiryDate.getTime() - asOf.getTime() <= warnMs ? "EXPIRING" : "OK";
}

async function resolveVariantId(sku: string): Promise<string> {
  const variant = await db.productVariant.findFirst({
    where: { sku: sku.trim() },
    select: { id: true },
  });
  if (!variant) throw new Error(`מק"ט לא ידוע: ${sku}`);
  return variant.id;
}

/** Creates or tops up a tracked lot (unique per branch+variant+lotNumber). */
export async function createInventoryLot(input: {
  branchId: string;
  sku: string;
  lotNumber: string;
  quantity: number;
  expiryDate?: Date;
}) {
  const lotNumber = input.lotNumber.trim();
  if (!input.branchId) throw new Error("יש לבחור סניף.");
  if (!lotNumber) throw new Error("יש להזין מספר אצווה.");
  const quantity = Math.trunc(input.quantity);
  if (quantity <= 0) throw new Error("כמות האצווה חייבת להיות חיובית.");

  const variantId = await resolveVariantId(input.sku);

  return db.inventoryLot.upsert({
    where: {
      branchId_variantId_lotNumber: {
        branchId: input.branchId,
        variantId,
        lotNumber,
      },
    },
    create: {
      branchId: input.branchId,
      variantId,
      lotNumber,
      quantity,
      expiryDate: input.expiryDate,
    },
    update: { quantity: { increment: quantity } },
  });
}

/**
 * Consumes a quantity of a variant's lots FEFO within a branch, decrementing
 * each allocated lot. Throws on insufficient lot stock.
 */
export async function consumeLotsFefo(input: {
  branchId: string;
  sku: string;
  quantity: number;
}) {
  const variantId = await resolveVariantId(input.sku);

  return db.$transaction(async (tx) => {
    const lots = await tx.inventoryLot.findMany({
      where: { branchId: input.branchId, variantId, quantity: { gt: 0 } },
      select: { id: true, quantity: true, expiryDate: true },
    });

    const { allocations, shortfall } = allocateFefo(lots, input.quantity);
    if (shortfall > 0) {
      throw new Error("אין מספיק מלאי באצוות למשיכה המבוקשת.");
    }

    for (const allocation of allocations) {
      await tx.inventoryLot.update({
        where: { id: allocation.lotId },
        data: { quantity: { decrement: allocation.quantity } },
      });
    }

    return { allocations };
  });
}

/** Recent lots with resolved SKU/branch and expiry status. */
export async function listInventoryLots(limit = 30) {
  const lots = await db.inventoryLot.findMany({
    orderBy: [{ expiryDate: "asc" }, { createdAt: "desc" }],
    take: limit,
    select: {
      id: true,
      lotNumber: true,
      quantity: true,
      expiryDate: true,
      variantId: true,
      branchId: true,
    },
  });

  const variantIds = [...new Set(lots.map((lot) => lot.variantId))];
  const branchIds = [...new Set(lots.map((lot) => lot.branchId))];
  const [variants, branches] = await Promise.all([
    db.productVariant.findMany({
      where: { id: { in: variantIds } },
      select: { id: true, sku: true, product: { select: { name: true } } },
    }),
    db.branch.findMany({
      where: { id: { in: branchIds } },
      select: { id: true, name: true },
    }),
  ]);
  const variantById = new Map(
    variants.map((v) => [v.id, { sku: v.sku, productName: v.product.name }]),
  );
  const branchNameById = new Map(branches.map((b) => [b.id, b.name]));

  const now = new Date();
  return lots.map((lot) => ({
    id: lot.id,
    lotNumber: lot.lotNumber,
    quantity: lot.quantity,
    expiryDate: lot.expiryDate,
    sku: variantById.get(lot.variantId)?.sku ?? "—",
    productName: variantById.get(lot.variantId)?.productName ?? "—",
    branchName: branchNameById.get(lot.branchId) ?? "—",
    status: expiryStatus(lot.expiryDate, now),
  }));
}

export async function getLotSummary() {
  const now = new Date();
  const lots = await db.inventoryLot.findMany({
    where: { quantity: { gt: 0 } },
    select: { expiryDate: true },
  });
  let expiring = 0;
  let expired = 0;
  for (const lot of lots) {
    const status = expiryStatus(lot.expiryDate, now);
    if (status === "EXPIRING") expiring += 1;
    if (status === "EXPIRED") expired += 1;
  }
  return { total: lots.length, expiring, expired };
}
