import { db } from "~/server/db";
import { createCustomerInvoice } from "~/server/services/accounts-receivable";
import { writeAdminAudit } from "~/server/services/admin-commerce-workflow";
import { DEFAULT_VAT_RATE } from "~/server/services/erp";

/**
 * CRM quotes / proposals (CRM-SAL-002): Lead → Opportunity → Quote → Invoice.
 * Pure helpers are exported for unit testing.
 */

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export function computeQuoteTotals(input: {
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

/** A quote is expired when it has been sent and its validity date has passed. */
export function isQuoteExpired(
  quote: { status: string; validUntil: Date | null },
  asOf: Date = new Date(),
): boolean {
  if (quote.status !== "SENT") return false;
  if (!quote.validUntil) return false;

  return quote.validUntil < asOf;
}

async function createNextQuoteNumber() {
  const today = new Date();
  const prefix = `QUO-${today.getUTCFullYear()}${String(
    today.getUTCMonth() + 1,
  ).padStart(2, "0")}`;
  const count = await db.quote.count({
    where: { quoteNumber: { startsWith: prefix } },
  });

  return `${prefix}-${String(count + 1).padStart(5, "0")}`;
}

export async function createQuote(input: {
  opportunityId?: string;
  customerId?: string;
  quoteNumber?: string;
  currency?: string;
  validUntil?: Date;
  taxRate?: number;
  taxTotal?: number;
  notes?: string;
  lines: Array<{ description: string; quantity: number; unitPrice: number }>;
  adminUserId: string;
}) {
  const totals = computeQuoteTotals({
    lines: input.lines,
    taxRate: input.taxRate,
    taxTotal: input.taxTotal,
  });
  const quoteNumber = input.quoteNumber ?? (await createNextQuoteNumber());

  return db.$transaction(async (tx) => {
    const quote = await tx.quote.create({
      data: {
        quoteNumber,
        opportunityId: input.opportunityId,
        customerId: input.customerId,
        currency: input.currency ?? "ILS",
        subtotal: totals.subtotal,
        taxTotal: totals.taxTotal,
        total: totals.total,
        validUntil: input.validUntil,
        notes: input.notes,
        lines: {
          create: input.lines.map((line) => ({
            description: line.description,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            lineTotal: round2(line.quantity * line.unitPrice),
          })),
        },
      },
      include: { lines: true },
    });

    await writeAdminAudit(tx, {
      adminUserId: input.adminUserId,
      action: "quote_created",
      entity: "Quote",
      entityId: quote.id,
      metadata: { quoteNumber: quote.quoteNumber, total: totals.total },
    });

    return quote;
  });
}

export async function sendQuote(quoteId: string, adminUserId: string) {
  return db.$transaction(async (tx) => {
    const quote = await tx.quote.update({
      where: { id: quoteId },
      data: { status: "SENT", sentAt: new Date() },
    });

    await writeAdminAudit(tx, {
      adminUserId,
      action: "quote_sent",
      entity: "Quote",
      entityId: quote.id,
      metadata: { quoteNumber: quote.quoteNumber },
    });

    return quote;
  });
}

/**
 * Records the customer's decision. Accepting a quote also marks the linked
 * opportunity WON (probability 100).
 */
export async function decideQuote(input: {
  quoteId: string;
  decision: "ACCEPTED" | "DECLINED";
  adminUserId: string;
}) {
  return db.$transaction(async (tx) => {
    const quote = await tx.quote.update({
      where: { id: input.quoteId },
      data: { status: input.decision, decidedAt: new Date() },
    });

    if (input.decision === "ACCEPTED" && quote.opportunityId) {
      await tx.opportunity.update({
        where: { id: quote.opportunityId },
        data: {
          stage: "WON",
          status: "WON",
          probability: 100,
          closedAt: new Date(),
        },
      });
    }

    await writeAdminAudit(tx, {
      adminUserId: input.adminUserId,
      action: "quote_decided",
      entity: "Quote",
      entityId: quote.id,
      metadata: { decision: input.decision },
    });

    return quote;
  });
}

/** Converts an accepted quote into a customer invoice (AR), reusing its lines. */
export async function convertQuoteToInvoice(input: {
  quoteId: string;
  invoiceDate?: Date;
  dueDate?: Date;
  adminUserId: string;
}) {
  const quote = await db.quote.findUnique({
    where: { id: input.quoteId },
    include: { lines: true },
  });
  if (!quote) throw new Error("Quote not found.");

  const invoice = await createCustomerInvoice({
    customerId: quote.customerId ?? undefined,
    invoiceDate: input.invoiceDate ?? new Date(),
    dueDate: input.dueDate,
    currency: quote.currency,
    taxTotal: Number(quote.taxTotal),
    notes: `מהצעת מחיר ${quote.quoteNumber}`,
    lines: quote.lines.map((line) => ({
      description: line.description,
      quantity: line.quantity,
      unitPrice: Number(line.unitPrice),
    })),
  });

  await writeAdminAudit(db, {
    adminUserId: input.adminUserId,
    action: "quote_converted_to_invoice",
    entity: "Quote",
    entityId: quote.id,
    metadata: { quoteNumber: quote.quoteNumber, invoiceId: invoice.id },
  });

  return invoice;
}

/** Marks sent quotes whose validity has passed as EXPIRED. Returns the count. */
export async function expireStaleQuotes(asOf: Date = new Date()) {
  const result = await db.quote.updateMany({
    where: { status: "SENT", validUntil: { lt: asOf } },
    data: { status: "EXPIRED" },
  });

  return result.count;
}

/** Recent quotes for the CRM workbench. */
export async function listRecentQuotes(limit = 15) {
  const quotes = await db.quote.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      quoteNumber: true,
      status: true,
      total: true,
      currency: true,
      validUntil: true,
      createdAt: true,
    },
  });

  return quotes.map((quote) => ({ ...quote, total: Number(quote.total) }));
}

/**
 * Parses free-text quote lines ("description | quantity | unitPrice" per line)
 * into structured line inputs. Pure; exported for testing.
 */
export function parseQuoteLines(
  text: string,
): Array<{ description: string; quantity: number; unitPrice: number }> {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const [description, quantity, unitPrice] = line
        .split("|")
        .map((part) => part.trim());

      return {
        description: description ?? line,
        quantity: Math.max(1, Math.trunc(Number(quantity) || 1)),
        unitPrice: Math.max(0, Number(unitPrice) || 0),
      };
    })
    .filter((line) => line.description.length > 0);
}
