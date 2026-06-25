import { db } from "~/server/db";

/**
 * Inventory valuation (INV-002).
 *
 * Cost layers are immutable receipt records (one per goods receipt). The ending
 * inventory value is computed read-only from the layers + current on-hand
 * quantity — no per-sale layer consumption is required, because under FIFO the
 * units still on hand are, by definition, the most recently received ones.
 */

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export type CostLayer = { quantity: number; unitCost: number };

/**
 * FIFO ending-inventory value: the on-hand units are valued against the newest
 * layers (oldest units are sold first). `layers` must be oldest → newest.
 */
export function valueFifoEndingInventory(
  layers: CostLayer[],
  onHand: number,
): { value: number; valuedQuantity: number } {
  let remaining = Math.max(0, Math.trunc(onHand));
  let value = 0;
  let valued = 0;

  for (let index = layers.length - 1; index >= 0 && remaining > 0; index -= 1) {
    const layer = layers[index];
    if (!layer) continue;
    const take = Math.min(remaining, layer.quantity);
    value += take * layer.unitCost;
    valued += take;
    remaining -= take;
  }

  return { value: round2(value), valuedQuantity: valued };
}

/** Weighted-average unit cost across all received layers. */
export function weightedAverageUnitCost(layers: CostLayer[]): number {
  const totalQuantity = layers.reduce((sum, layer) => sum + layer.quantity, 0);
  if (totalQuantity <= 0) return 0;

  const totalCost = layers.reduce(
    (sum, layer) => sum + layer.quantity * layer.unitCost,
    0,
  );

  return round2(totalCost / totalQuantity);
}

/**
 * Resolves a unit cost for COGS: weighted-average from cost layers when
 * available, else the latest cost snapshot, else a 40%-of-price fallback.
 * Pure; exported for testing.
 */
export function resolveUnitCost(input: {
  layers: CostLayer[];
  snapshotCost: number | null;
  unitPrice: number;
}): number {
  if (input.layers.length > 0) {
    const average = weightedAverageUnitCost(input.layers);
    if (average > 0) return average;
  }

  if (input.snapshotCost != null && input.snapshotCost > 0) {
    return round2(input.snapshotCost);
  }

  return round2(input.unitPrice * 0.4);
}

/**
 * Values on-hand inventory using FIFO cost layers. Read-only; does not mutate
 * layers or touch sale flows. Items with no cost layers are skipped (no cost
 * basis) and reported in `uncostedItems`.
 */
export async function getInventoryValuation() {
  const [items, layers] = await Promise.all([
    db.inventoryItem.findMany({
      select: { branchId: true, variantId: true, quantity: true },
    }),
    db.itemCostLayer.findMany({
      orderBy: { receivedAt: "asc" },
      select: { branchId: true, variantId: true, quantity: true, unitCost: true },
    }),
  ]);

  const layersByKey = new Map<string, CostLayer[]>();
  for (const layer of layers) {
    const key = `${layer.branchId}:${layer.variantId}`;
    const list = layersByKey.get(key) ?? [];
    list.push({ quantity: layer.quantity, unitCost: Number(layer.unitCost) });
    layersByKey.set(key, list);
  }

  let totalValue = 0;
  let valuedItems = 0;
  let uncostedItems = 0;
  let onHandUnits = 0;

  for (const item of items) {
    if (item.quantity <= 0) continue;
    onHandUnits += item.quantity;

    const itemLayers = layersByKey.get(`${item.branchId}:${item.variantId}`);
    if (!itemLayers || itemLayers.length === 0) {
      uncostedItems += 1;
      continue;
    }

    const { value } = valueFifoEndingInventory(itemLayers, item.quantity);
    totalValue += value;
    valuedItems += 1;
  }

  return {
    method: "FIFO" as const,
    totalValue: round2(totalValue),
    valuedItems,
    uncostedItems,
    onHandUnits,
    generatedAt: new Date(),
  };
}
