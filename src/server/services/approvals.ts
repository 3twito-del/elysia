import { db } from "~/server/db";

/**
 * Generic approval workflow (WFL, Phase 7).
 *
 * Any module can raise an ApprovalRequest (optionally with an amount and an
 * entity link); a reviewer approves or rejects it. summarizeApprovals is pure
 * and exported for unit testing.
 */

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export type ApprovalSummaryInput = { status: string; amount: number | null };

/** Counts by status and totals the pending amount. Pure. */
export function summarizeApprovals(requests: ApprovalSummaryInput[]) {
  let pending = 0;
  let approved = 0;
  let rejected = 0;
  let pendingAmount = 0;

  for (const request of requests) {
    if (request.status === "PENDING") {
      pending += 1;
      pendingAmount = round2(pendingAmount + (request.amount ?? 0));
    } else if (request.status === "APPROVED") {
      approved += 1;
    } else if (request.status === "REJECTED") {
      rejected += 1;
    }
  }

  return { pending, approved, rejected, pendingAmount };
}

async function nextRequestNumber() {
  const today = new Date();
  const prefix = `APR-${today.getUTCFullYear()}`;
  const count = await db.approvalRequest.count({
    where: { requestNumber: { startsWith: prefix } },
  });
  return `${prefix}-${String(count + 1).padStart(5, "0")}`;
}

/** Raises a PENDING approval request. */
export async function createApprovalRequest(input: {
  title: string;
  amount?: number;
  entityType?: string;
  entityId?: string;
  notes?: string;
  requestedById?: string;
}) {
  if (!input.title.trim()) throw new Error("חסרה כותרת לבקשת האישור.");

  return db.approvalRequest.create({
    data: {
      requestNumber: await nextRequestNumber(),
      title: input.title.trim(),
      amount: input.amount != null ? round2(input.amount) : null,
      entityType: input.entityType,
      entityId: input.entityId,
      notes: input.notes,
      requestedById: input.requestedById,
    },
  });
}

/** Approves or rejects a pending request. */
export async function decideApprovalRequest(input: {
  requestId: string;
  decision: "APPROVED" | "REJECTED";
  decidedById?: string;
}) {
  const request = await db.approvalRequest.findUnique({
    where: { id: input.requestId },
    select: { status: true },
  });
  if (!request) throw new Error("בקשת אישור לא נמצאה.");
  if (request.status !== "PENDING") {
    throw new Error("ניתן להכריע רק בקשה ממתינה.");
  }

  return db.approvalRequest.update({
    where: { id: input.requestId },
    data: {
      status: input.decision,
      decidedById: input.decidedById,
      decidedAt: new Date(),
    },
  });
}

/** Recent approval requests for the workbench. */
export async function listApprovalRequests(limit = 20) {
  const requests = await db.approvalRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      requestNumber: true,
      title: true,
      amount: true,
      status: true,
    },
  });

  return requests.map((request) => ({
    id: request.id,
    requestNumber: request.requestNumber,
    title: request.title,
    amount: request.amount != null ? Number(request.amount) : null,
    status: request.status,
  }));
}

/** Status roll-up for the approvals card. */
export async function getApprovalSummary() {
  const requests = await db.approvalRequest.findMany({
    select: { status: true, amount: true },
  });

  return summarizeApprovals(
    requests.map((request) => ({
      status: request.status,
      amount: request.amount != null ? Number(request.amount) : null,
    })),
  );
}
