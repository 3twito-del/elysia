import { db } from "~/server/db";
import { writeAdminAudit } from "~/server/services/admin-commerce-workflow";
import { DEFAULT_VAT_RATE } from "~/server/services/erp";
import {
  ACCOUNT,
  buildCustomerReceiptJournalLines,
  buildSaleJournalLines,
  postJournalEntry,
} from "~/server/services/ledger";

/**
 * Accounts Receivable (Phase 1.2).
 *
 * Flow: createCustomerInvoice → issueCustomerInvoice (posts AR + revenue + VAT,
 * unless the linked order's sale was already posted) → recordCustomerReceipt
 * (posts Cash → AR). Aging reports the open AR sub-ledger. Pure helpers are
 * exported for unit testing.
 *
 * Double-count guard: prepaid e-commerce orders already recognise revenue/AR via
 * finance.postOrderSaleToLedger (source "sale") at payment capture. Issuing an
 * invoice for such an order produces the document only and does not re-post.
 */

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export function computeCustomerInvoiceTotals(input: {
  lines: Array<{ quantity: number; unitPrice: number }>;
  taxRate?: number;
  taxTotal?: number;
}) {
  const subtotal = round2(
    input.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0),
  );
  const taxTotal = Math.max(
    0,
    round2(input.taxTotal ?? subtotal * (input.taxRate ?? DEFAULT_VAT_RATE)),
  );

  return { subtotal, taxTotal, total: round2(subtotal + taxTotal) };
}

export type ArAgingBuckets = {
  notDue: number;
  days1to30: number;
  days31to60: number;
  days61to90: number;
  days90plus: number;
  total: number;
};

const dayMs = 24 * 60 * 60 * 1000;

