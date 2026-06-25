import { db } from "~/server/db";
import { postJournalEntry } from "~/server/services/ledger";

/**
 * Manual (operator-posted) journal entries (FIN-GL-001).
 *
 * Until now every GL entry was auto-posted from sales/AP/AR. Real bookkeeping
 * also needs manual journals for accruals, adjustments, opening balances and
 * equity/owner movements. These flow through the same postJournalEntry path, so
 * they inherit balance validation (INV-A) and the closed-period guard
 * (FIN-RPT-002). The line parser is pure and exported for unit testing.
 */

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export type ParsedJournalLine = {
  accountCode: string;
  debit: number;
  credit: number;
};

/**
 * Parses free-text journal lines, one per line as "accountCode | debit | credit"
 * (mirrors the invoice-line entry convention). Each line must carry exactly one
 * non-negative, non-zero side. Throws on malformed input.
 */
export function parseJournalLines(input: string): ParsedJournalLine[] {
  return input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const [code, debitRaw, creditRaw] = line
        .split("|")
        .map((part) => part.trim());

      if (!code) throw new Error(`שורה ללא קוד חשבון: "${line}"`);

      const debit = round2(Number(debitRaw ?? 0) || 0);
      const credit = round2(Number(creditRaw ?? 0) || 0);

      if (debit < 0 || credit < 0) {
        throw new Error(`סכומים שליליים אינם מותרים: "${line}"`);
      }
      if (debit > 0 && credit > 0) {
        throw new Error(`שורה לא יכולה להיות גם חובה וגם זכות: "${line}"`);
      }
      if (debit === 0 && credit === 0) {
        throw new Error(`שורה ללא סכום: "${line}"`);
      }

      return { accountCode: code, debit, credit };
    });
}

/** Posts a balanced manual journal entry (source "manual"). */
export async function postManualJournalEntry(input: {
  entryDate?: Date;
  memo?: string;
  lines: ParsedJournalLine[];
  postedById?: string;
}) {
  if (input.lines.length < 2) {
    throw new Error("תנועת יומן דורשת לפחות שתי שורות.");
  }

  return postJournalEntry({
    entryDate: input.entryDate ?? new Date(),
    memo: input.memo,
    source: "manual",
    postedById: input.postedById,
    lines: input.lines,
  });
}

/** Active chart-of-accounts rows for the manual-entry reference list. */
export async function listLedgerAccounts() {
  return db.ledgerAccount.findMany({
    where: { isActive: true },
    orderBy: { code: "asc" },
    select: { code: true, name: true, type: true },
  });
}

/** Recent journal entries (any source) for the GL activity feed. */
export async function listRecentJournalEntries(limit = 10) {
  const entries = await db.journalEntry.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      entryNumber: true,
      entryDate: true,
      memo: true,
      source: true,
      status: true,
      lines: { select: { debit: true } },
    },
  });

  return entries.map((entry) => ({
    id: entry.id,
    entryNumber: entry.entryNumber,
    entryDate: entry.entryDate,
    memo: entry.memo,
    source: entry.source,
    status: entry.status,
    amount: round2(
      entry.lines.reduce((sum, line) => sum + Number(line.debit), 0),
    ),
  }));
}
