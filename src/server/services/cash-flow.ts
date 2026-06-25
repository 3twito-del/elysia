import { db } from "~/server/db";
import { ACCOUNT } from "~/server/services/ledger";

/**
 * Cash flow statement (FIN-RPT-001), direct method.
 *
 * Every journal entry that moves the CASH account contributes its net cash delta
 * to one of three activities. Known auto-posting sources map straight to a
 * category; manual/unknown entries are inferred from their contra-account types
 * (equity → financing, otherwise operating). Investing stays empty until
 * dedicated fixed-asset accounts exist — a deliberate, honest limitation.
 *
 * netChange equals the cumulative cash balance, so the statement reconciles to
 * the cash line on the balance sheet. The pure helpers are exported for testing.
 */

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export type CashFlowCategory = "OPERATING" | "INVESTING" | "FINANCING";

const SOURCE_CATEGORY: Record<string, CashFlowCategory> = {
  sale: "OPERATING",
  customer_receipt: "OPERATING",
  customer_invoice: "OPERATING",
  vendor_invoice: "OPERATING",
  vendor_payment: "OPERATING",
  purchase_receipt: "OPERATING",
  refund: "OPERATING",
};

/** Classifies a cash movement by its entry source, falling back to contra types. */
export function classifyCashFlow(
  source: string,
  contraTypes: string[] = [],
): CashFlowCategory {
  const bySource = SOURCE_CATEGORY[source];
  if (bySource) return bySource;

  if (contraTypes.includes("EQUITY")) return "FINANCING";
  return "OPERATING";
}

export type CategorizedCashFlow = {
  category: CashFlowCategory;
  cashDelta: number;
};

/** Sums categorized cash movements into the three activity totals. */
export function buildCashFlowStatement(rows: CategorizedCashFlow[]) {
  let operating = 0;
  let investing = 0;
  let financing = 0;

  for (const row of rows) {
    const delta = round2(row.cashDelta);
    if (row.category === "FINANCING") financing += delta;
    else if (row.category === "INVESTING") investing += delta;
    else operating += delta;
  }

  operating = round2(operating);
  investing = round2(investing);
  financing = round2(financing);

  return {
    operating,
    investing,
    financing,
    netChange: round2(operating + investing + financing),
  };
}

/** Direct-method cash flow from the GL cash account. */
export async function getCashFlowStatement(
  input: { from?: Date; to?: Date } = {},
) {
  const entries = await db.journalEntry.findMany({
    where: {
      status: { not: "REVERSED" },
      lines: { some: { account: { code: ACCOUNT.CASH } } },
      ...(input.from ?? input.to
        ? {
            entryDate: {
              ...(input.from ? { gte: input.from } : {}),
              ...(input.to ? { lt: input.to } : {}),
            },
          }
        : {}),
    },
    select: {
      source: true,
      lines: {
        select: {
          debit: true,
          credit: true,
          account: { select: { code: true, type: true } },
        },
      },
    },
  });

  const rows: CategorizedCashFlow[] = entries.map((entry) => {
    let cashDelta = 0;
    const contraTypes: string[] = [];

    for (const line of entry.lines) {
      if (line.account.code === ACCOUNT.CASH) {
        cashDelta += Number(line.debit) - Number(line.credit);
      } else {
        contraTypes.push(line.account.type);
      }
    }

    return {
      category: classifyCashFlow(entry.source, contraTypes),
      cashDelta: round2(cashDelta),
    };
  });

  return { ...buildCashFlowStatement(rows), generatedAt: new Date() };
}
