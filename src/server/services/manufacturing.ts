import { db } from "~/server/db";
import { resolveUnitCost } from "~/server/services/inventory-valuation";

/**
 * Manufacturing: bills of materials and work orders (PP, Phase 5).
 *
 * Completing a work order consumes the exploded component quantities from the
 * branch's inventory (as immutable production_consume ledger moves) and yields
 * the finished units (production_output), writing a finished ItemCostLayer equal
 * to the consumed component cost. Inventory value is conserved (component cost in
 * = finished cost out), so no GL entry is required. The BOM math is pure and
 * exported for unit testing.
 */

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export type BomComponentLite = { componentVariantId: string; quantity: number };

/** Explodes a BOM into total component quantities for a production run. Pure. */
export function explodeBom(
  components: BomComponentLite[],
  quantityToProduce: number,
): Array<{ componentVariantId: string; totalQuantity: number }> {
  const units = Math.max(0, Math.trunc(quantityToProduce));
  return components.map((component) => ({
    componentVariantId: component.componentVariantId,
    totalQuantity: component.quantity * units,
  }));
}

/** Finished-unit cost = Σ (component unit cost × quantity per finished unit). Pure. */
export function computeFinishedUnitCost(
  components: Array<{ qtyPerUnit: number; unitCost: number }>,
): number {
  return round2(
    components.reduce(
      (sum, component) => sum + component.qtyPerUnit * component.unitCost,
      0,
    ),
  );
}

/** Resolves a component's unit cost at a branch (weighted-avg → snapshot → 0). */
async function resolveComponentUnitCost(variantId: string, branchId: string) {
  const [layers, variant] = await Promise.all([
    db.itemCostLayer.findMany({
      where: { variantId, branchId },
      select: { quantity: true, unitCost: true },
    }),
    db.productVariant.findUnique({
      where: { id: variantId },
      select: {
        product: {
          select: { costSnapshots: { orderBy: { effectiveAt: "desc" }, take: 1 } },
        },
      },
    }),
  ]);

  const snapshotCost = variant?.product?.costSnapshots[0]
    ? Number(variant.product.costSnapshots[0].unitCost)
    : null;

  return resolveUnitCost({
    layers: layers.map((layer) => ({
      quantity: layer.quantity,
      unitCost: Number(layer.unitCost),
    })),
    snapshotCost,
    unitPrice: 0,
  });
}

/** Creates a bill of materials, resolving the finished and component SKUs. */
export async function createBom(input: {
  finishedSku: string;
  name?: string;
  components: Array<{ sku: string; quantity: number }>;
}) {
  if (input.components.length === 0) {
    throw new Error("נדרש לפחות רכיב אחד לעץ המוצר.");
  }

  const skus = [input.finishedSku, ...input.components.map((c) => c.sku)];
  const variants = await db.productVariant.findMany({
    where: { sku: { in: skus } },
    select: { id: true, sku: true },
  });
  const idBySku = new Map(variants.map((v) => [v.sku, v.id]));

  const missing = skus.filter((sku) => !idBySku.has(sku));
  if (missing.length > 0) {
    throw new Error(`מק"טים לא ידועים: ${missing.join(", ")}`);
  }

  return db.billOfMaterials.create({
    data: {
      productVariantId: idBySku.get(input.finishedSku)!,
      name: input.name,
      components: {
        create: input.components.map((component) => ({
          componentVariantId: idBySku.get(component.sku)!,
          quantity: component.quantity,
        })),
      },
    },
    include: { components: true },
  });
}

async function nextWorkOrderNumber() {
  const today = new Date();
  const prefix = `WO-${today.getUTCFullYear()}${String(
    today.getUTCMonth() + 1,
  ).padStart(2, "0")}`;
  const count = await db.workOrder.count({
    where: { workOrderNumber: { startsWith: prefix } },
  });
  return `${prefix}-${String(count + 1).padStart(5, "0")}`;
}

/** Creates a DRAFT work order. */
export async function createWorkOrder(input: {
  bomId: string;
  branchId: string;
  quantity: number;
  createdById?: string;
}) {
  const quantity = Math.trunc(input.quantity);
  if (quantity <= 0) throw new Error("כמות הייצור חייבת להיות חיובית.");
  if (!input.branchId) throw new Error("יש לבחור סניף ייצור.");

  return db.workOrder.create({
    data: {
      workOrderNumber: await nextWorkOrderNumber(),
      bomId: input.bomId,
      branchId: input.branchId,
      quantity,
      createdById: input.createdById,
    },
  });
}

/**
 * Completes a work order: validates component availability, consumes components,
 * yields finished units, and writes the finished cost layer — all atomically.
 */
