import type { Prisma } from "@prisma/client";

import { env } from "~/env";
import { db } from "~/server/db";

export function areErpModulesEnabled() {
  return !["0", "false"].includes(env.ERP_MODULES_ENABLED ?? "");
}

export async function getErpOverview() {
  const [
    vendors,
    purchaseOrders,
    openPurchaseOrders,
    receipts,
    lowStockItems,
    recentCostSnapshots,
  ] = await Promise.all([
    db.vendor.findMany({
      orderBy: [{ status: "asc" }, { name: "asc" }],
      include: { purchaseOrders: true },
    }),
    db.purchaseOrder.findMany({
      orderBy: { updatedAt: "desc" },
      take: 20,
      include: { vendor: true, items: true, receipts: true },
    }),
    db.purchaseOrder.count({
      where: { status: { in: ["DRAFT", "ORDERED", "PARTIALLY_RECEIVED"] } },
    }),
    db.goodsReceipt.count(),
    db.inventoryItem.findMany({
      where: {
        OR: [{ quantity: { lte: 0 } }, { safetyStock: { gt: 0 } }],
      },
      include: {
        branch: true,
        variant: {
          include: {
            product: {
              include: {
                costSnapshots: {
                  orderBy: { effectiveAt: "desc" },
                  take: 1,
                },
              },
            },
          },
        },
      },
      take: 50,
    }),
    db.productCostSnapshot.findMany({
      orderBy: { effectiveAt: "desc" },
      take: 10,
      include: { product: true, variant: true, vendor: true },
    }),
  ]);

  const reorderRecommendations = lowStockItems
    .map((item) => {
      const sellable = Math.max(0, item.quantity - item.reserved);
      const reorderQuantity = Math.max(item.safetyStock * 2 - sellable, 0);

      return {
        inventoryItemId: item.id,
        productId: item.variant.productId,
        productName: item.variant.product.name,
        variantId: item.variantId,
        sku: item.variant.sku,
        branchName: item.branch.name,
        quantity: item.quantity,
        reserved: item.reserved,
        safetyStock: item.safetyStock,
        sellable,
        reorderQuantity,
        estimatedUnitCost: item.variant.product.costSnapshots[0]
          ? Number(item.variant.product.costSnapshots[0].unitCost)
          : null,
      };
    })
    .filter((item) => item.reorderQuantity > 0)
    .sort((first, second) => second.reorderQuantity - first.reorderQuantity)
    .slice(0, 15);

  return {
    enabled: areErpModulesEnabled(),
    counts: {
      vendors: vendors.length,
      purchaseOrders: purchaseOrders.length,
      openPurchaseOrders,
      receipts,
      reorderRecommendations: reorderRecommendations.length,
    },
    vendors: vendors.map((vendor) => ({
      id: vendor.id,
      key: vendor.key,
      name: vendor.name,
      contactEmail: vendor.contactEmail,
      phone: vendor.phone,
      paymentTerms: vendor.paymentTerms,
      leadTimeDays: vendor.leadTimeDays,
      status: vendor.status,
      purchaseOrders: vendor.purchaseOrders.length,
    })),
    purchaseOrders: purchaseOrders.map((purchaseOrder) => ({
      id: purchaseOrder.id,
      poNumber: purchaseOrder.poNumber,
      vendorName: purchaseOrder.vendor.name,
      status: purchaseOrder.status,
      currency: purchaseOrder.currency,
      subtotal: Number(purchaseOrder.subtotal),
      total: Number(purchaseOrder.total),
      itemCount: purchaseOrder.items.length,
      receivedLines: purchaseOrder.receipts.length,
      expectedAt: purchaseOrder.expectedAt,
      orderedAt: purchaseOrder.orderedAt,
      receivedAt: purchaseOrder.receivedAt,
      updatedAt: purchaseOrder.updatedAt,
    })),
    reorderRecommendations,
    recentCostSnapshots: recentCostSnapshots.map((snapshot) => ({
      id: snapshot.id,
      productName: snapshot.product.name,
      variantSku: snapshot.variant?.sku ?? null,
      vendorName: snapshot.vendor?.name ?? null,
      unitCost: Number(snapshot.unitCost),
      currency: snapshot.currency,
      source: snapshot.source,
      effectiveAt: snapshot.effectiveAt,
    })),
    freshness: { generatedAt: new Date(), source: "live-database" as const },
  };
}

