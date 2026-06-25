import { db } from "~/server/db";

/**
 * Cycle counting (WMS, Phase 3).
 *
 * A count is created as a DRAFT with the physically counted quantity per variant.
 * Completing it snapshots the current book quantity, sets the InventoryItem to
 * the counted quantity (physical reality wins), and writes a
 * cycle_count_adjustment InventoryLedger entry for any variance. Pure helpers are
 * exported for unit testing.
 */

export type CountVarianceLine = { bookQty: number; countedQty: number };

/** Per-line and aggregate variance (counted − book). Pure. */
export function computeCountVariance(lines: CountVarianceLine[]) {
  let totalVariance = 0;
  let linesWithVariance = 0;

  const rows = lines.map((line) => {
    const variance = line.countedQty - line.bookQty;
    if (variance !== 0) {
      linesWithVariance += 1;
      totalVariance += variance;
    }
    return { ...line, variance };
  });

  return { rows, totalVariance, linesWithVariance };
}

export type CountAdjustment = {
  variantId: string;
  delta: number;
  bookQty: number;
  countedQty: number;
};

/**
 * Builds the inventory adjustments for the variant lines that differ from book.
 * delta = countedQty − bookQty. Lines with no variance are omitted. Pure.
 */
export function planCountAdjustments(
  lines: Array<{ variantId: string; bookQty: number; countedQty: number }>,
): CountAdjustment[] {
  return lines
    .map((line) => ({
      variantId: line.variantId,
      delta: line.countedQty - line.bookQty,
      bookQty: line.bookQty,
      countedQty: line.countedQty,
    }))
    .filter((line) => line.delta !== 0);
}

/** Parses free-text count lines "SKU | countedQty" (one per line). Pure. */
export function parseCountLines(
  input: string,
): Array<{ sku: string; countedQty: number }> {
  return input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const [sku, qtyRaw] = line.split("|").map((part) => part.trim());
      const countedQty = Math.trunc(Number(qtyRaw ?? "") || 0);

      if (!sku) throw new Error(`שורה ללא מק"ט: "${line}"`);
      if (!Number.isFinite(countedQty) || countedQty < 0) {
        throw new Error(`כמות ספירה לא תקינה: "${line}"`);
      }

      return { sku, countedQty };
    });
}

async function createNextCountNumber() {
  const today = new Date();
  const prefix = `CNT-${today.getUTCFullYear()}${String(
    today.getUTCMonth() + 1,
  ).padStart(2, "0")}`;
  const count = await db.inventoryCount.count({
    where: { countNumber: { startsWith: prefix } },
  });

  return `${prefix}-${String(count + 1).padStart(5, "0")}`;
}

/** Creates a DRAFT count, resolving line SKUs to variants. */
export async function createInventoryCount(input: {
  branchId: string;
  lines: Array<{ sku: string; countedQty: number }>;
  notes?: string;
  countedById?: string;
}) {
  if (!input.branchId) throw new Error("יש לבחור סניף.");
  if (input.lines.length === 0) {
    throw new Error("נדרשת לפחות שורת ספירה אחת.");
  }

  const skus = input.lines.map((line) => line.sku);
  const variants = await db.productVariant.findMany({
    where: { sku: { in: skus } },
    select: { id: true, sku: true },
  });
  const variantBySku = new Map(variants.map((v) => [v.sku, v.id]));

  const missing = skus.filter((sku) => !variantBySku.has(sku));
  if (missing.length > 0) {
    throw new Error(`מק"טים לא ידועים: ${missing.join(", ")}`);
  }

  return db.inventoryCount.create({
    data: {
      countNumber: await createNextCountNumber(),
      branchId: input.branchId,
      notes: input.notes,
      countedById: input.countedById,
      lines: {
        create: input.lines.map((line) => ({
          variantId: variantBySku.get(line.sku)!,
          countedQty: line.countedQty,
        })),
      },
    },
    include: { lines: true },
  });
}

/**
 * Completes a DRAFT count: snapshots book quantity, sets each InventoryItem to
 * the counted quantity, and writes a cycle_count_adjustment ledger entry for any
 * variance — all atomically.
 */
export async function completeInventoryCount(input: { countId: string }) {
  return db.$transaction(async (tx) => {
    const count = await tx.inventoryCount.findUnique({
      where: { id: input.countId },
      include: { lines: true },
    });
    if (!count) throw new Error("ספירת מלאי לא נמצאה.");
    if (count.status !== "DRAFT") {
      throw new Error("ניתן להשלים רק ספירה בסטטוס טיוטה.");
    }

    for (const line of count.lines) {
      const item = await tx.inventoryItem.findUnique({
        where: {
          branchId_variantId: {
            branchId: count.branchId,
            variantId: line.variantId,
          },
        },
        select: { quantity: true },
      });

      const bookQty = item?.quantity ?? 0;
      const delta = line.countedQty - bookQty;

      await tx.inventoryCountLine.update({
        where: { id: line.id },
        data: { bookQty },
      });

      if (delta === 0) continue;

      await tx.inventoryItem.upsert({
        where: {
          branchId_variantId: {
            branchId: count.branchId,
            variantId: line.variantId,
          },
        },
        create: {
          branchId: count.branchId,
          variantId: line.variantId,
          quantity: line.countedQty,
        },
        update: { quantity: line.countedQty },
      });

      await tx.inventoryLedger.create({
        data: {
          branchId: count.branchId,
          variantId: line.variantId,
          delta,
          reason: "cycle_count_adjustment",
          reference: count.countNumber,
        },
      });
    }

    return tx.inventoryCount.update({
      where: { id: count.id },
      data: { status: "COMPLETED", completedAt: new Date() },
    });
  });
}

/** Cancels a DRAFT count (nothing has been adjusted yet). */
export async function cancelInventoryCount(input: { countId: string }) {
  const count = await db.inventoryCount.findUnique({
    where: { id: input.countId },
    select: { status: true },
  });
  if (!count) throw new Error("ספירת מלאי לא נמצאה.");
  if (count.status !== "DRAFT") {
    throw new Error("ניתן לבטל רק ספירה בסטטוס טיוטה.");
  }

  return db.inventoryCount.update({
    where: { id: input.countId },
    data: { status: "CANCELLED" },
  });
}

/** Recent counts with branch name and line totals. */
export async function listInventoryCounts(limit = 20) {
  const counts = await db.inventoryCount.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      countNumber: true,
      status: true,
      createdAt: true,
      branch: { select: { name: true } },
      lines: { select: { countedQty: true, bookQty: true } },
    },
  });

  return counts.map((count) => {
    const variance = count.lines.reduce((sum, line) => {
      if (line.bookQty === null) return sum;
      return sum + (line.countedQty - line.bookQty);
    }, 0);

    return {
      id: count.id,
      countNumber: count.countNumber,
      status: count.status,
      createdAt: count.createdAt,
      branchName: count.branch.name,
      lineCount: count.lines.length,
      netVariance: variance,
    };
  });
}
