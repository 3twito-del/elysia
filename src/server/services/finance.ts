import { Prisma } from "@prisma/client";

import { db } from "~/server/db";
import { getApAging } from "~/server/services/accounts-payable";
import { getArAging } from "~/server/services/accounts-receivable";
import { DEFAULT_VAT_RATE } from "~/server/services/erp";
import { computeTrialBalance, postSaleJournalEntry } from "~/server/services/ledger";
import { ACCOUNT } from "~/server/services/ledger-accounts";

export type FinanceDateRange = {
  from?: Date;
  to?: Date;
};

const revenueStatuses = [
  "PAID",
  "PREPARING",
  "READY_FOR_PICKUP",
  "SHIPPED",
  "COMPLETED",
] as const;

export async function getFinanceOverview(
  input: {
    adminUserId?: string;
    range?: FinanceDateRange;
  } = {},
) {
  const range = normalizeFinanceRange(input.range);

  await auditFinanceAccess({
    adminUserId: input.adminUserId,
    action: "admin_finance_overview_viewed",
    metadata: {
      from: range.from.toISOString(),
      to: range.to.toISOString(),
    },
  });

  const [orders, payments, refunds, purchaseOrders, ledgerEntries] =
    await Promise.all([
      db.order.findMany({
        where: {
          createdAt: { gte: range.from, lt: range.to },
          status: { in: [...revenueStatuses] },
        },
        include: {
          items: {
            include: {
              variant: {
                select: {
                  id: true,
                  productId: true,
                  product: {
                    select: {
                      costSnapshots: {
                        orderBy: { effectiveAt: "desc" },
                        take: 1,
                      },
                    },
                  },
                },
              },
            },
          },
          payments: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      db.payment.aggregate({
        where: {
          capturedAt: { gte: range.from, lt: range.to },
          status: "CAPTURED",
        },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      db.payment.aggregate({
        where: {
          refundedAt: { gte: range.from, lt: range.to },
          status: "REFUNDED",
        },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      db.purchaseOrder.aggregate({
        where: {
          orderedAt: { gte: range.from, lt: range.to },
          status: { not: "DRAFT" },
        },
        _sum: { total: true },
        _count: { _all: true },
      }),
      db.financeLedgerEntry.findMany({
        where: {
          entryDate: { gte: range.from, lt: range.to },
        },
        orderBy: { entryDate: "desc" },
        take: 40,
      }),
    ]);

  const revenue = orders.reduce((sum, order) => sum + Number(order.total), 0);
  const cogs = orders.reduce(
    (sum, order) => sum + estimateOrderCogs(order.items),
    0,
  );
  const grossMargin = revenue - cogs;
  const grossMarginRate = revenue > 0 ? grossMargin / revenue : 0;

  return {
    range,
    kpis: {
      revenue,
      capturedPayments: toNumber(payments._sum.amount),
      capturedPaymentCount: payments._count._all,
      refunds: toNumber(refunds._sum.amount),
      refundCount: refunds._count._all,
      cogs,
      grossMargin,
      grossMarginRate,
      averageOrderValue: orders.length > 0 ? revenue / orders.length : 0,
      orderCount: orders.length,
      purchaseCommitted: toNumber(purchaseOrders._sum.total),
      purchaseOrderCount: purchaseOrders._count._all,
    },
    ledgerEntries: ledgerEntries.map((entry) => ({
      id: entry.id,
      entryDate: entry.entryDate,
      type: entry.type,
      category: entry.category,
      source: entry.source,
      amount: Number(entry.amount),
      currency: entry.currency,
      debit: entry.debit ? Number(entry.debit) : null,
      credit: entry.credit ? Number(entry.credit) : null,
      description: entry.description,
      orderId: entry.orderId,
      purchaseOrderId: entry.purchaseOrderId,
    })),
    topOrders: orders.slice(0, 10).map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      total: Number(order.total),
      cogs: estimateOrderCogs(order.items),
      grossMargin: Number(order.total) - estimateOrderCogs(order.items),
      paymentStatus: order.payments[0]?.status ?? "PENDING",
      createdAt: order.createdAt,
    })),
    freshness: { generatedAt: new Date(), source: "live-database" as const },
  };
}

export async function refreshFinanceLedgerFromOrders(
  input: FinanceDateRange = {},
) {
  const range = normalizeFinanceRange(input);
  const orders = await db.order.findMany({
    where: {
      createdAt: { gte: range.from, lt: range.to },
      status: { in: [...revenueStatuses] },
    },
    include: {
      items: {
        include: {
          variant: {
            select: {
              id: true,
              productId: true,
              product: {
                select: {
                  costSnapshots: {
                    orderBy: { effectiveAt: "desc" },
                    take: 1,
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  await db.financeLedgerEntry.deleteMany({
    where: {
      source: "order_sync",
      entryDate: { gte: range.from, lt: range.to },
    },
  });

  if (orders.length === 0) return { created: 0 };

  const entries = orders.flatMap((order) => {
    const cogs = estimateOrderCogs(order.items);
    const revenue = Number(order.total);

    return [
      {
        entryDate: truncateDate(order.createdAt),
        type: "revenue",
        category: "sales",
        source: "order_sync",
        aggregateType: "Order",
        aggregateId: order.id,
        orderId: order.id,
        amount: revenue,
        currency: order.currency,
        credit: revenue,
        description: `Revenue for order ${order.orderNumber}`,
        metadata: { orderNumber: order.orderNumber },
      },
      {
        entryDate: truncateDate(order.createdAt),
        type: "cogs",
        category: "inventory_cost",
        source: "order_sync",
        aggregateType: "Order",
        aggregateId: order.id,
        orderId: order.id,
        amount: cogs,
        currency: order.currency,
        debit: cogs,
        description: `Estimated COGS for order ${order.orderNumber}`,
        metadata: { orderNumber: order.orderNumber, estimated: true },
      },
    ];
  });

  await db.financeLedgerEntry.createMany({ data: entries });

  return { created: entries.length };
}

export async function refreshFinanceLedgerFromPurchaseOrders(
  input: FinanceDateRange = {},
) {
  const range = normalizeFinanceRange(input);
  const purchaseOrders = await db.purchaseOrder.findMany({
    where: {
      orderedAt: { gte: range.from, lt: range.to },
      status: { not: "DRAFT" },
    },
  });

  await db.financeLedgerEntry.deleteMany({
    where: {
      source: "purchase_order_sync",
      entryDate: { gte: range.from, lt: range.to },
    },
  });

  if (purchaseOrders.length === 0) return { created: 0 };

  await db.financeLedgerEntry.createMany({
    data: purchaseOrders.map((purchaseOrder) => ({
      entryDate: truncateDate(
        purchaseOrder.orderedAt ?? purchaseOrder.createdAt,
      ),
      type: "inventory_purchase",
      category: "procurement",
      source: "purchase_order_sync",
      aggregateType: "PurchaseOrder",
      aggregateId: purchaseOrder.id,
      purchaseOrderId: purchaseOrder.id,
      amount: Number(purchaseOrder.total),
      currency: purchaseOrder.currency,
      debit: Number(purchaseOrder.total),
      description: `Inventory purchase ${purchaseOrder.poNumber}`,
      metadata: { poNumber: purchaseOrder.poNumber },
    })),
  });

  return { created: purchaseOrders.length };
}

/**
 * Posts the double-entry GL journal for a paid sale (revenue + VAT + COGS).
 * Idempotent per order. VAT is extracted from the VAT-inclusive total at the
 * default rate (the order does not store a separate tax breakdown). Skipped
 * gracefully when the chart of accounts has not been seeded (FIN-GL-001).
 */
export async function postOrderSaleToLedger(orderId: string) {
  const ledgerReady = await db.ledgerAccount.count({
    where: {
      code: { in: [ACCOUNT.ACCOUNTS_RECEIVABLE, ACCOUNT.SALES_REVENUE] },
    },
  });
  if (ledgerReady < 2) {
    return { posted: false as const, reason: "chart_of_accounts_missing" };
  }

  const existing = await db.journalEntry.findFirst({
    where: { orderId, source: "sale" },
    select: { id: true },
  });
  if (existing) {
    return {
      posted: false as const,
      reason: "already_posted",
      journalEntryId: existing.id,
    };
  }

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          variant: {
            select: {
              id: true,
              productId: true,
              product: {
                select: {
                  costSnapshots: { orderBy: { effectiveAt: "desc" }, take: 1 },
                },
              },
            },
          },
        },
      },
    },
  });
  if (!order) return { posted: false as const, reason: "order_not_found" };

  const grossTotal = Number(order.total);
  if (grossTotal <= 0) {
    return { posted: false as const, reason: "non_positive_total" };
  }

  const entry = await postSaleJournalEntry({
    orderId: order.id,
    orderNumber: order.orderNumber,
    entryDate: order.paidAt ?? order.createdAt,
    grossTotal,
    vatRate: DEFAULT_VAT_RATE,
    cogs: estimateOrderCogs(order.items),
    branchId: order.branchId ?? undefined,
    currency: order.currency,
  });

  return { posted: true as const, journalEntryId: entry.id };
}

/**
 * Read-only view of the double-entry general ledger for the admin Finance page:
 * cumulative trial balance, recent journal entries (with lines), and AP/AR aging.
 */
export async function getGeneralLedgerOverview(
  input: { range?: FinanceDateRange } = {},
) {
  const range = normalizeFinanceRange(input.range);

  const [trialBalance, recentEntries, apAging, arAging] = await Promise.all([
    computeTrialBalance(),
    db.journalEntry.findMany({
      where: { entryDate: { gte: range.from, lt: range.to } },
      orderBy: [{ entryDate: "desc" }, { createdAt: "desc" }],
      take: 25,
      include: { lines: { include: { account: true } } },
    }),
    getApAging(),
    getArAging(),
  ]);

  return {
    range,
    trialBalance,
    apAging,
    arAging,
    entries: recentEntries.map((entry) => ({
      id: entry.id,
      entryNumber: entry.entryNumber,
      entryDate: entry.entryDate,
      source: entry.source,
      status: entry.status,
      memo: entry.memo,
      lines: entry.lines.map((line) => ({
        code: line.account.code,
        name: line.account.name,
        debit: Number(line.debit),
        credit: Number(line.credit),
      })),
    })),
  };
}

async function auditFinanceAccess(input: {
  adminUserId?: string;
  action: string;
  metadata?: Prisma.InputJsonValue;
}) {
  if (!input.adminUserId) return null;

  return db.auditLog.create({
    data: {
      adminUserId: input.adminUserId,
      action: input.action,
      entity: "FinanceLedgerEntry",
      metadata: input.metadata,
    },
  });
}

function normalizeFinanceRange(range: FinanceDateRange = {}) {
  const to = range.to ?? new Date();
  const from =
    range.from ??
    new Date(to.getFullYear(), to.getMonth(), to.getDate() - 30, 0, 0, 0, 0);

  return { from, to };
}

function estimateOrderCogs(
  items: Array<{
    quantity: number;
    unitPrice: Prisma.Decimal;
    variant: {
      product: { costSnapshots: Array<{ unitCost: Prisma.Decimal }> };
    };
  }>,
) {
  return items.reduce((sum, item) => {
    const unitCost =
      item.variant.product.costSnapshots[0]?.unitCost ??
      new Prisma.Decimal(Number(item.unitPrice) * 0.4);

    return sum + Number(unitCost) * item.quantity;
  }, 0);
}

function truncateDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function toNumber(value: Prisma.Decimal | null | undefined) {
  return value ? Number(value) : 0;
}