export async function createPurchaseOrder(input: {
  vendorId: string;
  poNumber?: string;
  currency?: string;
  expectedAt?: Date;
  notes?: string;
  items: Array<{
    productId?: string;
    variantId?: string;
    description: string;
    sku?: string;
    quantity: number;
    unitCost: number;
  }>;
}) {
  const subtotal = input.items.reduce(
    (sum, item) => sum + item.quantity * item.unitCost,
    0,
  );

  return db.purchaseOrder.create({
    data: {
      vendorId: input.vendorId,
      poNumber: input.poNumber ?? (await createNextPurchaseOrderNumber()),
      currency: input.currency ?? "ILS",
      subtotal,
      total: subtotal,
      expectedAt: input.expectedAt,
      notes: input.notes,
      items: {
        create: input.items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          description: item.description,
          sku: item.sku,
          quantity: item.quantity,
          unitCost: item.unitCost,
          totalCost: item.quantity * item.unitCost,
        })),
      },
    },
    include: { items: true, vendor: true },
  });
}

export async function receivePurchaseOrder(input: {
  purchaseOrderId: string;
  reference?: string;
  notes?: string;
  lines: Array<{ purchaseOrderItemId: string; quantity: number }>;
}) {
  return db.$transaction(async (tx) => {
    const purchaseOrder = await tx.purchaseOrder.findUnique({
      where: { id: input.purchaseOrderId },
      include: { items: true },
    });

    if (!purchaseOrder) throw new Error("Purchase order not found.");

    const receiptCreates = [];
    const costSnapshotCreates = [];

    for (const line of input.lines) {
      const item = purchaseOrder.items.find(
        (purchaseOrderItem) =>
          purchaseOrderItem.id === line.purchaseOrderItemId,
      );

      if (!item) throw new Error("Purchase order item not found.");

      await tx.purchaseOrderItem.update({
        where: { id: item.id },
        data: {
          receivedQuantity: {
            increment: Math.max(0, line.quantity),
          },
        },
      });

      receiptCreates.push(
        tx.goodsReceipt.create({
          data: {
            purchaseOrderId: purchaseOrder.id,
            purchaseOrderItemId: item.id,
            variantId: item.variantId,
            quantity: line.quantity,
            reference: input.reference,
            notes: input.notes,
          },
        }),
      );

      if (item.productId) {
        costSnapshotCreates.push(
          tx.productCostSnapshot.create({
            data: {
              productId: item.productId,
              variantId: item.variantId,
              vendorId: purchaseOrder.vendorId,
              purchaseOrderItemId: item.id,
              unitCost: item.unitCost,
              currency: purchaseOrder.currency,
              source: "purchase_order_receipt",
              metadata: { purchaseOrderId: purchaseOrder.id },
            },
          }),
        );
      }
    }

    await Promise.all([...receiptCreates, ...costSnapshotCreates]);

    const updatedItems = await tx.purchaseOrderItem.findMany({
      where: { purchaseOrderId: purchaseOrder.id },
    });
    const allReceived = updatedItems.every(
      (item) => item.receivedQuantity >= item.quantity,
    );
    const anyReceived = updatedItems.some((item) => item.receivedQuantity > 0);

    return tx.purchaseOrder.update({
      where: { id: purchaseOrder.id },
      data: {
        status: allReceived
          ? "RECEIVED"
          : anyReceived
            ? "PARTIALLY_RECEIVED"
            : purchaseOrder.status,
        receivedAt: allReceived ? new Date() : purchaseOrder.receivedAt,
      },
      include: { items: true, receipts: true, vendor: true },
    });
  });
}

async function createNextPurchaseOrderNumber() {
  const today = new Date();
  const prefix = `PO-${today.getUTCFullYear()}${String(
    today.getUTCMonth() + 1,
  ).padStart(2, "0")}${String(today.getUTCDate()).padStart(2, "0")}`;
  const existingToday = await db.purchaseOrder.count({
    where: { poNumber: { startsWith: prefix } },
  });

  return `${prefix}-${String(existingToday + 1).padStart(3, "0")}`;
}

export function calculatePurchaseOrderTotals(
  items: Array<{
    quantity: number;
    unitCost: number | Prisma.Decimal;
  }>,
) {
  return items.reduce(
    (sum, item) => sum + item.quantity * Number(item.unitCost),
    0,
  );
}
