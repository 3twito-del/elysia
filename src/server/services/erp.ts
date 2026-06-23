import type { Prisma } from "@prisma/client";

import { env } from "~/env";
import { db } from "~/server/db";

export function areErpModulesEnabled() {
  return !["0", "false"].includes(env.ERP_MODULES_ENABLED ?? "");
}

/** Order statuses that represent realized demand (sold-through units). */
const soldOrderStatuses = [
  "PAID",
  "PREPARING",
  "READY_FOR_PICKUP",
  "SHIPPED",
  "COMPLETED",
] as const;
const openPurchaseOrderStatuses = [
  "DRAFT",
  "ORDERED",
  "PARTIALLY_RECEIVED",
] as const;
/** Trailing window used to derive sales velocity for demand planning. */
const velocityWindowDays = 60;
const defaultLeadTimeDays = 14;

type ReorderUrgency = "CRITICAL" | "HIGH" | "MEDIUM";

export async function getErpOverview() {
  const velocitySince = new Date(
    Date.now() - velocityWindowDays * 24 * 60 * 60 * 1000,
  );

  const [
    vendors,
    purchaseOrders,
    openPurchaseOrders,
    receipts,
    lowStockItems,
    recentCostSnapshots,
    salesByVariant,
    inventoryAggregate,
    stockoutCount,
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
    db.purchaseOrder.findMany({
      where: { status: { in: [...openPurchaseOrderStatuses] } },
      select: {
        id: true,
        poNumber: true,
        status: true,
        total: true,
        expectedAt: true,
        vendor: { select: { id: true, name: true, leadTimeDays: true } },
      },
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
                  include: { vendor: true },
                },
              },
            },
          },
        },
      },
      take: 80,
    }),
    db.productCostSnapshot.findMany({
      orderBy: { effectiveAt: "desc" },
      take: 10,
      include: { product: true, variant: true, vendor: true },
    }),
    db.orderItem.groupBy({
      by: ["variantId"],
      where: {
        order: {
          status: { in: [...soldOrderStatuses] },
          createdAt: { gte: velocitySince },
        },
      },
      _sum: { quantity: true },
    }),
    db.inventoryItem.aggregate({
      _sum: { quantity: true, reserved: true },
    }),
    db.inventoryItem.count({ where: { quantity: { lte: 0 } } }),
  ]);

  const velocityByVariant = new Map(
    salesByVariant.map((row) => [
      row.variantId,
      (row._sum.quantity ?? 0) / velocityWindowDays,
    ]),
  );

  const reorderRecommendations = lowStockItems
    .map((item) => {
      const sellable = Math.max(0, item.quantity - item.reserved);
      const snapshot = item.variant.product.costSnapshots[0];
      const leadTimeDays = snapshot?.vendor?.leadTimeDays ?? defaultLeadTimeDays;
      const dailyVelocity = velocityByVariant.get(item.variantId) ?? 0;
      const demandDuringLeadTime = dailyVelocity * leadTimeDays;
      // Reorder point = safety buffer + expected demand while restocking.
      const reorderPoint = item.safetyStock + demandDuringLeadTime;
      // Target up to the safety stock plus one full lead-time of demand.
      const reorderQuantity = Math.max(
        Math.ceil(reorderPoint + demandDuringLeadTime - sellable),
        sellable <= 0 ? Math.max(item.safetyStock, 1) : 0,
      );
      const daysOfCover =
        dailyVelocity > 0 ? sellable / dailyVelocity : sellable > 0 ? 999 : 0;
      const estimatedUnitCost = snapshot ? Number(snapshot.unitCost) : null;

      const urgency: ReorderUrgency =
        sellable <= 0
          ? "CRITICAL"
          : daysOfCover <= leadTimeDays
            ? "HIGH"
            : "MEDIUM";

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
        dailyVelocity: Math.round(dailyVelocity * 100) / 100,
        daysOfCover: Math.round(daysOfCover),
        leadTimeDays,
        urgency,
        suggestedVendorName: snapshot?.vendor?.name ?? null,
        estimatedUnitCost,
        estimatedReorderCost: estimatedUnitCost
          ? Math.round(estimatedUnitCost * reorderQuantity * 100) / 100
          : null,
      };
    })
    .filter((item) => item.reorderQuantity > 0)
    .sort((first, second) => {
      const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2 } as const;
      if (order[first.urgency] !== order[second.urgency]) {
        return order[first.urgency] - order[second.urgency];
      }
      return first.daysOfCover - second.daysOfCover;
    })
    .slice(0, 20);

  const now = Date.now();
  const openPurchaseOrderValue = openPurchaseOrders.reduce(
    (sum, order) => sum + Number(order.total),
    0,
  );
  const overduePurchaseOrders = openPurchaseOrders
    .filter((order) => order.expectedAt && order.expectedAt.getTime() < now)
    .map((order) => ({
      id: order.id,
      poNumber: order.poNumber,
      vendorName: order.vendor.name,
      status: order.status,
      total: Number(order.total),
      expectedAt: order.expectedAt,
      daysOverdue: order.expectedAt
        ? Math.floor((now - order.expectedAt.getTime()) / (24 * 60 * 60 * 1000))
        : 0,
    }))
    .sort((first, second) => second.daysOverdue - first.daysOverdue);

  const totalReorderInvestment =
    Math.round(
      reorderRecommendations.reduce(
        (sum, item) => sum + (item.estimatedReorderCost ?? 0),
        0,
      ) * 100,
    ) / 100;

  const vendorScorecards = buildVendorScorecards(vendors, openPurchaseOrders);

  return {
    enabled: areErpModulesEnabled(),
    counts: {
      vendors: vendors.length,
      purchaseOrders: purchaseOrders.length,
      openPurchaseOrders: openPurchaseOrders.length,
      receipts,
      reorderRecommendations: reorderRecommendations.length,
      criticalReorders: reorderRecommendations.filter(
        (item) => item.urgency === "CRITICAL",
      ).length,
      overduePurchaseOrders: overduePurchaseOrders.length,
      stockoutItems: stockoutCount,
      onHandUnits: inventoryAggregate._sum.quantity ?? 0,
      reservedUnits: inventoryAggregate._sum.reserved ?? 0,
      openPurchaseOrderValue: Math.round(openPurchaseOrderValue * 100) / 100,
      totalReorderInvestment,
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
    vendorScorecards,
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
    overduePurchaseOrders,
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

function buildVendorScorecards(
  vendors: Array<{
    id: string;
    name: string;
    leadTimeDays: number;
    status: string;
    purchaseOrders: Array<{
      status: string;
      total: Prisma.Decimal;
      expectedAt: Date | null;
      receivedAt: Date | null;
      orderedAt: Date | null;
    }>;
  }>,
  openPurchaseOrders: Array<{
    total: Prisma.Decimal;
    expectedAt: Date | null;
    vendor: { id: string };
  }>,
) {
  const openValueByVendor = new Map<string, number>();
  for (const order of openPurchaseOrders) {
    openValueByVendor.set(
      order.vendor.id,
      (openValueByVendor.get(order.vendor.id) ?? 0) + Number(order.total),
    );
  }

  return vendors
    .map((vendor) => {
      const received = vendor.purchaseOrders.filter(
        (order) => order.receivedAt,
      );
      const onTime = received.filter(
        (order) =>
          order.expectedAt &&
          order.receivedAt &&
          order.receivedAt.getTime() <= order.expectedAt.getTime(),
      );
      const leadTimes = received
        .filter((order) => order.orderedAt && order.receivedAt)
        .map(
          (order) =>
            (order.receivedAt!.getTime() - order.orderedAt!.getTime()) /
            (24 * 60 * 60 * 1000),
        );
      const actualLeadTime =
        leadTimes.length > 0
          ? Math.round(
              leadTimes.reduce((sum, value) => sum + value, 0) /
                leadTimes.length,
            )
          : null;

      return {
        id: vendor.id,
        name: vendor.name,
        status: vendor.status,
        declaredLeadTimeDays: vendor.leadTimeDays,
        actualLeadTimeDays: actualLeadTime,
        receivedOrders: received.length,
        onTimeRate:
          received.length > 0
            ? Math.round((onTime.length / received.length) * 100)
            : null,
        openValue:
          Math.round((openValueByVendor.get(vendor.id) ?? 0) * 100) / 100,
      };
    })
    .sort((first, second) => second.openValue - first.openValue);
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
