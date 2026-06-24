/**
 * Chart-of-accounts reference data (FIN-GL-001).
 *
 * Pure module with no database import, so it can be consumed by the GL service,
 * by seed scripts, and by tests without pulling in the Prisma client.
 */

/** Canonical chart-of-accounts codes referenced by the posting helpers. */
export const ACCOUNT = {
  CASH: "1000",
  ACCOUNTS_RECEIVABLE: "1100",
  INVENTORY: "1300",
  VAT_INPUT: "1400",
  ACCOUNTS_PAYABLE: "2000",
  GRNI: "2050",
  VAT_OUTPUT: "2100",
  EQUITY: "3000",
  SALES_REVENUE: "4000",
  COGS: "5000",
} as const;

export type AccountType =
  | "ASSET"
  | "LIABILITY"
  | "EQUITY"
  | "REVENUE"
  | "EXPENSE";
export type NormalSide = "DEBIT" | "CREDIT";

export type ChartOfAccountsEntry = {
  code: string;
  name: string;
  type: AccountType;
  normalSide: NormalSide;
};

export const DEFAULT_CHART_OF_ACCOUNTS: ChartOfAccountsEntry[] = [
  { code: ACCOUNT.CASH, name: "מזומן ובנקים", type: "ASSET", normalSide: "DEBIT" },
  {
    code: ACCOUNT.ACCOUNTS_RECEIVABLE,
    name: "לקוחות (חייבים)",
    type: "ASSET",
    normalSide: "DEBIT",
  },
  { code: ACCOUNT.INVENTORY, name: "מלאי", type: "ASSET", normalSide: "DEBIT" },
  {
    code: ACCOUNT.VAT_INPUT,
    name: 'מע"מ תשומות',
    type: "ASSET",
    normalSide: "DEBIT",
  },
  {
    code: ACCOUNT.ACCOUNTS_PAYABLE,
    name: "ספקים (זכאים)",
    type: "LIABILITY",
    normalSide: "CREDIT",
  },
  {
    code: ACCOUNT.GRNI,
    name: "התחייבות לסחורה שהתקבלה (GRNI)",
    type: "LIABILITY",
    normalSide: "CREDIT",
  },
  {
    code: ACCOUNT.VAT_OUTPUT,
    name: 'מע"מ עסקאות',
    type: "LIABILITY",
    normalSide: "CREDIT",
  },
  { code: ACCOUNT.EQUITY, name: "הון", type: "EQUITY", normalSide: "CREDIT" },
  {
    code: ACCOUNT.SALES_REVENUE,
    name: "הכנסות ממכירות",
    type: "REVENUE",
    normalSide: "CREDIT",
  },
  { code: ACCOUNT.COGS, name: "עלות המכר", type: "EXPENSE", normalSide: "DEBIT" },
];
