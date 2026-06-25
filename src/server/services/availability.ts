import { db } from "~/server/db";
import { getSellableQuantity } from "~/server/services/inventory";

/**
 * Available-to-Promise (ATP) and demand allocation (WMS/OMS, Phase 3).
 *
 * Network ATP is the sum of each branch's sellable quantity
 * (on-hand − reserved − safety stock, floored at 0). On-order (open PO supply)
 * is reported separately and never counted as promisable. The pure helpers are
 * exported for unit testing.
 */

export type AtpBranchInput = {
  branchId: string;
  quantity: number;
  reserved: number;
  safetyStock: number;
};

/** Per-branch sellable breakdown and the network ATP total. Pure. */
export function computeNetworkAtp(items: AtpBranchInput[]) {
  const byBranch = items.map((item) => ({
    branchId: item.branchId,
    onHand: item.quantity,
    reserved: item.reserved,
    safetyStock: item.safetyStock,
    sellable: getSellableQuantity(item),
  }));

  return {
    networkAtp: byBranch.reduce((sum, branch) => sum + branch.sellable, 0),
    totalOnHand: items.reduce((sum, item) => sum + item.quantity, 0),
    totalReserved: items.reduce((sum, item) => sum + item.reserved, 0),
    byBranch,
  };
}

export type AllocationSource = { branchId: string; sellable: number };

/**
 * Allocates a requested quantity across branches, fullest first. Returns the
 * per-branch plan plus how much was fulfilled and any shortfall. Pure.
 */
export function allocateDemand(sources: AllocationSource[], requested: number) {
  const target = Math.max(0, Math.trunc(requested));
  const sorted = [...sources].sort(
    (a, b) => b.sellable - a.sellable || a.branchId.localeCompare(b.branchId),
  );

  let remaining = target;
  const allocations: Array<{ branchId: string; allocated: number }> = [];

  for (const source of sorted) {
    if (remaining <= 0) break;
    const allocated = Math.min(Math.max(0, source.sellable), remaining);
    if (allocated > 0) {
      allocations.push({ branchId: source.branchId, allocated });
      remaining -= allocated;
    }
  }

  return {
    allocations,
    fulfilled: target - remaining,
    shortfall: remaining,
    fullyFulfilled: remaining === 0,
  };
}

/** Open PO statuses whose unreceived quantity counts as incoming supply. */
const onOrderStatuses = ["ORDERED", "PARTIALLY_RECEIVED"] as const;

/** Network ATP for a variant: per-branch sellable + separate on-order supply. */
export async function getVariantAvailability(variantId: string) {
  const [items, poItems] = await Promise.all([
    db.inventoryItem.findMany({
      where: { variantId },
      select: {
        branchId: true,
        quantity: true,
        reserved: true,
        safetyStock: true,
        branch: { select: { name: true } },
      },
    }),
    db.purchaseOrderItem.findMany({
      where: {
        variantId,
        purchaseOrder: { status: { in: [...onOrderStatuses] } },
      },
      select: { quantity: true, receivedQuantity: true },
    }),
  ]);

  const branchName = new Map(items.map((item) => [item.branchId, item.branch.name]));
  const atp = computeNetworkAtp(
    items.map((item) => ({
      branchId: item.branchId,
      quantity: item.quantity,
      reserved: item.reserved,
      safetyStock: item.safetyStock,
    })),
  );

  const onOrder = poItems.reduce(
    (sum, item) => sum + Math.max(0, item.quantity - item.receivedQuantity),
    0,
  );

  return {
    variantId,
    networkAtp: atp.networkAtp,
    totalOnHand: atp.totalOnHand,
    totalReserved: atp.totalReserved,
    onOrder,
    byBranch: atp.byBranch
      .map((branch) => ({
        ...branch,
        branchName: branchName.get(branch.branchId) ?? branch.branchId,
      }))
      .sort((a, b) => b.sellable - a.sellable),
  };
}

/** Availability lookup by SKU for the ATP workbench. Null when unknown. */
export async function getAvailabilityBySku(sku: string) {
  const variant = await db.productVariant.findUnique({
    where: { sku },
    select: { id: true, sku: true, name: true },
  });
  if (!variant) return null;

  const availability = await getVariantAvailability(variant.id);

  return {
    sku: variant.sku,
    variantName: variant.name,
    ...availability,
  };
}
