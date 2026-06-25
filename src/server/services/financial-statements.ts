import { computeTrialBalance } from "~/server/services/ledger";

/**
 * Financial statements derived from the double-entry GL (FIN-RPT-001):
 * a profit & loss (income statement) and a balance sheet. Real-time, read-only.
 *
 * Net income is not yet closed to equity, so the balance-sheet identity is
 * Assets = Liabilities + Equity + NetIncome (the unclosed-period form). The
 * builder is pure and exported for unit testing.
 */

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export type StatementRow = { type: string; balance: number };

export function buildFinancialStatements(rows: StatementRow[]) {
  const sumByType = (type: string) =>
    round2(
      rows
        .filter((row) => row.type === type)
        .reduce((sum, row) => sum + row.balance, 0),
    );

  const revenue = sumByType("REVENUE");
  const expenses = sumByType("EXPENSE");
  const netIncome = round2(revenue - expenses);

  const assets = sumByType("ASSET");
  const liabilities = sumByType("LIABILITY");
  const equity = sumByType("EQUITY");

  return {
    incomeStatement: { revenue, expenses, netIncome },
    balanceSheet: {
      assets,
      liabilities,
      equity,
      netIncome,
      balanced:
        Math.abs(assets - (liabilities + equity + netIncome)) < 0.005,
    },
  };
}

/** P&L + balance sheet from the cumulative trial balance. */
export async function getFinancialStatements() {
  const trialBalance = await computeTrialBalance();

  return {
    ...buildFinancialStatements(trialBalance.rows),
    generatedAt: new Date(),
  };
}
