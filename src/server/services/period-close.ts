import { db } from "~/server/db";
import {
  ACCOUNT,
  type JournalLineInput,
  computeTrialBalance,
  postJournalEntry,
} from "~/server/services/ledger";

/**
 * Fiscal period close (FIN-RPT-002).
 *
 * Closing a month posts a balanced closing entry that zeroes every revenue and
 * expense account into retained earnings, then marks the FiscalPeriod CLOSED.
 * Once closed, ledger.assertPostingPeriodOpen rejects any further posting dated
 * inside the period (PRIN-003 — books are not reopened by mutation).
 *
 * buildClosingEntryLines is pure and exported for unit testing.
 */

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export type ClosableAccount = { code: string; type: string; balance: number };

/**
 * Builds the closing journal lines for a period's P&L accounts. Each revenue
 * account (credit-normal) is debited and each expense account (debit-normal) is
 * credited to bring it to zero; the net (period profit or loss) is plugged to
 * retained earnings so the entry balances. Returns [] when there is nothing to
 * close.
 */
export function buildClosingEntryLines(
  accounts: ClosableAccount[],
): JournalLineInput[] {
  const lines: JournalLineInput[] = [];

  for (const account of accounts) {
    if (account.type !== "REVENUE" && account.type !== "EXPENSE") continue;
    const balance = round2(account.balance);
    if (balance === 0) continue;

    if (account.type === "REVENUE") {
      lines.push(
        balance >= 0
          ? { accountCode: account.code, debit: balance, credit: 0, memo: "סגירת הכנסות" }
          : { accountCode: account.code, debit: 0, credit: -balance, memo: "סגירת הכנסות" },
      );
    } else {
      lines.push(
        balance >= 0
          ? { accountCode: account.code, debit: 0, credit: balance, memo: "סגירת הוצאות" }
          : { accountCode: account.code, debit: -balance, credit: 0, memo: "סגירת הוצאות" },
      );
    }
  }

  if (lines.length === 0) return [];

  const totalDebit = round2(lines.reduce((sum, line) => sum + line.debit, 0));
  const totalCredit = round2(lines.reduce((sum, line) => sum + line.credit, 0));
  const netIncome = round2(totalDebit - totalCredit);

  if (netIncome > 0) {
    lines.push({
      accountCode: ACCOUNT.RETAINED_EARNINGS,
      debit: 0,
      credit: netIncome,
      memo: "רווח נקי לתקופה",
    });
  } else if (netIncome < 0) {
    lines.push({
      accountCode: ACCOUNT.RETAINED_EARNINGS,
      debit: -netIncome,
      credit: 0,
      memo: "הפסד לתקופה",
    });
  }

  return lines;
}

/** UTC bounds for a calendar month: [start, endExclusive] and the last day. */
export function periodBounds(year: number, month: number) {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const endExclusive = new Date(Date.UTC(year, month, 1));
  const lastDay = new Date(Date.UTC(year, month, 0));

  return { start, endExclusive, lastDay };
}

function assertValidPeriod(year: number, month: number) {
  if (!Number.isInteger(year) || year < 2000 || year > 2200) {
    throw new Error("שנה לא תקינה.");
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error("חודש לא תקין (1–12).");
  }
}

/** Period P&L preview (net income that would close to retained earnings). */
export async function getPeriodCloseSummary(year: number, month: number) {
  assertValidPeriod(year, month);
  const { start, endExclusive } = periodBounds(year, month);

  const [trialBalance, period] = await Promise.all([
    computeTrialBalance({ from: start, to: endExclusive }),
    db.fiscalPeriod.findUnique({ where: { year_month: { year, month } } }),
  ]);

  const revenue = round2(
    trialBalance.rows
      .filter((row) => row.type === "REVENUE")
      .reduce((sum, row) => sum + row.balance, 0),
  );
  const expenses = round2(
    trialBalance.rows
      .filter((row) => row.type === "EXPENSE")
      .reduce((sum, row) => sum + row.balance, 0),
  );

  return {
    year,
    month,
    revenue,
    expenses,
    netIncome: round2(revenue - expenses),
    status: period?.status ?? "OPEN",
    closedAt: period?.closedAt ?? null,
  };
}

/**
 * Closes a fiscal month: posts the closing entry (dated the last day of the
 * month) and marks the FiscalPeriod CLOSED. Idempotency is guarded by the
 * already-CLOSED check; the RETAINED_EARNINGS account is upserted so the close
 * self-heals on environments seeded before it was added to the chart.
 */
export async function closePeriod(input: {
  year: number;
  month: number;
  postedById?: string;
  notes?: string;
}) {
  const { year, month, postedById, notes } = input;
  assertValidPeriod(year, month);

  const existing = await db.fiscalPeriod.findUnique({
    where: { year_month: { year, month } },
    select: { status: true },
  });
  if (existing?.status === "CLOSED") {
    throw new Error(`התקופה ${month}/${year} כבר סגורה.`);
  }

  const { start, endExclusive, lastDay } = periodBounds(year, month);
  const trialBalance = await computeTrialBalance({
    from: start,
    to: endExclusive,
  });
  const lines = buildClosingEntryLines(trialBalance.rows);

  return db.$transaction(async (tx) => {
    await tx.ledgerAccount.upsert({
      where: { code: ACCOUNT.RETAINED_EARNINGS },
      create: {
        code: ACCOUNT.RETAINED_EARNINGS,
        name: "עודפים (רווח שנצבר)",
        type: "EQUITY",
        normalSide: "CREDIT",
      },
      update: {},
    });

    let closingEntryId: string | undefined;
    if (lines.length > 0) {
      const entry = await postJournalEntry(
        {
          entryDate: lastDay,
          memo: `סגירת תקופה ${month}/${year}`,
          source: "period_close",
          aggregateType: "FiscalPeriod",
          postedById,
          metadata: { year, month },
          lines,
        },
        tx,
      );
      closingEntryId = entry.id;
    }

    const period = await tx.fiscalPeriod.upsert({
      where: { year_month: { year, month } },
      create: {
        year,
        month,
        status: "CLOSED",
        closingEntryId,
        closedAt: new Date(),
        closedById: postedById,
        notes,
      },
      update: {
        status: "CLOSED",
        closingEntryId,
        closedAt: new Date(),
        closedById: postedById,
        notes,
      },
    });

    return period;
  });
}

/** Most recent fiscal periods for the close workbench. */
export async function listFiscalPeriods(limit = 12) {
  return db.fiscalPeriod.findMany({
    orderBy: [{ year: "desc" }, { month: "desc" }],
    take: limit,
    select: {
      id: true,
      year: true,
      month: true,
      status: true,
      closedAt: true,
    },
  });
}
