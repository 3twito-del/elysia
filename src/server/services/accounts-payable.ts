import { db } from "~/server/db";
import { DEFAULT_VAT_RATE } from "~/server/services/erp";
import {
  ACCOUNT,
  buildVendorInvoiceJournalLines,
  buildVendorPaymentJournalLines,
  postJournalEntry,
} from "~/server/services/ledger";

/**
 * Accounts Payable (Phase 1).
 *
 * Flow: createVendorInvoice → matchVendorInvoice (3-way) → approveVendorInvoice
 * (posts GRNI/VAT → AP) → recordVendorPayment (posts AP → Cash). Aging reports
 * the open AP sub-ledger. Pure helpers are exported for unit testing.
 */

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export function computeVendorInvoiceTotals(input: {
  lines: Array<{ quantity: number; unitCost: number }>;
  taxRate?: number;
  taxTotal?: number;
}) {
  const subtotal = round2(
    input.lines.reduce((sum, line) => sum + line.quantity * line.unitCost, 0),
  );
  const taxTotal = Math.max(
    0,
    round2(input.taxTotal ?? subtotal * (input.taxRate ?? DEFAULT_VAT_RATE)),
  );

  return { subtotal, taxTotal, total: round2(subtotal + taxTotal) };
}

export type ThreeWayMatchLine = {
  purchaseOrderItemId: string | null;
  invoicedQuantity: number;
  invoicedUnitCost: number;
  orderedQuantity: number | null;
  receivedQuantity: number | null;
  poUnitCost: number | null;
  issues: string[];
};

/**
 * Compares invoice lines against the purchase order (ordered + received) — the
 * classic 3-way match. Pure. Flags over-receipt, over-order and price variance.
 */
export function computeThreeWayMatch(input: {
  poItems: Array<{
    id: string;
    quantity: number;
    unitCost: number;
    receivedQuantity: number;
  }>;
  invoiceLines: Array<{
    purchaseOrderItemId?: string | null;
    quantity: number;
    unitCost: number;
  }>;
  priceTolerance?: number;
}): { status: "MATCHED" | "VARIANCE"; lines: ThreeWayMatchLine[] } {
  const tolerance = input.priceTolerance ?? 0.01;
  const poById = new Map(input.poItems.map((item) => [item.id, item]));

  const lines = input.invoiceLines.map((line): ThreeWayMatchLine => {
    const issues: string[] = [];
    const poItem = line.purchaseOrderItemId
      ? (poById.get(line.purchaseOrderItemId) ?? null)
      : null;

    if (!poItem) {
      issues.push("no_matching_po_line");
      return {
        purchaseOrderItemId: line.purchaseOrderItemId ?? null,
        invoicedQuantity: line.quantity,
        invoicedUnitCost: line.unitCost,
        orderedQuantity: null,
        receivedQuantity: null,
        poUnitCost: null,
        issues,
      };
    }

    if (line.quantity > poItem.receivedQuantity) {
      issues.push("invoiced_more_than_received");
    }
    if (line.quantity > poItem.quantity) {
      issues.push("invoiced_more_than_ordered");
    }

    const priceDelta =
      poItem.unitCost === 0
        ? line.unitCost === 0
          ? 0
          : 1
        : Math.abs(line.unitCost - poItem.unitCost) / poItem.unitCost;
    if (priceDelta > tolerance) issues.push("price_variance");

    return {
      purchaseOrderItemId: poItem.id,
      invoicedQuantity: line.quantity,
      invoicedUnitCost: line.unitCost,
      orderedQuantity: poItem.quantity,
      receivedQuantity: poItem.receivedQuantity,
      poUnitCost: poItem.unitCost,
      issues,
    };
  });

  const status = lines.every((line) => line.issues.length === 0)
    ? "MATCHED"
    : "VARIANCE";

  return { status, lines };
}

export type ApAgingBuckets = {
  notDue: number;
  days1to30: number;
  days31to60: number;
  days61to90: number;
  days90plus: number;
  total: number;
};

const dayMs = 24 * 60 * 60 * 1000;

/** Buckets open AP obligations by days overdue against `asOf`. Pure. */
export function computeApAging(
  invoices: Array<{
    total: number;
    paidTotal: number;
    dueDate: Date | null;
    status: string;
  }>,
  asOf: Date = new Date(),
): ApAgingBuckets {
  const buckets: ApAgingBuckets = {
    notDue: 0,
    days1to30: 0,
    days31to60: 0,
    days61to90: 0,
    days90plus: 0,
    total: 0,
  };

  for (const invoice of invoices) {
    if (invoice.status === "PAID" || invoice.status === "CANCELLED") continue;

    const outstanding = round2(invoice.total - invoice.paidTotal);
    if (outstanding <= 0) continue;

    buckets.total = round2(buckets.total + outstanding);

    if (!invoice.dueDate || invoice.dueDate >= asOf) {
      buckets.notDue = round2(buckets.notDue + outstanding);
      continue;
    }

    const daysOverdue = Math.floor(
      (asOf.getTime() - invoice.dueDate.getTime()) / dayMs,
    );
    if (daysOverdue <= 30) {
      buckets.days1to30 = round2(buckets.days1to30 + outstanding);
    } else if (daysOverdue <= 60) {
      buckets.days31to60 = round2(buckets.days31to60 + outstanding);
    } else if (daysOverdue <= 90) {
      buckets.days61to90 = round2(buckets.days61to90 + outstanding);
    } else {
      buckets.days90plus = round2(buckets.days90plus + outstanding);
    }
  }

  return buckets;
}

