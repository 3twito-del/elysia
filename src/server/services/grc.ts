import { db } from "~/server/db";

/**
 * Governance, risk & compliance register (GRC, §4.Z).
 *
 * Items track risks/policies/audits/tasks through OPEN → IN_PROGRESS →
 * RESOLVED/ACCEPTED with a severity and optional due date. The roll-up and the
 * overdue test are pure and exported for unit testing.
 */

const OPEN_STATUSES = ["OPEN", "IN_PROGRESS"];

export type ComplianceSummaryInput = { status: string; severity: string };

/** Whether an item is past due and still open. Pure. */
export function isOverdue(
  dueAt: Date | null,
  status: string,
  now: Date = new Date(),
): boolean {
  if (!dueAt) return false;
  if (!OPEN_STATUSES.includes(status)) return false;
  return dueAt.getTime() < now.getTime();
}

/** Counts by status and the open high/critical exposure. Pure. */
export function summarizeCompliance(items: ComplianceSummaryInput[]) {
  let open = 0;
  let resolved = 0;
  let openHighOrCritical = 0;

  for (const item of items) {
    if (OPEN_STATUSES.includes(item.status)) {
      open += 1;
      if (item.severity === "HIGH" || item.severity === "CRITICAL") {
        openHighOrCritical += 1;
      }
    } else {
      resolved += 1;
    }
  }

  return { open, resolved, openHighOrCritical };
}

async function nextItemNumber() {
  const count = await db.complianceItem.count();
  return `GRC-${String(count + 1).padStart(5, "0")}`;
}

/** Creates a compliance/risk item. */
export async function createComplianceItem(input: {
  title: string;
  category?: string;
  severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  dueAt?: Date;
  notes?: string;
  ownerAdminUserId?: string;
}) {
  if (!input.title.trim()) throw new Error("כותרת הפריט היא שדה חובה.");

  return db.complianceItem.create({
    data: {
      itemNumber: await nextItemNumber(),
      title: input.title.trim(),
      category: input.category,
      severity: input.severity ?? "MEDIUM",
      dueAt: input.dueAt,
      notes: input.notes,
      ownerAdminUserId: input.ownerAdminUserId,
    },
  });
}

/** Updates an item's status (resolving stamps resolvedAt). */
export async function setComplianceStatus(input: {
  itemId: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "ACCEPTED";
}) {
  const resolved = input.status === "RESOLVED" || input.status === "ACCEPTED";

  return db.complianceItem.update({
    where: { id: input.itemId },
    data: {
      status: input.status,
      resolvedAt: resolved ? new Date() : null,
    },
  });
}

/** Recent register items with an overdue flag. */
export async function listComplianceItems(limit = 30) {
  const now = new Date();
  const items = await db.complianceItem.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: limit,
    select: {
      id: true,
      itemNumber: true,
      title: true,
      category: true,
      severity: true,
      status: true,
      dueAt: true,
    },
  });

  return items.map((item) => ({
    ...item,
    overdue: isOverdue(item.dueAt, item.status, now),
  }));
}

/** Register summary. */
export async function getComplianceSummary() {
  const items = await db.complianceItem.findMany({
    select: { status: true, severity: true },
  });
  return summarizeCompliance(items);
}
