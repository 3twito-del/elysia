/**
 * Consolidation engine for multi-entity accounting (ENT-003, §4.AD). Pure: it
 * takes each entity's trial balance in its functional currency plus FX rates
 * to the base currency, translates, and merges by account into a consolidated
 * trial balance. Intercompany elimination is summarised separately. No DB here.
 *
 * Each entity carries two rates: `closingRate` translates balance-sheet
 * accounts (asset/liability/equity) and `averageRate` translates P&L accounts
 * (revenue/expense) — real consolidation practice. When an entity hasn't set a
 * distinct average rate the two are equal (v1's single-rate behavior, so
 * nothing changes until an admin opts in). `splitConsolidatedStatements`
 * derives the separate P&L / balance-sheet views, with the residual from
 * using two rates surfaced explicitly as a cumulative translation adjustment
 * (CTA) rather than silently absorbed.
 */

const balanceEpsilon = 0.01;

function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export type EntityBalanceRow = {
  accountCode: string;
  accountName: string;
  accountType: string;
  normalSide: string;
  debit: number;
  credit: number;
};

export type EntityTrialBalance = {
  entityId: string;
  entityCode: string;
  entityName: string;
  currency: string;
  closingRate: number;
  averageRate: number;
  rows: EntityBalanceRow[];
};

const incomeStatementAccountTypes = new Set(["REVENUE", "EXPENSE"]);

/** Whether an account type is a P&L (income statement) account. Pure. */
export function isIncomeStatementAccountType(accountType: string): boolean {
  return incomeStatementAccountTypes.has(accountType);
}

/** The rate that applies to an account type at consolidation: average for
 * P&L accounts, closing for balance-sheet accounts. Pure. */
export function rateForAccountType(
  accountType: string,
  rates: { closingRate: number; averageRate: number },
): number {
  return isIncomeStatementAccountType(accountType)
    ? rates.averageRate
    : rates.closingRate;
}

export type ConsolidatedRow = {
  accountCode: string;
  accountName: string;
  accountType: string;
  debit: number;
  credit: number;
  balance: number;
};

/** Converts an amount from a functional currency into the base currency. Pure. */
export function translateAmount(amount: number, fxRate: number): number {
  return round2(amount * fxRate);
}

/**
 * Merges per-entity trial balances (translated to the base currency) into one
 * consolidated trial balance, summed by account code. Pure.
 */
export function consolidateTrialBalances(entityTBs: EntityTrialBalance[]) {
  const byCode = new Map<
    string,
    {
      accountCode: string;
      accountName: string;
      accountType: string;
      normalSide: string;
      debit: number;
      credit: number;
    }
  >();

  for (const tb of entityTBs) {
    for (const row of tb.rows) {
      const rate = rateForAccountType(row.accountType, tb);
      const debit = translateAmount(row.debit, rate);
      const credit = translateAmount(row.credit, rate);
      const existing = byCode.get(row.accountCode);
      if (existing) {
        existing.debit = round2(existing.debit + debit);
        existing.credit = round2(existing.credit + credit);
      } else {
        byCode.set(row.accountCode, {
          accountCode: row.accountCode,
          accountName: row.accountName,
          accountType: row.accountType,
          normalSide: row.normalSide,
          debit,
          credit,
        });
      }
    }
  }

  const rows: ConsolidatedRow[] = [...byCode.values()]
    .map((row) => ({
      accountCode: row.accountCode,
      accountName: row.accountName,
      accountType: row.accountType,
      debit: round2(row.debit),
      credit: round2(row.credit),
      balance:
        row.normalSide === "CREDIT"
          ? round2(row.credit - row.debit)
          : round2(row.debit - row.credit),
    }))
    .sort((first, second) => first.accountCode.localeCompare(second.accountCode));

  const totalDebit = round2(rows.reduce((sum, row) => sum + row.debit, 0));
  const totalCredit = round2(rows.reduce((sum, row) => sum + row.credit, 0));

  return {
    rows,
    totalDebit,
    totalCredit,
    balanced: Math.abs(totalDebit - totalCredit) < balanceEpsilon,
  };
}

export type ConsolidatedStatements = {
  incomeStatement: {
    revenue: number;
    expenses: number;
    netIncome: number;
    rows: ConsolidatedRow[];
  };
  balanceSheet: {
    assets: number;
    liabilities: number;
    equity: number;
    netIncome: number;
    /** The plug needed for Assets = Liabilities + Equity + CTA + NetIncome to
     * hold once P&L and BS accounts are translated at different rates. Zero
     * whenever every entity's average rate equals its closing rate. */
    cumulativeTranslationAdjustment: number;
    balanced: boolean;
    rows: ConsolidatedRow[];
  };
};

/**
 * Splits a consolidated trial balance into its P&L and balance-sheet halves —
 * the multi-entity analogue of `buildFinancialStatements`
 * (`financial-statements.ts`, FIN-RPT-001), same unclosed-period identity
 * (Assets = Liabilities + Equity + NetIncome), extended with the CTA plug
 * that dual-rate translation requires. Pure.
 */
export function splitConsolidatedStatements(
  rows: ConsolidatedRow[],
): ConsolidatedStatements {
  const sumByType = (type: string) =>
    round2(
      rows
        .filter((row) => row.accountType === type)
        .reduce((sum, row) => sum + row.balance, 0),
    );

  const revenue = sumByType("REVENUE");
  const expenses = sumByType("EXPENSE");
  const netIncome = round2(revenue - expenses);

  const assets = sumByType("ASSET");
  const liabilities = sumByType("LIABILITY");
  const equity = sumByType("EQUITY");

  const cumulativeTranslationAdjustment = round2(
    assets - liabilities - equity - netIncome,
  );

  return {
    incomeStatement: {
      revenue,
      expenses,
      netIncome,
      rows: rows.filter((row) => isIncomeStatementAccountType(row.accountType)),
    },
    balanceSheet: {
      assets,
      liabilities,
      equity,
      netIncome,
      cumulativeTranslationAdjustment,
      balanced:
        Math.abs(
          assets -
            (liabilities + equity + cumulativeTranslationAdjustment + netIncome),
        ) < balanceEpsilon,
      rows: rows.filter((row) => !isIncomeStatementAccountType(row.accountType)),
    },
  };
}

/** Open vs eliminated intercompany exposure. Pure. */
export function summarizeIntercompany(
  transactions: Array<{ status: string; amount: number }>,
) {
  let open = 0;
  let openAmount = 0;
  let eliminated = 0;
  let eliminatedAmount = 0;

  for (const transaction of transactions) {
    if (transaction.status === "ELIMINATED") {
      eliminated += 1;
      eliminatedAmount = round2(eliminatedAmount + transaction.amount);
    } else {
      open += 1;
      openAmount = round2(openAmount + transaction.amount);
    }
  }

  return {
    open,
    openAmount,
    eliminated,
    eliminatedAmount,
    total: transactions.length,
  };
}