export async function createVendorInvoice(input: {
  vendorId: string;
  invoiceNumber: string;
  purchaseOrderId?: string;
  invoiceDate: Date;
  dueDate?: Date;
  currency?: string;
  taxRate?: number;
  taxTotal?: number;
  notes?: string;
  lines: Array<{
    purchaseOrderItemId?: string;
    description: string;
    quantity: number;
    unitCost: number;
  }>;
}) {
  const totals = computeVendorInvoiceTotals({
    lines: input.lines,
    taxRate: input.taxRate,
    taxTotal: input.taxTotal,
  });

  return db.vendorInvoice.create({
    data: {
      invoiceNumber: input.invoiceNumber,
      vendorId: input.vendorId,
      purchaseOrderId: input.purchaseOrderId,
      currency: input.currency ?? "ILS",
      subtotal: totals.subtotal,
      taxTotal: totals.taxTotal,
      total: totals.total,
      invoiceDate: input.invoiceDate,
      dueDate: input.dueDate,
      notes: input.notes,
      lines: {
        create: input.lines.map((line) => ({
          purchaseOrderItemId: line.purchaseOrderItemId,
          description: line.description,
          quantity: line.quantity,
          unitCost: line.unitCost,
          lineTotal: round2(line.quantity * line.unitCost),
        })),
      },
    },
    include: { lines: true, vendor: true },
  });
}

/** Runs the 3-way match against the linked PO and records the result status. */
export async function matchVendorInvoice(invoiceId: string) {
  const invoice = await db.vendorInvoice.findUnique({
    where: { id: invoiceId },
    include: { lines: true },
  });
  if (!invoice) throw new Error("Vendor invoice not found.");

  if (!invoice.purchaseOrderId) {
    await db.vendorInvoice.update({
      where: { id: invoice.id },
      data: { status: "VARIANCE" },
    });
    return { status: "VARIANCE" as const, lines: [], reason: "no_purchase_order" };
  }

  const purchaseOrder = await db.purchaseOrder.findUnique({
    where: { id: invoice.purchaseOrderId },
    include: { items: true },
  });
  if (!purchaseOrder) throw new Error("Linked purchase order not found.");

  const match = computeThreeWayMatch({
    poItems: purchaseOrder.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      unitCost: Number(item.unitCost),
      receivedQuantity: item.receivedQuantity,
    })),
    invoiceLines: invoice.lines.map((line) => ({
      purchaseOrderItemId: line.purchaseOrderItemId,
      quantity: line.quantity,
      unitCost: Number(line.unitCost),
    })),
  });

  await db.vendorInvoice.update({
    where: { id: invoice.id },
    data: { status: match.status },
  });

  return match;
}

/**
 * Approves an invoice and posts the GL entry that clears GRNI (+ VAT input)
 * into Accounts Payable. Requires a non-variance status unless `force` is set.
 */
export async function approveVendorInvoice(input: {
  invoiceId: string;
  postedById?: string;
  force?: boolean;
}) {
  return db.$transaction(async (tx) => {
    const invoice = await tx.vendorInvoice.findUnique({
      where: { id: input.invoiceId },
    });
    if (!invoice) throw new Error("Vendor invoice not found.");
    if (["APPROVED", "PARTIALLY_PAID", "PAID"].includes(invoice.status)) {
      throw new Error("Vendor invoice already approved.");
    }
    if (invoice.status === "VARIANCE" && !input.force) {
      throw new Error(
        "Vendor invoice has match variances; approve with force to override.",
      );
    }

    const ledgerReady = await tx.ledgerAccount.count({
      where: { code: { in: [ACCOUNT.GRNI, ACCOUNT.ACCOUNTS_PAYABLE] } },
    });
    if (ledgerReady >= 2) {
      await postJournalEntry(
        {
          entryDate: invoice.invoiceDate,
          memo: `חשבונית ספק ${invoice.invoiceNumber}`,
          source: "vendor_invoice",
          currency: invoice.currency,
          aggregateType: "VendorInvoice",
          aggregateId: invoice.id,
          purchaseOrderId: invoice.purchaseOrderId ?? undefined,
          postedById: input.postedById,
          lines: buildVendorInvoiceJournalLines({
            goodsValue: Number(invoice.subtotal),
            taxTotal: Number(invoice.taxTotal),
          }),
        },
        tx,
      );
    }

    return tx.vendorInvoice.update({
      where: { id: invoice.id },
      data: { status: "APPROVED", approvedAt: new Date() },
    });
  });
}