export async function completeWorkOrder(input: { workOrderId: string }) {
  const workOrder = await db.workOrder.findUnique({
    where: { id: input.workOrderId },
    include: { bom: { include: { components: true } } },
  });
  if (!workOrder) throw new Error("הוראת עבודה לא נמצאה.");
  if (workOrder.status !== "DRAFT") {
    throw new Error("ניתן להשלים רק הוראת עבודה בסטטוס טיוטה.");
  }

  const exploded = explodeBom(
    workOrder.bom.components.map((component) => ({
      componentVariantId: component.componentVariantId,
      quantity: component.quantity,
    })),
    workOrder.quantity,
  );

  // Resolve component unit costs and finished unit cost up front (read-only).
  const componentCosts = await Promise.all(
    workOrder.bom.components.map(async (component) => ({
      qtyPerUnit: component.quantity,
      unitCost: await resolveComponentUnitCost(
        component.componentVariantId,
        workOrder.branchId,
      ),
    })),
  );
  const finishedUnitCost = computeFinishedUnitCost(componentCosts);

  return db.$transaction(async (tx) => {
    for (const line of exploded) {
      const item = await tx.inventoryItem.findUnique({
        where: {
          branchId_variantId: {
            branchId: workOrder.branchId,
            variantId: line.componentVariantId,
          },
        },
        select: { quantity: true },
      });

      if ((item?.quantity ?? 0) < line.totalQuantity) {
        throw new Error(
          `מלאי רכיב לא מספיק (${line.componentVariantId}) — נדרש ${line.totalQuantity}.`,
        );
      }

      await tx.inventoryItem.update({
        where: {
          branchId_variantId: {
            branchId: workOrder.branchId,
            variantId: line.componentVariantId,
          },
        },
        data: { quantity: { decrement: line.totalQuantity } },
      });

      await tx.inventoryLedger.create({
        data: {
          branchId: workOrder.branchId,
          variantId: line.componentVariantId,
          delta: -line.totalQuantity,
          reason: "production_consume",
          reference: workOrder.workOrderNumber,
        },
      });
    }

    await tx.inventoryItem.upsert({
      where: {
        branchId_variantId: {
          branchId: workOrder.branchId,
          variantId: workOrder.bom.productVariantId,
        },
      },
      create: {
        branchId: workOrder.branchId,
        variantId: workOrder.bom.productVariantId,
        quantity: workOrder.quantity,
      },
      update: { quantity: { increment: workOrder.quantity } },
    });

    await tx.inventoryLedger.create({
      data: {
        branchId: workOrder.branchId,
        variantId: workOrder.bom.productVariantId,
        delta: workOrder.quantity,
        reason: "production_output",
        reference: workOrder.workOrderNumber,
      },
    });

    await tx.itemCostLayer.create({
      data: {
        branchId: workOrder.branchId,
        variantId: workOrder.bom.productVariantId,
        unitCost: finishedUnitCost,
        quantity: workOrder.quantity,
        sourceType: "production",
        sourceId: workOrder.id,
      },
    });

    return tx.workOrder.update({
      where: { id: workOrder.id },
      data: { status: "COMPLETED", completedAt: new Date() },
    });
  });
}

/** Cancels a DRAFT work order (nothing has been produced yet). */
export async function cancelWorkOrder(input: { workOrderId: string }) {
  const workOrder = await db.workOrder.findUnique({
    where: { id: input.workOrderId },
    select: { status: true },
  });
  if (!workOrder) throw new Error("הוראת עבודה לא נמצאה.");
  if (workOrder.status !== "DRAFT") {
    throw new Error("ניתן לבטל רק הוראת עבודה בסטטוס טיוטה.");
  }

  return db.workOrder.update({
    where: { id: input.workOrderId },
    data: { status: "CANCELLED" },
  });
}

/** Bills of materials with finished SKU and component count, for selects/lists. */
export async function listBoms(limit = 30) {
  const boms = await db.billOfMaterials.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      name: true,
      finishedVariant: { select: { sku: true, name: true } },
      _count: { select: { components: true } },
    },
  });

  return boms.map((bom) => ({
    id: bom.id,
    name: bom.name,
    finishedSku: bom.finishedVariant.sku,
    finishedName: bom.finishedVariant.name,
    componentCount: bom._count.components,
  }));
}

/** Recent work orders with BOM/finished labels. */
export async function listWorkOrders(limit = 20) {
  const orders = await db.workOrder.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      workOrderNumber: true,
      quantity: true,
      status: true,
      bom: { select: { finishedVariant: { select: { sku: true, name: true } } } },
    },
  });

  return orders.map((order) => ({
    id: order.id,
    workOrderNumber: order.workOrderNumber,
    quantity: order.quantity,
    status: order.status,
    finishedSku: order.bom.finishedVariant.sku,
    finishedName: order.bom.finishedVariant.name,
  }));
}
