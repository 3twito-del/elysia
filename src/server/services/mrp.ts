import { db } from "~/server/db";

/**
 * Material Requirements Planning (MFG-003): explodes a BOM for a target build
 * quantity and nets each component's gross requirement against on-hand and
 * on-order stock to suggest what to purchase. Read-only; the maths are pure.
 */

export type ComponentRequirement = { componentVariantId: string; gross: number };

/** Gross requirement per component = per-unit quantity × build quantity. Pure. */
export function explodeRequirements(
  components: Array<{ componentVariantId: string; quantity: number }>,
  buildQuantity: number,
): ComponentRequirement[] {
  const qty = Math.max(0, Math.trunc(buildQuantity));
  return components.map((component) => ({
    componentVariantId: component.componentVariantId,
    gross: component.quantity * qty,
  }));
}

/**
 * Net requirement = gross + safety − on-hand − on-order, floored at 0. Pure.
 */
export function computeNetRequirement(input: {
  gross: number;
  onHand: number;
  onOrder: number;
  safetyStock?: number;
}): number {
  const net =
    input.gross +
    Math.max(0, input.safetyStock ?? 0) -
    Math.max(0, input.onHand) -
    Math.max(0, input.onOrder);
  return Math.max(0, net);
}

/** Planning status for a component line. Pure. */
export function mrpStatus(net: number): "OK" | "SHORTAGE" {
  return net > 0 ? "SHORTAGE" : "OK";
}

/**
 * Runs MRP for a BOM at a build quantity: for each component, sums network
 * on-hand and open-PO on-order, then nets the gross requirement. Read-only.
 */
export async function runMrp(input: { bomId: string; buildQuantity: number }) {
  const bom = await db.billOfMaterials.findUnique({
    where: { id: input.bomId },
    select: {
      finishedVariant: { select: { sku: true, name: true } },
      components: {
        select: { componentVariantId: true, quantity: true },
      },
    },
  });
  if (!bom) throw new Error("עץ מוצר לא נמצא.");

  const requirements = explodeRequirements(bom.components, input.buildQuantity);
  const variantIds = requirements.map((r) => r.componentVariantId);

  const [inventory, openPoItems, variants] = await Promise.all([
    db.inventoryItem.findMany({
      where: { variantId: { in: variantIds } },
      select: { variantId: true, quantity: true, reserved: true },
    }),
    db.purchaseOrderItem.findMany({
      where: {
        variantId: { in: variantIds },
        purchaseOrder: { status: { in: ["ORDERED", "PARTIALLY_RECEIVED"] } },
      },
      select: { variantId: true, quantity: true, receivedQuantity: true },
    }),
    db.productVariant.findMany({
      where: { id: { in: variantIds } },
      select: { id: true, sku: true, name: true },
    }),
  ]);

  const onHandByVariant = new Map<string, number>();
  for (const item of inventory) {
    const available = item.quantity - item.reserved;
    onHandByVariant.set(
      item.variantId,
      (onHandByVariant.get(item.variantId) ?? 0) + Math.max(0, available),
    );
  }

  const onOrderByVariant = new Map<string, number>();
  for (const item of openPoItems) {
    if (!item.variantId) continue;
    const remaining = Math.max(0, item.quantity - item.receivedQuantity);
    onOrderByVariant.set(
      item.variantId,
      (onOrderByVariant.get(item.variantId) ?? 0) + remaining,
    );
  }

  const variantById = new Map(variants.map((v) => [v.id, v]));

  const lines = requirements.map((requirement) => {
    const onHand = onHandByVariant.get(requirement.componentVariantId) ?? 0;
    const onOrder = onOrderByVariant.get(requirement.componentVariantId) ?? 0;
    const net = computeNetRequirement({ gross: requirement.gross, onHand, onOrder });
    const variant = variantById.get(requirement.componentVariantId);
    return {
      variantId: requirement.componentVariantId,
      sku: variant?.sku ?? "—",
      name: variant?.name ?? "—",
      gross: requirement.gross,
      onHand,
      onOrder,
      net,
      status: mrpStatus(net),
    };
  });

  return {
    finishedSku: bom.finishedVariant.sku,
    finishedName: bom.finishedVariant.name,
    lines,
    shortageCount: lines.filter((line) => line.status === "SHORTAGE").length,
  };
}
