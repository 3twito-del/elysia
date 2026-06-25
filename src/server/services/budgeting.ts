import { db } from "~/server/db";
import { computeTrialBalance } from "~/server/services/ledger";

/**
 * Budgeting and variance (FP&A, Phase 4.V).
 *
 * Budgets are set per account per period ("YYYY-MM"); actuals come from the GL
 * trial balance for that period. computeBudgetVariance is pure and exported for
 * unit testing.
 */

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export type BudgetVarianceRow = {
  accountCode: string;
  accountName: string;
  budget: number;
  actual: number;
};

/** Adds variance (actual − budget) per row and the column totals. Pure. */
export function computeBudgetVariance(rows: BudgetVarianceRow[]) {
  const lines = rows.map((row) => ({
    ...row,
    variance: round2(row.actual - row.budget),
    variancePct:
      row.budget !== 0
        ? round2(((row.actual - row.budget) / Math.abs(row.budget)) * 100)
        : null,
  }));

  const budgetTotal = round2(lines.reduce((sum, line) => sum + line.budget, 0));
  const actualTotal = round2(lines.reduce((sum, line) => sum + line.actual, 0));

  return {
    lines,
    budgetTotal,
    actualTotal,
    varianceTotal: round2(actualTotal - budgetTotal),
  };
}

/** Current period as "YYYY-MM" (UTC). */
export function currentPeriod(date: Date = new Date()): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Upserts a budget amount for an account in a period. */
export async function setBudget(input: {
  period: string;
  accountCode: string;
  amount: number;
}) {
  if (!/^\d{4}-\d{2}$/.test(input.period)) {
    throw new Error("תקופה לא תקינה (YYYY-MM).");
  }

  return db.budgetLine.upsert({
    where: {
      period_accountCode: {
        period: input.period,
        accountCode: input.accountCode,
      },
    },
    create: {
      period: input.period,
      accountCode: input.accountCode,
      amount: round2(input.amount),
    },
    update: { amount: round2(input.amount) },
  });
}

/** Budget vs GL actuals for a period, with variance. */
export async function getBudgetVsActual(period: string = currentPeriod()) {
  const [year, month] = period.split("-").map(Number);
  const from = new Date(Date.UTC(year ?? 2000, (month ?? 1) - 1, 1));
  const to = new Date(Date.UTC(year ?? 2000, month ?? 1, 1));

  const [budgets, trialBalance, accounts] = await Promise.all([
    db.budgetLine.findMany({ where: { period }, orderBy: { accountCode: "asc" } }),
    computeTrialBalance({ from, to }),
    db.ledgerAccount.findMany({ select: { code: true, name: true } }),
  ]);

  const actualByCode = new Map(
    trialBalance.rows.map((row) => [row.code, row.balance]),
  );
  const nameByCode = new Map(accounts.map((account) => [account.code, account.name]));

  const rows: BudgetVarianceRow[] = budgets.map((budget) => ({
    accountCode: budget.accountCode,
    accountName: nameByCode.get(budget.accountCode) ?? budget.accountCode,
    budget: Number(budget.amount),
    actual: actualByCode.get(budget.accountCode) ?? 0,
  }));

  return { period, ...computeBudgetVariance(rows) };
}
