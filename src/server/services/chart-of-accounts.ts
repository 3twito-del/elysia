import { db } from "~/server/db";
import { computeTrialBalance } from "~/server/services/ledger";

/**
 * Chart-of-accounts management (FIN-GL-001).
 *
 * The default chart is seeded from code; this lets operators view every account
 * with its live balance and add custom accounts. The validators are pure and
 * exported for unit testing.
 */

const ACCOUNT_TYPES = ["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"];

/** Whether a code is a 3–5 digit account number. Pure. */
export function isValidAccountCode(code: string): boolean {
  return /^\d{3,5}$/.test(code.trim());
}

/** The natural (increasing) side for an account type. Pure. */
export function deriveNormalSide(type: string): "DEBIT" | "CREDIT" {
  return type === "ASSET" || type === "EXPENSE" ? "DEBIT" : "CREDIT";
}

/** Creates a custom ledger account. */
export async function createLedgerAccount(input: {
  code: string;
  name: string;
  type: string;
  normalSide?: "DEBIT" | "CREDIT";
}) {
  const code = input.code.trim();
  if (!isValidAccountCode(code)) {
    throw new Error("קוד חשבון חייב להיות 3–5 ספרות.");
  }
  if (!input.name.trim()) throw new Error("שם החשבון הוא שדה חובה.");
  if (!ACCOUNT_TYPES.includes(input.type)) {
    throw new Error("סוג חשבון לא תקין.");
  }

  const existing = await db.ledgerAccount.findUnique({ where: { code } });
  if (existing) throw new Error(`קוד החשבון ${code} כבר קיים.`);

  return db.ledgerAccount.create({
    data: {
      code,
      name: input.name.trim(),
      type: input.type,
      normalSide: input.normalSide ?? deriveNormalSide(input.type),
    },
  });
}

/** Every ledger account with its live (cumulative) balance. */
export async function listAccountsWithBalances() {
  const [accounts, trialBalance] = await Promise.all([
    db.ledgerAccount.findMany({
      orderBy: { code: "asc" },
      select: { id: true, code: true, name: true, type: true, normalSide: true },
    }),
    computeTrialBalance(),
  ]);

  const balanceByCode = new Map(
    trialBalance.rows.map((row) => [row.code, row.balance]),
  );

  return accounts.map((account) => ({
    ...account,
    balance: balanceByCode.get(account.code) ?? 0,
  }));
}