/** Buckets open AR obligations by days overdue against `asOf`. Pure. */
export function computeArAging(
  invoices: Array<{
    total: number;
    paidTotal: number;
    dueDate: Date | null;
    status: string;
  }>,
  asOf: Date = new Date(),
): ArAgingBuckets {
  const buckets: ArAgingBuckets = {
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

async function createNextCustomerInvoiceNumber() {
  const today = new Date();
  const prefix = `INV-${today.getUTCFullYear()}${String(
    today.getUTCMonth() + 1,
  ).padStart(2, "0")}`;
  const count = await db.customerInvoice.count({
    where: { invoiceNumber: { startsWith: prefix } },
  });

  return `${prefix}-${String(count + 1).padStart(5, "0")}`;
}

export async function createCustomerInvoice(input: {
  customerId?: string;
  orderId?: string;
  invoiceNumber?: string;
  invoiceDate: Date;
  dueDate?: Date;
  currency?: string;
  taxRate?: number;
  taxTotal?: number;
  notes?: string;
  lines: Array<{
    orderItemId?: string;
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
  /** Present only when an admin directly creates the invoice (not when this
   * is a step inside another audited flow, e.g. quote conversion or
   * subscription billing — those already write their own audit row). */
  adminUserId?: string;
}) {
  const totals = computeCustomerInvoiceTotals({
    lines: input.lines,
    taxRate: input.taxRate,
    taxTotal: input.taxTotal,
  });

  return db.$transaction(async (tx) => {
    const invoice = await tx.customerInvoice.create({
      data: {
        invoiceNumber:
          input.invoiceNumber ?? (await createNextCustomerInvoiceNumber()),
        customerId: input.customerId,
        orderId: input.orderId,
        currency: input.currency ?? "ILS",
        subtotal: totals.subtotal,
        taxTotal: totals.taxTotal,
        total: totals.total,
        invoiceDate: input.invoiceDate,
        dueDate: input.dueDate,
        notes: input.notes,
        lines: {
          create: input.lines.map((line) => ({
            orderItemId: line.orderItemId,
            description: line.description,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            lineTotal: round2(line.quantity * line.unitPrice),
          })),
        },
      },
      include: { lines: true, customer: true },
    });

    if (input.adminUserId) {
      await writeAdminAudit(tx, {
        adminUserId: input.adminUserId,
        action: "customer_invoice_created",
        entity: "CustomerInvoice",
        entityId: invoice.id,
        metadata: { invoiceNumber: invoice.invoiceNumber, total: totals.total },
      });
    }

    return invoice;
  });
}

/**
 * Issues an invoice and posts the AR + revenue + VAT entry — unless the linked
 * order's sale was already posted to the GL (then the invoice is document-only,
 * avoiding double recognition).
 */
export async function issueCustomerInvoice(input: {
  invoiceId: string;
  postedById?: string;
}) {
  return db.$transaction(async (tx) => {
    const invoice = await tx.customerInvoice.findUnique({
      where: { id: input.invoiceId },
    });
    if (!invoice) throw new Error("Customer invoice not found.");
    if (["ISSUED", "PARTIALLY_PAID", "PAID"].includes(invoice.status)) {
      throw new Error("Customer invoice already issued.");
    }

    let alreadyRecognized = false;
    if (invoice.orderId) {
      const saleEntry = await tx.journalEntry.findFirst({
        where: { orderId: invoice.orderId, source: "sale" },
        select: { id: true },
      });
      alreadyRecognized = Boolean(saleEntry);
    }

    const ledgerReady = await tx.ledgerAccount.count({
      where: {
        code: { in: [ACCOUNT.ACCOUNTS_RECEIVABLE, ACCOUNT.SALES_REVENUE] },
      },
    });
    if (!alreadyRecognized && ledgerReady >= 2) {
      await postJournalEntry(
        {
          entryDate: invoice.invoiceDate,
          memo: `חשבונית לקוח ${invoice.invoiceNumber}`,
          source: "customer_invoice",
          currency: invoice.currency,
          aggregateType: "CustomerInvoice",
          aggregateId: invoice.id,
          orderId: invoice.orderId ?? undefined,
          postedById: input.postedById,
          lines: buildSaleJournalLines({
            grossTotal: Number(invoice.total),
            vatTotal: Number(invoice.taxTotal),
          }),
        },
        tx,
      );
    }

    return tx.customerInvoice.update({
      where: { id: invoice.id },
      data: { status: "ISSUED", issuedAt: new Date() },
    });
  });
}

/**
 * Records a customer receipt, allocates it across invoices (updating paid
 * totals/status) and posts the Cash → AR GL entry. All in one transaction.
 */
export async function recordCustomerReceipt(input: {
  customerId?: string;
  amount: number;
  currency?: string;
  method?: string;
  reference?: string;
  receivedAt?: Date;
  notes?: string;
  postedById?: string;
  allocations: Array<{ customerInvoiceId: string; amount: number }>;
}) {
  const amount = round2(input.amount);
  const allocationTotal = round2(
    input.allocations.reduce((sum, allocation) => sum + allocation.amount, 0),
  );
  if (allocationTotal > amount + 0.005) {
    throw new Error("Allocations exceed the receipt amount.");
  }

  return db.$transaction(async (tx) => {
    const receipt = await tx.customerReceipt.create({
      data: {
        customerId: input.customerId,
        amount,
        currency: input.currency ?? "ILS",
        method: input.method ?? "card",
        reference: input.reference,
        receivedAt: input.receivedAt ?? new Date(),
        notes: input.notes,
        allocations: {
          create: input.allocations.map((allocation) => ({
            customerInvoiceId: allocation.customerInvoiceId,
            amount: round2(allocation.amount),
          })),
        },
      },
      include: { allocations: true },
    });

    for (const allocation of input.allocations) {
      const invoice = await tx.customerInvoice.findUnique({
        where: { id: allocation.customerInvoiceId },
        select: { id: true, total: true, paidTotal: true },
      });
      if (!invoice) throw new Error("Allocated customer invoice not found.");

      const newPaidTotal = round2(
        Number(invoice.paidTotal) + round2(allocation.amount),
      );
      const fullyPaid = newPaidTotal >= Number(invoice.total) - 0.005;

      await tx.customerInvoice.update({
        where: { id: invoice.id },
        data: {
          paidTotal: newPaidTotal,
          status: fullyPaid ? "PAID" : "PARTIALLY_PAID",
        },
      });
    }

    const ledgerReady = await tx.ledgerAccount.count({
      where: { code: { in: [ACCOUNT.CASH, ACCOUNT.ACCOUNTS_RECEIVABLE] } },
    });
    if (ledgerReady >= 2 && amount > 0) {
      await postJournalEntry(
        {
          entryDate: input.receivedAt ?? new Date(),
          memo: `תקבול מלקוח (${input.reference ?? receipt.id})`,
          source: "customer_receipt",
          currency: input.currency ?? "ILS",
          aggregateType: "CustomerReceipt",
          aggregateId: receipt.id,
          postedById: input.postedById,
          lines: buildCustomerReceiptJournalLines({ amount }),
        },
        tx,
      );
    }

    return receipt;
  });
}

/** Recent customer invoices for the AR workbench. */
export async function listCustomerInvoices(limit = 20) {
  const invoices = await db.customerInvoice.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      invoiceNumber: true,
      customerId: true,
      status: true,
      total: true,
      paidTotal: true,
      currency: true,
      dueDate: true,
      createdAt: true,
      customer: {
        select: { firstName: true, lastName: true, email: true },
      },
    },
  });

  return invoices.map((invoice) => {
    const name = [invoice.customer?.firstName, invoice.customer?.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();

    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerId: invoice.customerId,
      status: invoice.status,
      total: Number(invoice.total),
      paidTotal: Number(invoice.paidTotal),
      outstanding: Number(invoice.total) - Number(invoice.paidTotal),
      currency: invoice.currency,
      dueDate: invoice.dueDate,
      customerName:
        name.length > 0 ? name : (invoice.customer?.email ?? "לקוח ללא שם"),
      createdAt: invoice.createdAt,
    };
  });
}

/** Aging of the open AR sub-ledger (issued + partially-paid invoices). */
export async function getArAging(asOf: Date = new Date()) {
  const invoices = await db.customerInvoice.findMany({
    where: { status: { in: ["ISSUED", "PARTIALLY_PAID"] } },
    select: { total: true, paidTotal: true, dueDate: true, status: true },
  });

  return computeArAging(
    invoices.map((invoice) => ({
      total: Number(invoice.total),
      paidTotal: Number(invoice.paidTotal),
      dueDate: invoice.dueDate,
      status: invoice.status,
    })),
    asOf,
  );
}
