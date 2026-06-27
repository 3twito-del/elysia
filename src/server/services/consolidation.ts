/**
 * Consolidation engine for multi-entity accounting (ENT-003, §4.AD). Pure: it
 * takes each entity's trial balance in its functional currency plus an FX rate
 * to the base currency, translates, and merges by account into a consolidated
 * trial balance. Intercompany elimination is summarised separately. No DB here.
 *
 * Simplification (flag to the accountant): a single closing FX rate per entity
 * is used for all accounts; real consolidation uses average rates for P&L and
 * closing rates for the balance sheet (a CTA line). Single-rate is the v1.
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
  fxRate: number;
  rows: EntityBalanceRow[];
};

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
      const debit = translateAmount(row.debit, tb.fxRate);
      const credit = translateAmount(row.credit, tb.fxRate);
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
