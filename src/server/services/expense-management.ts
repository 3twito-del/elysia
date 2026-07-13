import type { Prisma } from "@prisma/client";

import { db } from "~/server/db";
import { writeAdminAudit } from "~/server/services/admin-commerce-workflow";
import { ACCOUNT, postJournalEntry } from "~/server/services/ledger";

/**
 * Employee expense management (EXP, Phase 4.U).
 *
 * Claims are submitted, then approved (which posts Dr General Expense / Cr Cash,
 * source "expense") or rejected. The summary roll-up is pure and exported for
 * unit testing.
 */

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export type ExpenseSummaryInput = { status: string; amount: number };

/** Counts and totals by status. Pure. */
export function summarizeExpenseClaims(claims: ExpenseSummaryInput[]) {
  let pendingCount = 0;
  let approvedCount = 0;
  let pendingTotal = 0;
  let approvedTotal = 0;

  for (const claim of claims) {
    if (claim.status === "SUBMITTED") {
      pendingCount += 1;
      pendingTotal = round2(pendingTotal + claim.amount);
    } else if (claim.status === "APPROVED") {
      approvedCount += 1;
      approvedTotal = round2(approvedTotal + claim.amount);
    }
  }

  return { pendingCount, approvedCount, pendingTotal, approvedTotal };
}

async function ensureExpenseAccount(client: Prisma.TransactionClient) {
  await client.ledgerAccount.upsert({
    where: { code: ACCOUNT.GENERAL_EXPENSE },
    create: {
      code: ACCOUNT.GENERAL_EXPENSE,
      name: "הוצאות תפעוליות",
      type: "EXPENSE",
      normalSide: "DEBIT",
    },
    update: {},
  });
}

async function nextClaimNumber(client: Prisma.TransactionClient) {
  const today = new Date();
  const prefix = `EXP-${today.getUTCFullYear()}${String(
    today.getUTCMonth() + 1,
  ).padStart(2, "0")}`;
  const count = await client.expenseClaim.count({
    where: { claimNumber: { startsWith: prefix } },
  });
  return `${prefix}-${String(count + 1).padStart(5, "0")}`;
}

/** Submits a new expense claim (status SUBMITTED). */
export async function createExpenseClaim(input: {
  employeeId?: string;
  description: string;
  category?: string;
  amount: number;
  incurredAt?: Date;
  notes?: string;
  adminUserId: string;
}) {
  const amount = round2(input.amount);
  if (amount <= 0) throw new Error("סכום ההוצאה חייב להיות חיובי.");

  return db.$transaction(async (tx) => {
    const claim = await tx.expenseClaim.create({
      data: {
        claimNumber: await nextClaimNumber(tx),
        employeeId: input.employeeId,
        description: input.description,
        category: input.category,
        amount,
        incurredAt: input.incurredAt ?? new Date(),
        notes: input.notes,
      },
    });

    await writeAdminAudit(tx, {
      adminUserId: input.adminUserId,
      action: "expense_claim_created",
      entity: "ExpenseClaim",
      entityId: claim.id,
      metadata: { claimNumber: claim.claimNumber, amount },
    });

    return claim;
  });
}

/** Approves a claim and posts the reimbursement entry (Dr Expense / Cr Cash). */
export async function approveExpenseClaim(input: {
  claimId: string;
  postedById?: string;
}) {
  return db.$transaction(async (tx) => {
    const claim = await tx.expenseClaim.findUnique({
      where: { id: input.claimId },
    });
    if (!claim) throw new Error("בקשת הוצאה לא נמצאה.");
    if (claim.status !== "SUBMITTED") {
      throw new Error("ניתן לאשר רק בקשה שהוגשה.");
    }

    await ensureExpenseAccount(tx);

    const amount = Number(claim.amount);
    let journalEntryId: string | undefined;
    const cashReady = await tx.ledgerAccount.count({
      where: { code: ACCOUNT.CASH },
    });
    if (cashReady > 0 && amount > 0) {
      const entry = await postJournalEntry(
        {
          entryDate: new Date(),
          memo: `החזר הוצאה ${claim.claimNumber} — ${claim.description}`,
          source: "expense",
          aggregateType: "ExpenseClaim",
          aggregateId: claim.id,
          postedById: input.postedById,
          lines: [
            {
              accountCode: ACCOUNT.GENERAL_EXPENSE,
              debit: amount,
              credit: 0,
              memo: "הוצאה תפעולית",
            },
            {
              accountCode: ACCOUNT.CASH,
              debit: 0,
              credit: amount,
              memo: "החזר לעובד",
            },
          ],
        },
        tx,
      );
      journalEntryId = entry.id;
    }

    return tx.expenseClaim.update({
      where: { id: claim.id },
      data: {
        status: "APPROVED",
        approvedById: input.postedById,
        approvedAt: new Date(),
        journalEntryId,
      },
    });
  });
}

/** Rejects a submitted claim. */
export async function rejectExpenseClaim(input: {
  claimId: string;
  adminUserId: string;
}) {
  const claim = await db.expenseClaim.findUnique({
    where: { id: input.claimId },
    select: { status: true },
  });
  if (!claim) throw new Error("בקשת הוצאה לא נמצאה.");
  if (claim.status !== "SUBMITTED") throw new Error("ניתן לדחות רק בקשה שהוגשה.");

  return db.$transaction(async (tx) => {
    const rejected = await tx.expenseClaim.update({
      where: { id: input.claimId },
      data: { status: "REJECTED" },
    });

    await writeAdminAudit(tx, {
      adminUserId: input.adminUserId,
      action: "expense_claim_rejected",
      entity: "ExpenseClaim",
      entityId: rejected.id,
    });

    return rejected;
  });
}

/** Recent claims with employee name. */
export async function listExpenseClaims(limit = 20) {
  const claims = await db.expenseClaim.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      claimNumber: true,
      description: true,
      category: true,
      amount: true,
      status: true,
      employee: { select: { firstName: true, lastName: true } },
    },
  });

  return claims.map((claim) => ({
    id: claim.id,
    claimNumber: claim.claimNumber,
    description: claim.description,
    category: claim.category,
    amount: Number(claim.amount),
    status: claim.status,
    employeeName: claim.employee
      ? `${claim.employee.firstName} ${claim.employee.lastName}`.trim()
      : null,
  }));
}

/** Status roll-up for the expense workbench. */
export async function getExpenseSummary() {
  const claims = await db.expenseClaim.findMany({
    select: { status: true, amount: true },
  });

  return summarizeExpenseClaims(
    claims.map((claim) => ({ status: claim.status, amount: Number(claim.amount) })),
  );
}
