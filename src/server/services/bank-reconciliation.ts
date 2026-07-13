import { db } from "~/server/db";
import { writeAdminAudit } from "~/server/services/admin-commerce-workflow";
import { ACCOUNT } from "~/server/services/ledger";

/**
 * Bank reconciliation: import statement lines and match them to GL cash entries.
 *
 * `amount` is signed (positive inflow / negative outflow), mirroring the cash
 * delta of a journal entry on account 1000. The CSV parser and the greedy
 * matcher are pure and exported for unit testing; the DB functions apply matches
 * and report the book-vs-statement difference.
 */

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

const dayMs = 24 * 60 * 60 * 1000;

export type ParsedBankLine = {
  statementDate: Date;
  description: string;
  amount: number;
  reference?: string;
};

function parseIsoDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Parses a bank statement as CSV rows "date,description,amount[,reference]".
 * Lines whose date or amount cannot be parsed (header, blanks) are skipped, so
 * a header row needs no special handling.
 */
export function parseBankStatementCsv(input: string): ParsedBankLine[] {
  const result: ParsedBankLine[] = [];

  for (const raw of input.split(/\r?\n/)) {
    const line = raw.trim();
    if (line.length === 0) continue;

    const cells = line.split(",").map((cell) => cell.trim());
    if (cells.length < 3) continue;

    const statementDate = parseIsoDate(cells[0] ?? "");
    if (!statementDate) continue;

    const amount = Number((cells[2] ?? "").replace(/[^\d.-]/g, ""));
    if (!Number.isFinite(amount) || amount === 0) continue;

    const description = cells[1] ?? "";
    const reference = cells[3] && cells[3].length > 0 ? cells[3] : undefined;

    result.push({
      statementDate,
      description,
      amount: round2(amount),
      reference,
    });
  }

  return result;
}

export type MatchableBankLine = {
  id: string;
  statementDate: Date;
  amount: number;
};

export type MatchableGlEntry = {
  id: string;
  entryDate: Date;
  cashDelta: number;
};

export type BankMatch = { bankLineId: string; journalEntryId: string };

/**
 * Greedily matches statement lines to GL cash entries by equal signed amount and
 * date proximity (within `maxDays`), preferring the closest date. Each GL entry
 * is used at most once. Pure.
 */
export function matchStatementLines(
  bankLines: MatchableBankLine[],
  glEntries: MatchableGlEntry[],
  maxDays = 5,
): BankMatch[] {
  const matches: BankMatch[] = [];
  const used = new Set<string>();

  const ordered = [...bankLines].sort(
    (a, b) =>
      a.statementDate.getTime() - b.statementDate.getTime() ||
      a.id.localeCompare(b.id),
  );

  for (const line of ordered) {
    let best: { id: string; days: number } | null = null;

    for (const entry of glEntries) {
      if (used.has(entry.id)) continue;
      if (Math.abs(entry.cashDelta - line.amount) >= 0.005) continue;

      const days = Math.abs(
        (line.statementDate.getTime() - entry.entryDate.getTime()) / dayMs,
      );
      if (days > maxDays) continue;

      if (!best || days < best.days) best = { id: entry.id, days };
    }

    if (best) {
      used.add(best.id);
      matches.push({ bankLineId: line.id, journalEntryId: best.id });
    }
  }

  return matches;
}

export type ReconciliationCounts = {
  unmatched: number;
  matched: number;
  ignored: number;
  unmatchedAmount: number;
  statementBalance: number;
};

/** Counts statement lines by status and sums their amounts. Pure. */
export function summarizeReconciliation(
  lines: Array<{ status: string; amount: number }>,
): ReconciliationCounts {
  const counts: ReconciliationCounts = {
    unmatched: 0,
    matched: 0,
    ignored: 0,
    unmatchedAmount: 0,
    statementBalance: 0,
  };

  for (const line of lines) {
    counts.statementBalance = round2(counts.statementBalance + line.amount);
    if (line.status === "MATCHED") counts.matched += 1;
    else if (line.status === "IGNORED") counts.ignored += 1;
    else {
      counts.unmatched += 1;
      counts.unmatchedAmount = round2(counts.unmatchedAmount + line.amount);
    }
  }

  return counts;
}

/** Imports parsed statement lines. Returns the inserted count. */
export async function importBankStatementLines(
  lines: ParsedBankLine[],
  adminUserId: string,
) {
  if (lines.length === 0) return 0;

  const created = await db.bankStatementLine.createMany({
    data: lines.map((line) => ({
      statementDate: line.statementDate,
      description: line.description,
      amount: line.amount,
      reference: line.reference,
    })),
  });

  await writeAdminAudit(db, {
    adminUserId,
    action: "bank_statement_imported",
    entity: "BankStatementLine",
    metadata: { count: created.count },
  });

  return created.count;
}

