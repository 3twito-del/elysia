import { db } from "~/server/db";

/**
 * Warehouse pick lists (INV-007): a consolidated list of what to pick for the
 * orders currently being prepared, ordered by bin code so the picker walks an
 * efficient path. Aggregation, bin-path sorting and progress are pure + tested.
 */

export type PickLineDraft = {
  variantId: string;
  sku: string;
  name: string;
  quantity: number;
  binCode?: string | null;
};

/** Merges order lines by variant, summing quantities. Pure. */
export function aggregatePickLines(
  items: Array<{ variantId: string; sku: string; name: string; quantity: number }>,
): PickLineDraft[] {
  const byVariant = new Map<string, PickLineDraft>();
  for (const item of items) {
    const existing = byVariant.get(item.variantId);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      byVariant.set(item.variantId, {
        variantId: item.variantId,
        sku: item.sku,
        name: item.name,
        quantity: item.quantity,
      });
    }
  }
  return [...byVariant.values()];
}

/**
 * Comparator for bin codes producing a natural pick path (A-01-3 < A-01-10 <
 * B-01-1). Lines without a bin sort last. Pure.
 */
export function compareBinPath(
  a: string | null | undefined,
  b: string | null | undefined,
): number {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;

  const segmentsA = a.toUpperCase().split("-");
  const segmentsB = b.toUpperCase().split("-");
  const length = Math.max(segmentsA.length, segmentsB.length);
  for (let i = 0; i < length; i += 1) {
    const partA = segmentsA[i] ?? "";
    const partB = segmentsB[i] ?? "";
    const numA = Number(partA);
    const numB = Number(partB);
    const bothNumeric = !Number.isNaN(numA) && !Number.isNaN(numB);
    const cmp = bothNumeric ? numA - numB : partA.localeCompare(partB);
    if (cmp !== 0) return cmp;
  }
  return 0;
}

/** Sorts pick lines along the bin path. Pure (returns a new array). */
export function sortByBinPath(lines: PickLineDraft[]): PickLineDraft[] {
  return [...lines].sort((a, b) => compareBinPath(a.binCode, b.binCode));
}

/** Pick progress: total lines, picked lines, and rounded percentage. Pure. */
export function pickListProgress(lines: Array<{ picked: boolean }>): {
  total: number;
  picked: number;
  pct: number;
} {
  const total = lines.length;
  const picked = lines.filter((line) => line.picked).length;
  const pct = total === 0 ? 0 : Math.round((picked / total) * 100);
  return { total, picked, pct };
}

async function createNextPickNumber() {
  const today = new Date();
  const prefix = `PICK-${today.getUTCFullYear()}${String(
    today.getUTCMonth() + 1,
  ).padStart(2, "0")}`;
  const count = await db.pickList.count({
    where: { pickNumber: { startsWith: prefix } },
  });
  return `${prefix}-${String(count + 1).padStart(5, "0")}`;
}

/**
 * Generates a pick list from orders in PREPARING status (optionally for one
 * branch): aggregates their items, resolves a bin per variant, and stores the
 * lines ordered by bin path.
 */
export async function generatePickList(input: {
  branchId?: string;
  createdById?: string;
} = {}) {
  const orders = await db.order.findMany({
    where: {
      status: "PREPARING",
      ...(input.branchId ? { branchId: input.branchId } : {}),
    },
    select: {
      items: {
        select: { variantId: true, sku: true, name: true, quantity: true },
      },
    },
  });

  const items = orders.flatMap((order) => order.items);
  if (items.length === 0) {
    throw new Error("אין הזמנות בהכנה לליקוט.");
  }

  const aggregated = aggregatePickLines(items);

  // Resolve a bin per variant, preferring the target branch and active bins.
  const variantIds = aggregated.map((line) => line.variantId);
  const assignments = await db.binAssignment.findMany({
    where: { variantId: { in: variantIds }, quantity: { gt: 0 } },
    select: {
      variantId: true,
      bin: { select: { code: true, branchId: true, isActive: true } },
    },
  });

  const binByVariant = new Map<string, string>();
  for (const assignment of assignments) {
    if (!assignment.bin.isActive) continue;
    if (input.branchId && assignment.bin.branchId !== input.branchId) {
      // Keep a non-branch bin only if nothing better is found.
      if (!binByVariant.has(assignment.variantId)) {
        binByVariant.set(assignment.variantId, assignment.bin.code);
      }
      continue;
    }
    binByVariant.set(assignment.variantId, assignment.bin.code);
  }

  const withBins = aggregated.map((line) => ({
    ...line,
    binCode: binByVariant.get(line.variantId) ?? null,
  }));
  const sorted = sortByBinPath(withBins);

  return db.pickList.create({
    data: {
      pickNumber: await createNextPickNumber(),
      branchId: input.branchId,
      createdById: input.createdById,
      lines: {
        create: sorted.map((line) => ({
          variantId: line.variantId,
          sku: line.sku,
          name: line.name,
          quantity: line.quantity,
          binCode: line.binCode,
        })),
      },
    },
    include: { lines: true },
  });
}

export async function setPickLinePicked(input: {
  lineId: string;
  picked: boolean;
}) {
  return db.pickListLine.update({
    where: { id: input.lineId },
    data: { picked: input.picked },
  });
}

/** Marks a pick list complete (PICKED). */
export async function completePickList(input: { pickListId: string }) {
  const pickList = await db.pickList.findUnique({
    where: { id: input.pickListId },
    select: { status: true },
  });
  if (!pickList) throw new Error("רשימת ליקוט לא נמצאה.");
  if (pickList.status !== "OPEN") {
    throw new Error("ניתן להשלים רק רשימה פתוחה.");
  }
  return db.pickList.update({
    where: { id: input.pickListId },
    data: { status: "PICKED" },
  });
}

export async function cancelPickList(input: { pickListId: string }) {
  const pickList = await db.pickList.findUnique({
    where: { id: input.pickListId },
    select: { status: true },
  });
  if (!pickList) throw new Error("רשימת ליקוט לא נמצאה.");
  if (pickList.status !== "OPEN") {
    throw new Error("ניתן לבטל רק רשימה פתוחה.");
  }
  return db.pickList.update({
    where: { id: input.pickListId },
    data: { status: "CANCELLED" },
  });
}

/** Recent pick lists with progress and the open one's lines. */
export async function listPickLists(limit = 10) {
  const pickLists = await db.pickList.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      pickNumber: true,
      status: true,
      createdAt: true,
      lines: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          sku: true,
          name: true,
          quantity: true,
          binCode: true,
          picked: true,
        },
      },
    },
  });

  return pickLists.map((pickList) => ({
    id: pickList.id,
    pickNumber: pickList.pickNumber,
    status: pickList.status,
    createdAt: pickList.createdAt,
    lines: pickList.lines,
    progress: pickListProgress(pickList.lines),
  }));
}

export async function getPickListSummary() {
  const [open, picked] = await Promise.all([
    db.pickList.count({ where: { status: "OPEN" } }),
    db.pickList.count({ where: { status: "PICKED" } }),
  ]);
  return { open, picked };
}