/**
 * Records a vendor payment, allocates it across invoices (updating their paid
 * totals/status) and posts the AP → Cash GL entry. All in one transaction.
 */
export async function recordVendorPayment(input: {
  vendorId: string;
  amount: number;
  currency?: string;
  method?: string;
  reference?: string;
  paidAt?: Date;
  notes?: string;
  postedById?: string;
  withheldTax?: number;
  allocations: Array<{ vendorInvoiceId: string; amount: number }>;
}) {
  const amount = round2(input.amount);
  const withheldTax = round2(Math.max(0, input.withheldTax ?? 0));
  const allocationTotal = round2(
    input.allocations.reduce((sum, allocation) => sum + allocation.amount, 0),
  );
  if (allocationTotal > amount + 0.005) {
    throw new Error("Allocations exceed the payment amount.");
  }

  return db.$transaction(async (tx) => {
    const payment = await tx.vendorPayment.create({
      data: {
        vendorId: input.vendorId,
        amount,
        withheldTax,
        currency: input.currency ?? "ILS",
        method: input.method ?? "bank_transfer",
        reference: input.reference,
        paidAt: input.paidAt ?? new Date(),
        notes: input.notes,
        allocations: {
          create: input.allocations.map((allocation) => ({
            vendorInvoiceId: allocation.vendorInvoiceId,
            amount: round2(allocation.amount),
          })),
        },
      },
      include: { allocations: true },
    });

    for (const allocation of input.allocations) {
      const invoice = await tx.vendorInvoice.findUnique({
        where: { id: allocation.vendorInvoiceId },
        select: { id: true, total: true, paidTotal: true },
      });
      if (!invoice) throw new Error("Allocated vendor invoice not found.");

      const newPaidTotal = round2(
        Number(invoice.paidTotal) + round2(allocation.amount),
      );
      const fullyPaid = newPaidTotal >= Number(invoice.total) - 0.005;

      await tx.vendorInvoice.update({
        where: { id: invoice.id },
        data: {
          paidTotal: newPaidTotal,
          status: fullyPaid ? "PAID" : "PARTIALLY_PAID",
        },
      });
    }

    const ledgerReady = await tx.ledgerAccount.count({
      where: { code: { in: [ACCOUNT.ACCOUNTS_PAYABLE, ACCOUNT.CASH] } },
    });
    if (ledgerReady >= 2 && amount > 0) {
      await postJournalEntry(
        {
          entryDate: input.paidAt ?? new Date(),
          memo: `תשלום לספק (${input.reference ?? payment.id})`,
          source: "vendor_payment",
          currency: input.currency ?? "ILS",
          aggregateType: "VendorPayment",
          aggregateId: payment.id,
          postedById: input.postedById,
          lines: buildVendorPaymentJournalLines({ amount }),
        },
        tx,
      );
    }

    return payment;
  });
}

/**
 * Parses free-text invoice lines ("description | quantity | unitCost" per line).
 * Pure; exported for testing and reused by the AP/AR create forms.
 */
export function parseInvoiceLines(
  text: string,
): Array<{ description: string; quantity: number; unitCost: number }> {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const [description, quantity, unitCost] = line
        .split("|")
        .map((part) => part.trim());

      return {
        description: description ?? line,
        quantity: Math.max(1, Math.trunc(Number(quantity) || 1)),
        unitCost: Math.max(0, Number(unitCost) || 0),
      };
    })
    .filter((line) => line.description.length > 0);
}

/** Active vendors for a create-invoice select. */
export async function listVendorsForSelect() {
  return db.vendor.findMany({
    where: { status: "ACTIVE" },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

/** Recent vendor invoices for the AP workbench. */
export async function listVendorInvoices(limit = 20) {
  const invoices = await db.vendorInvoice.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      invoiceNumber: true,
      vendorId: true,
      status: true,
      total: true,
      paidTotal: true,
      currency: true,
      dueDate: true,
      createdAt: true,
      vendor: { select: { name: true } },
    },
  });

  return invoices.map((invoice) => ({
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    vendorId: invoice.vendorId,
    status: invoice.status,
    total: Number(invoice.total),
    paidTotal: Number(invoice.paidTotal),
    outstanding: Number(invoice.total) - Number(invoice.paidTotal),
    currency: invoice.currency,
    dueDate: invoice.dueDate,
    vendorName: invoice.vendor.name,
    createdAt: invoice.createdAt,
  }));
}

/** Aging of the open AP sub-ledger (approved + partially-paid invoices). */
export async function getApAging(asOf: Date = new Date()) {
  const invoices = await db.vendorInvoice.findMany({
    where: { status: { in: ["APPROVED", "PARTIALLY_PAID"] } },
    select: { total: true, paidTotal: true, dueDate: true, status: true },
  });

  return computeApAging(
    invoices.map((invoice) => ({
      total: Number(invoice.total),
      paidTotal: Number(invoice.paidTotal),
      dueDate: invoice.dueDate,
      status: invoice.status,
    })),
    asOf,
  );
}