/** Recent statement lines for the reconciliation workbench. */
export async function listBankStatementLines(limit = 50) {
  const lines = await db.bankStatementLine.findMany({
    orderBy: [{ statementDate: "desc" }, { createdAt: "desc" }],
    take: limit,
    select: {
      id: true,
      statementDate: true,
      description: true,
      amount: true,
      status: true,
      matchedJournalEntryId: true,
    },
  });

  return lines.map((line) => ({
    ...line,
    amount: Number(line.amount),
  }));
}

/** Unmatched cash GL entries (signed cash delta), excluding ones already linked. */
async function loadUnmatchedCashEntries(): Promise<MatchableGlEntry[]> {
  const [entries, linked] = await Promise.all([
    db.journalEntry.findMany({
      where: { lines: { some: { account: { code: ACCOUNT.CASH } } } },
      select: {
        id: true,
        entryDate: true,
        lines: {
          select: {
            debit: true,
            credit: true,
            account: { select: { code: true } },
          },
        },
      },
    }),
    db.bankStatementLine.findMany({
      where: { matchedJournalEntryId: { not: null } },
      select: { matchedJournalEntryId: true },
    }),
  ]);

  const linkedIds = new Set(
    linked.map((line) => line.matchedJournalEntryId).filter(Boolean),
  );

  return entries
    .filter((entry) => !linkedIds.has(entry.id))
    .map((entry) => {
      const cashDelta = entry.lines.reduce((sum, line) => {
        if (line.account.code !== ACCOUNT.CASH) return sum;
        return sum + Number(line.debit) - Number(line.credit);
      }, 0);
      return { id: entry.id, entryDate: entry.entryDate, cashDelta: round2(cashDelta) };
    })
    .filter((entry) => entry.cashDelta !== 0);
}

/** Auto-matches unmatched statement lines to GL cash entries. Returns the count. */
export async function autoMatchBankStatement(adminUserId: string) {
  const [bankLines, glEntries] = await Promise.all([
    db.bankStatementLine.findMany({
      where: { status: "UNMATCHED" },
      select: { id: true, statementDate: true, amount: true },
    }),
    loadUnmatchedCashEntries(),
  ]);

  const matches = matchStatementLines(
    bankLines.map((line) => ({
      id: line.id,
      statementDate: line.statementDate,
      amount: Number(line.amount),
    })),
    glEntries,
  );

  if (matches.length === 0) return 0;

  // Callback form required: this repo's `db` export wraps every call in a
  // retry proxy (src/server/db.ts), whose returned promises aren't real
  // Prisma "PrismaPromise" objects — the array form of $transaction throws
  // "All elements of the array need to be Prisma Client promises" (see
  // admin-commerce.ts's other $transaction calls for the same convention).
  await db.$transaction(async (tx) => {
    for (const match of matches) {
      await tx.bankStatementLine.update({
        where: { id: match.bankLineId },
        data: {
          status: "MATCHED",
          matchedJournalEntryId: match.journalEntryId,
        },
      });
    }
  });

  await writeAdminAudit(db, {
    adminUserId,
    action: "bank_statement_auto_matched",
    entity: "BankStatementLine",
    metadata: { matched: matches.length },
  });

  return matches.length;
}

/** Marks a statement line as ignored (reconciled out of band). */
export async function ignoreBankStatementLine(id: string, adminUserId: string) {
  return db.$transaction(async (tx) => {
    const line = await tx.bankStatementLine.update({
      where: { id },
      data: { status: "IGNORED", matchedJournalEntryId: null },
    });

    await writeAdminAudit(tx, {
      adminUserId,
      action: "bank_statement_line_ignored",
      entity: "BankStatementLine",
      entityId: line.id,
    });

    return line;
  });
}

/** Book (GL) cash balance vs the imported statement balance. */
export async function getReconciliationOverview() {
  const [lines, cashAccount] = await Promise.all([
    db.bankStatementLine.findMany({ select: { status: true, amount: true } }),
    db.ledgerAccount.findUnique({
      where: { code: ACCOUNT.CASH },
      select: { id: true },
    }),
  ]);

  let glCashBalance = 0;
  if (cashAccount) {
    const totals = await db.journalLine.aggregate({
      where: { accountId: cashAccount.id },
      _sum: { debit: true, credit: true },
    });
    glCashBalance = round2(
      Number(totals._sum.debit ?? 0) - Number(totals._sum.credit ?? 0),
    );
  }

  const counts = summarizeReconciliation(
    lines.map((line) => ({ status: line.status, amount: Number(line.amount) })),
  );

  return {
    ...counts,
    glCashBalance,
    difference: round2(glCashBalance - counts.statementBalance),
  };
}
