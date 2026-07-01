import { db } from "~/server/db";
import { postLandedCostJournalEntry } from "~/server/services/ledger";

/**
 * Landed cost (P2P-008): freight/customs/insurance capitalized into the cost
 * layers of a received PO. The extra cost is allocated across the receipt's
 * layers by VALUE (quantity × unitCost) or QUANTITY, raising each layer's unit
 * cost. The allocation maths are pure + unit-tested.
 *
 * NOTE: this revalues the inventory-valuation snapshot only; a matching GL
 * capitalization entry (debit Inventory / credit landed-cost clearing) is a
 * follow-up — consistent with COGS/valuation being estimate/snapshot today.
 */

export type LandedCostBasis = "VALUE" | "QUANTITY";

export type LandedLayer = { id: string; quantity: number; unitCost: number };

export type LandedAllocation = {
  layerId: string;
  allocated: number;
  addedUnitCost: number;
  newUnitCost: number;
};

function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Allocates a landed-cost amount across cost layers. The rounding residual is
 * absorbed by the largest-weight layer so the allocated amounts sum exactly to
 * `amount`. Pure.
 */
export function allocateLandedCost(
  amount: number,
  basis: LandedCostBasis,
  layers: LandedLayer[],
): LandedAllocation[] {
  if (layers.length === 0) return [];

  const weights = layers.map((layer) =>
    basis === "QUANTITY" ? layer.quantity : layer.quantity * layer.unitCost,
  );
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

  // Nothing to weigh against (zero quantities/costs): no allocation.
  if (totalWeight <= 0 || amount <= 0) {
    return layers.map((layer) => ({
      layerId: layer.id,
      allocated: 0,
      addedUnitCost: 0,
      newUnitCost: round2(layer.unitCost),
    }));
  }

  const raw = layers.map((_, index) => (amount * weights[index]!) / totalWeight);
  const allocated = raw.map((value) => round2(value));

  // Push the rounding residual onto the largest-weight layer.
  const residual = round2(amount - allocated.reduce((sum, v) => sum + v, 0));
  if (residual !== 0) {
    let maxIndex = 0;
    for (let i = 1; i < weights.length; i += 1) {
      if (weights[i]! > weights[maxIndex]!) maxIndex = i;
    }
    allocated[maxIndex] = round2(allocated[maxIndex]! + residual);
  }

  return layers.map((layer, index) => {
    const alloc = allocated[index]!;
    const addedUnitCost =
      layer.quantity > 0 ? round2(alloc / layer.quantity) : 0;
    return {
      layerId: layer.id,
      allocated: alloc,
      addedUnitCost,
      newUnitCost: round2(layer.unitCost + addedUnitCost),
    };
  });
}

function normalizeBasis(value: string | undefined): LandedCostBasis {
  return value === "QUANTITY" ? "QUANTITY" : "VALUE";
}

/** Records a DRAFT landed cost against a received PO. */
export async function createLandedCost(input: {
  purchaseOrderId: string;
  description: string;
  amount: number;
  basis?: string;
}) {
  const description = input.description.trim();
  if (!description) throw new Error("נדרש תיאור לעלות הנלווית.");
  if (!(input.amount > 0)) throw new Error("סכום העלות הנלווית חייב להיות חיובי.");

  const po = await db.purchaseOrder.findUnique({
    where: { id: input.purchaseOrderId },
    select: { id: true },
  });
  if (!po) throw new Error("הזמנת רכש לא נמצאה.");

  return db.landedCost.create({
    data: {
      purchaseOrderId: input.purchaseOrderId,
      description,
      amount: round2(input.amount),
      basis: normalizeBasis(input.basis),
    },
  });
}

/**
 * Applies a DRAFT landed cost: allocates it across the PO's receipt cost layers
 * and raises each layer's unit cost, atomically. Idempotent by status.
 */
export async function applyLandedCost(input: { landedCostId: string }) {
  return db.$transaction(async (tx) => {
    const landedCost = await tx.landedCost.findUnique({
      where: { id: input.landedCostId },
      select: {
        id: true,
        status: true,
        amount: true,
        basis: true,
        purchaseOrderId: true,
        purchaseOrder: { select: { poNumber: true } },
      },
    });
    if (!landedCost) throw new Error("עלות נלווית לא נמצאה.");
    if (landedCost.status !== "DRAFT") {
      throw new Error("ניתן להחיל רק עלות נלווית בטיוטה.");
    }

    const layers = await tx.itemCostLayer.findMany({
      where: {
        sourceType: "purchase_receipt",
        sourceId: landedCost.purchaseOrderId,
      },
      select: { id: true, quantity: true, unitCost: true },
    });
    if (layers.length === 0) {
      throw new Error("להזמנה זו אין שכבות עלות שנקלטו — יש לקלוט סחורה תחילה.");
    }

    const allocations = allocateLandedCost(
      Number(landedCost.amount),
      normalizeBasis(landedCost.basis),
      layers.map((layer) => ({
        id: layer.id,
        quantity: layer.quantity,
        unitCost: Number(layer.unitCost),
      })),
    );

    for (const allocation of allocations) {
      if (allocation.addedUnitCost === 0) continue;
      await tx.itemCostLayer.update({
        where: { id: allocation.layerId },
        data: { unitCost: allocation.newUnitCost },
      });
    }

    // Capitalize the landed cost to the GL (Inventory / clearing). Best-effort:
    // if the chart of accounts is not seeded, skip so the revaluation still
    // commits (mirrors the sale/receipt posting policy).
    try {
      await postLandedCostJournalEntry(
        {
          purchaseOrderId: landedCost.purchaseOrderId,
          reference: landedCost.purchaseOrder.poNumber,
          entryDate: new Date(),
          amount: Number(landedCost.amount),
        },
        tx,
      );
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("[landed-cost] GL posting skipped", error);
      }
    }

    return tx.landedCost.update({
      where: { id: landedCost.id },
      data: { status: "APPLIED", appliedAt: new Date() },
    });
  });
}

/** POs that have received cost layers — eligible for landed-cost allocation. */
export async function listReceivedPurchaseOrdersForLandedCost(limit = 20) {
  const layers = await db.itemCostLayer.findMany({
    where: { sourceType: "purchase_receipt" },
    select: { sourceId: true },
  });
  const poIds = [...new Set(layers.map((layer) => layer.sourceId).filter(Boolean))];
  if (poIds.length === 0) return [];

  const pos = await db.purchaseOrder.findMany({
    where: { id: { in: poIds as string[] } },
    orderBy: { receivedAt: "desc" },
    take: limit,
    select: {
      id: true,
      poNumber: true,
      vendor: { select: { name: true } },
    },
  });
  return pos.map((po) => ({
    id: po.id,
    poNumber: po.poNumber,
    vendorName: po.vendor.name,
  }));
}

export async function listLandedCosts(limit = 20) {
  const landedCosts = await db.landedCost.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      description: true,
      amount: true,
      basis: true,
      status: true,
      purchaseOrder: { select: { poNumber: true } },
    },
  });
  return landedCosts.map((landedCost) => ({
    id: landedCost.id,
    description: landedCost.description,
    amount: Number(landedCost.amount),
    basis: landedCost.basis,
    status: landedCost.status,
    poNumber: landedCost.purchaseOrder.poNumber,
  }));
}
