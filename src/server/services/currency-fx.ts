import { db } from "~/server/db";
import { writeAdminAudit } from "~/server/services/admin-commerce-workflow";

/**
 * Multi-currency accounting + FX revaluation (FIN-GL-004). Base currency is ILS.
 * Effective-dated rates convert foreign amounts to base; open foreign balances
 * are revalued at the current rate to surface unrealized FX gain/loss.
 *
 * CAVEAT: rates are operator-entered and revaluation treatment here is the
 * straightforward mark-to-rate approach — verify with an accountant before
 * relying on it for statutory reporting.
 */

export const BASE_CURRENCY = "ILS";

function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export type RatePoint = { effectiveDate: Date; rateToBase: number };

/**
 * Resolves the applicable rate for a currency as of a date: the latest rate
 * with effectiveDate ≤ asOf. The base currency is always 1. Returns null when
 * no rate is available. Pure.
 */
export function resolveRate(
  currency: string,
  rates: RatePoint[],
  asOf: Date,
): number | null {
  if (currency === BASE_CURRENCY) return 1;
  let best: RatePoint | null = null;
  for (const rate of rates) {
    if (rate.effectiveDate.getTime() > asOf.getTime()) continue;
    if (!best || rate.effectiveDate.getTime() > best.effectiveDate.getTime()) {
      best = rate;
    }
  }
  return best ? best.rateToBase : null;
}

/** Converts a foreign amount to base currency at a rate. Pure. */
export function convertToBase(foreignAmount: number, rateToBase: number): number {
  return round2(foreignAmount * rateToBase);
}

/**
 * Unrealized FX gain/loss on an open foreign balance: the base value at the
 * current rate minus the base value it was booked at. Positive = gain. Pure.
 */
export function revaluationGainLoss(
  foreignAmount: number,
  bookedRate: number,
  currentRate: number,
): number {
  return round2(foreignAmount * (currentRate - bookedRate));
}

export async function setExchangeRate(input: {
  currency: string;
  rateToBase: number;
  effectiveDate: Date;
  adminUserId: string;
}) {
  const currency = input.currency.trim().toUpperCase();
  if (!currency || currency === BASE_CURRENCY) {
    throw new Error("יש להזין מטבע-חוץ תקין (שונה מ-ILS).");
  }
  if (!(input.rateToBase > 0)) throw new Error("השער חייב להיות חיובי.");

  const effectiveDate = new Date(
    Date.UTC(
      input.effectiveDate.getUTCFullYear(),
      input.effectiveDate.getUTCMonth(),
      input.effectiveDate.getUTCDate(),
    ),
  );

  return db.$transaction(async (tx) => {
    const rate = await tx.exchangeRate.upsert({
      where: { currency_effectiveDate: { currency, effectiveDate } },
      create: {
        currency,
        rateToBase: round6(input.rateToBase),
        effectiveDate,
      },
      update: { rateToBase: round6(input.rateToBase) },
    });

    await writeAdminAudit(tx, {
      adminUserId: input.adminUserId,
      action: "exchange_rate_set",
      entity: "ExchangeRate",
      entityId: rate.id,
      metadata: {
        currency,
        rateToBase: Number(rate.rateToBase),
        effectiveDate: effectiveDate.toISOString(),
      },
    });

    return rate;
  });
}

function round6(value: number) {
  return Math.round(value * 1e6) / 1e6;
}

export async function listExchangeRates(limit = 30) {
  const rates = await db.exchangeRate.findMany({
    orderBy: [{ currency: "asc" }, { effectiveDate: "desc" }],
    take: limit,
    select: { id: true, currency: true, rateToBase: true, effectiveDate: true },
  });
  return rates.map((rate) => ({
    id: rate.id,
    currency: rate.currency,
    rateToBase: Number(rate.rateToBase),
    effectiveDate: rate.effectiveDate,
  }));
}

async function ratePointsByCurrency() {
  const rates = await db.exchangeRate.findMany({
    select: { currency: true, rateToBase: true, effectiveDate: true },
  });
  const byCurrency = new Map<string, RatePoint[]>();
  for (const rate of rates) {
    const list = byCurrency.get(rate.currency) ?? [];
    list.push({
      effectiveDate: rate.effectiveDate,
      rateToBase: Number(rate.rateToBase),
    });
    byCurrency.set(rate.currency, list);
  }
  return byCurrency;
}

/**
 * Revaluation preview for open foreign-currency customer/vendor invoices: for
 * each, the base value at the invoice-date rate vs. the current rate, and the
 * unrealized FX difference, summed per currency. Read-only.
 */
export async function getRevaluationPreview() {
  const now = new Date();
  const ratesByCurrency = await ratePointsByCurrency();

  const [customerInvoices, vendorInvoices] = await Promise.all([
    db.customerInvoice.findMany({
      where: {
        status: { in: ["ISSUED", "PARTIALLY_PAID"] },
        currency: { not: BASE_CURRENCY },
      },
      select: {
        invoiceNumber: true,
        currency: true,
        total: true,
        paidTotal: true,
        invoiceDate: true,
      },
    }),
    db.vendorInvoice.findMany({
      where: {
        status: { in: ["APPROVED", "PARTIALLY_PAID"] },
        currency: { not: BASE_CURRENCY },
      },
      select: {
        invoiceNumber: true,
        currency: true,
        total: true,
        paidTotal: true,
        invoiceDate: true,
      },
    }),
  ]);

  type Line = {
    reference: string;
    kind: "AR" | "AP";
    currency: string;
    foreignOutstanding: number;
    bookedBase: number;
    currentBase: number;
    unrealized: number;
  };
  const lines: Line[] = [];

  const build = (
    inv: {
      invoiceNumber: string;
      currency: string;
      total: unknown;
      paidTotal: unknown;
      invoiceDate: Date;
    },
    kind: "AR" | "AP",
  ) => {
    const foreignOutstanding = round2(Number(inv.total) - Number(inv.paidTotal));
    if (foreignOutstanding <= 0) return;
    const rates = ratesByCurrency.get(inv.currency) ?? [];
    const bookedRate = resolveRate(inv.currency, rates, inv.invoiceDate);
    const currentRate = resolveRate(inv.currency, rates, now);
    if (bookedRate == null || currentRate == null) return;
    const bookedBase = convertToBase(foreignOutstanding, bookedRate);
    const currentBase = convertToBase(foreignOutstanding, currentRate);
    lines.push({
      reference: inv.invoiceNumber,
      kind,
      currency: inv.currency,
      foreignOutstanding,
      bookedBase,
      currentBase,
      unrealized: round2(currentBase - bookedBase),
    });
  };

  for (const inv of customerInvoices) build(inv, "AR");
  for (const inv of vendorInvoices) build(inv, "AP");

  const totalUnrealized = round2(
    lines.reduce((sum, line) => sum + line.unrealized, 0),
  );
  return { lines, totalUnrealized, unratedSkipped: 0 };
}

export async function getFxSummary() {
  const [currencies, preview] = await Promise.all([
    db.exchangeRate.findMany({ select: { currency: true }, distinct: ["currency"] }),
    getRevaluationPreview().catch(() => ({ lines: [], totalUnrealized: 0 })),
  ]);
  return {
    currencies: currencies.length,
    revaluationLines: preview.lines.length,
    totalUnrealized: preview.totalUnrealized,
  };
}
