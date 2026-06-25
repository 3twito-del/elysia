import { db } from "~/server/db";
import { ACCOUNT } from "~/server/services/ledger-accounts";

/**
 * Israeli VAT report (FIN-TAX-001 / IL-001) derived from the general ledger:
 * output VAT (מע"מ עסקאות) from sales, input VAT (מע"מ תשומות) from purchases,
 * and net VAT due. This is a management summary, NOT the official PCN874 /
 * "מבנה אחיד" filing — verify with the accountant / Tax Authority.
 *
 * The aggregation helper is pure and exported for unit testing.
 */

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export type VatAccountSums = {
  code: string;
  debit: number;
  credit: number;
};

/** Pure: derives the VAT summary from per-account debit/credit sums. */
export function summarizeVat(sums: VatAccountSums[]) {
  const byCode = new Map(sums.map((row) => [row.code, row]));
  const output = byCode.get(ACCOUNT.VAT_OUTPUT);
  const input = byCode.get(ACCOUNT.VAT_INPUT);
  const revenue = byCode.get(ACCOUNT.SALES_REVENUE);

  // VAT_OUTPUT is a credit-normal liability; VAT_INPUT a debit-normal asset.
  const outputVat = round2((output?.credit ?? 0) - (output?.debit ?? 0));
  const inputVat = round2((input?.debit ?? 0) - (input?.credit ?? 0));
  const salesBase = round2((revenue?.credit ?? 0) - (revenue?.debit ?? 0));

  return {
    outputVat,
    inputVat,
    netVatDue: round2(outputVat - inputVat),
    salesBase,
  };
}

const emptyVat = {
  outputVat: 0,
  inputVat: 0,
  netVatDue: 0,
  salesBase: 0,
};

/** VAT report for a period, aggregated from the GL VAT/revenue accounts. */
export async function computeVatReport(input: { from: Date; to: Date }) {
  const accounts = await db.ledgerAccount.findMany({
    where: {
      code: {
        in: [ACCOUNT.VAT_OUTPUT, ACCOUNT.VAT_INPUT, ACCOUNT.SALES_REVENUE],
      },
    },
    select: { id: true, code: true },
  });
  if (accounts.length === 0) {
    return { ...emptyVat, from: input.from, to: input.to, generatedAt: new Date() };
  }

  const codeById = new Map(accounts.map((account) => [account.id, account.code]));
  const grouped = await db.journalLine.groupBy({
    by: ["accountId"],
    where: {
      accountId: { in: accounts.map((account) => account.id) },
      journalEntry: { entryDate: { gte: input.from, lt: input.to } },
    },
    _sum: { debit: true, credit: true },
  });

  const sums: VatAccountSums[] = grouped.map((row) => ({
    code: codeById.get(row.accountId) ?? "?",
    debit: Number(row._sum.debit ?? 0),
    credit: Number(row._sum.credit ?? 0),
  }));

  return {
    ...summarizeVat(sums),
    from: input.from,
    to: input.to,
    generatedAt: new Date(),
  };
}
