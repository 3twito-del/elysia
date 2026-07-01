import { db } from "~/server/db";

/**
 * Branch-to-branch stock transfers (WMS, Phase 3).
 *
 * A transfer is created as a DRAFT, then completed atomically: the source
 * InventoryItem is decremented, the destination incremented, and paired
 * InventoryLedger entries (transfer_out / transfer_in) are written so the
 * immutable stock history stays consistent. Pure helpers are exported for tests.
 */

export type TransferLineInput = { variantId: string; quantity: number };

export type StockMovement = {
  branchId: string;
  variantId: string;
  delta: number;
  reason: "transfer_out" | "transfer_in";
};

/**
 * Plans the paired stock movements for a transfer (out of source / into dest).
 * Validates distinct branches and positive integer quantities. Pure.
 */
export function planStockTransfer(input: {
  sourceBranchId: string;
  destBranchId: string;
  lines: TransferLineInput[];
}): StockMovement[] {
  if (input.sourceBranchId === input.destBranchId) {
    throw new Error("סניף המקור והיעד חייבים להיות שונים.");
  }
  if (input.lines.length === 0) {
    throw new Error("נדרשת לפחות שורה אחת להעברה.");
  }

  const movements: StockMovement[] = [];
  for (const line of input.lines) {
    if (!Number.isInteger(line.quantity) || line.quantity <= 0) {
      throw new Error("כמות ההעברה חייבת להיות מספר שלם חיובי.");
    }
    movements.push({
      branchId: input.sourceBranchId,
      variantId: line.variantId,
      delta: -line.quantity,
      reason: "transfer_out",
    });
    movements.push({
      branchId: input.destBranchId,
      variantId: line.variantId,
      delta: line.quantity,
      reason: "transfer_in",
    });
  }

  return movements;
}

/** Parses free-text transfer lines "SKU | quantity" (one per line). Pure. */
export function parseTransferLines(
  input: string,
): Array<{ sku: string; quantity: number }> {
  return input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const [sku, qtyRaw] = line.split("|").map((part) => part.trim());
      const quantity = Math.trunc(Number(qtyRaw ?? 0) || 0);

      if (!sku) throw new Error(`שורה ללא מק"ט: "${line}"`);
      if (quantity <= 0) throw new Error(`כמות לא תקינה: "${line}"`);

      return { sku, quantity };
    });
}

async function createNextTransferNumber() {
  const today = new Date();
  const prefix = `TRF-${today.getUTCFullYear()}${String(
    today.getUTCMonth() + 1,
  ).padStart(2, "0")}`;
  const count = await db.stockTransfer.count({
    where: { transferNumber: { startsWith: prefix } },
  });

  return `${prefix}-${String(count + 1).padStart(5, "0")}`;
}

/** Active branches for transfer source/destination selects. */
export async function listBranchesForSelect() {
  return db.branch.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true },
  });
}

/** Creates a DRAFT transfer, resolving line SKUs to variants. */
export async function createStockTransfer(input: {
  sourceBranchId: string;
  destBranchId: string;
  lines: Array<{ sku: string; quantity: number }>;
  notes?: string;
  createdById?: string;
}) {
  if (input.sourceBranchId === input.destBranchId) {
    throw new Error("סניף המקור והיעד חייבים להיות שונים.");
  }
  if (input.lines.length === 0) {
    throw new Error("נדרשת לפחות שורה אחת להעברה.");
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

  return db.stockTransfer.create({
    data: {
      transferNumber: await createNextTransferNumber(),
      sourceBranchId: input.sourceBranchId,
      destBranchId: input.destBranchId,
      notes: input.notes,
      createdById: input.createdById,
      lines: {
        create: input.lines.map((line) => ({
          variantId: variantBySku.get(line.sku)!,
          quantity: line.quantity,
        })),
      },
    },
    include: { lines: true },
  });
}

/**
 * Completes a DRAFT transfer: validates source availability, moves the stock and
 * writes the immutable ledger entries — all atomically.
 */
export async function completeStockTransfer(input: { transferId: string }) {
  return db.$transaction(async (tx) => {
    const transfer = await tx.stockTransfer.findUnique({
      where: { id: input.transferId },
      include: { lines: true },
    });
    if (!transfer) throw new Error("העברת מלאי לא נמצאה.");
    if (transfer.status !== "DRAFT" && transfer.status !== "IN_TRANSIT") {
      throw new Error("ניתן להשלים רק העברה בטיוטה או בדרך.");
    }
    // When dispatched (IN_TRANSIT) the source was already decremented; only the
    // destination leg remains. A DRAFT completes both legs at once (as before).
    const sourceLegPending = transfer.status === "DRAFT";

    for (const line of transfer.lines) {
      if (sourceLegPending) {
        const source = await tx.inventoryItem.findUnique({
          where: {
            branchId_variantId: {
              branchId: transfer.sourceBranchId,
              variantId: line.variantId,
            },
          },
          select: { quantity: true, reserved: true },
        });
        const available = (source?.quantity ?? 0) - (source?.reserved ?? 0);
        if (available < line.quantity) {
          throw new Error(
            `מלאי זמין לא מספיק בסניף המקור עבור פריט (${line.variantId}).`,
          );
        }
        await tx.inventoryItem.update({
          where: {
            branchId_variantId: {
              branchId: transfer.sourceBranchId,
              variantId: line.variantId,
            },
          },
          data: { quantity: { decrement: line.quantity } },
        });
        await tx.inventoryLedger.create({
          data: {
            branchId: transfer.sourceBranchId,
            variantId: line.variantId,
            delta: -line.quantity,
            reason: "transfer_out",
            reference: transfer.transferNumber,
          },
        });
      }

      await tx.inventoryItem.upsert({
        where: {
          branchId_variantId: {
            branchId: transfer.destBranchId,
            variantId: line.variantId,
          },
        },
        create: {
          branchId: transfer.destBranchId,
          variantId: line.variantId,
          quantity: line.quantity,
        },
        update: { quantity: { increment: line.quantity } },
      });

      await tx.inventoryLedger.create({
        data: {
          branchId: transfer.destBranchId,
          variantId: line.variantId,
          delta: line.quantity,
          reason: "transfer_in",
          reference: transfer.transferNumber,
        },
      });
    }

    return tx.stockTransfer.update({
      where: { id: transfer.id },
      data: { status: "COMPLETED", completedAt: new Date() },
    });
  });
}

/**
 * Dispatches a DRAFT transfer (→ IN_TRANSIT): validates and decrements source
 * stock now, writing the transfer_out ledger; the destination leg is applied
 * later by completeStockTransfer (receive).
 */
export async function dispatchStockTransfer(input: { transferId: string }) {
  return db.$transaction(async (tx) => {
    const transfer = await tx.stockTransfer.findUnique({
      where: { id: input.transferId },
      include: { lines: true },
    });
    if (!transfer) throw new Error("העברת מלאי לא נמצאה.");
    if (transfer.status !== "DRAFT") {
      throw new Error("ניתן לשלוח רק העברה בסטטוס טיוטה.");
    }

    for (const line of transfer.lines) {
      const source = await tx.inventoryItem.findUnique({
        where: {
          branchId_variantId: {
            branchId: transfer.sourceBranchId,
            variantId: line.variantId,
          },
        },
        select: { quantity: true, reserved: true },
      });
      const available = (source?.quantity ?? 0) - (source?.reserved ?? 0);
      if (available < line.quantity) {
        throw new Error(
          `מלאי זמין לא מספיק בסניף המקור עבור פריט (${line.variantId}).`,
        );
      }
      await tx.inventoryItem.update({
        where: {
          branchId_variantId: {
            branchId: transfer.sourceBranchId,
            variantId: line.variantId,
          },
        },
        data: { quantity: { decrement: line.quantity } },
      });
      await tx.inventoryLedger.create({
        data: {
          branchId: transfer.sourceBranchId,
          variantId: line.variantId,
          delta: -line.quantity,
          reason: "transfer_out",
          reference: transfer.transferNumber,
        },
      });
    }

    return tx.stockTransfer.update({
      where: { id: transfer.id },
      data: { status: "IN_TRANSIT" },
    });
  });
}

/** Cancels a DRAFT transfer (no stock has moved yet). */
export async function cancelStockTransfer(input: { transferId: string }) {
  const transfer = await db.stockTransfer.findUnique({
    where: { id: input.transferId },
    select: { status: true },
  });
  if (!transfer) throw new Error("העברת מלאי לא נמצאה.");
  if (transfer.status !== "DRAFT") {
    throw new Error("ניתן לבטל רק העברה בסטטוס טיוטה.");
  }

  return db.stockTransfer.update({
    where: { id: input.transferId },
    data: { status: "CANCELLED" },
  });
}

/** Recent transfers with branch names and line totals. */
export async function listStockTransfers(limit = 20) {
  const transfers = await db.stockTransfer.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      transferNumber: true,
      status: true,
      createdAt: true,
      sourceBranch: { select: { name: true } },
      destBranch: { select: { name: true } },
      lines: { select: { quantity: true } },
    },
  });

  return transfers.map((transfer) => ({
    id: transfer.id,
    transferNumber: transfer.transferNumber,
    status: transfer.status,
    createdAt: transfer.createdAt,
    sourceBranchName: transfer.sourceBranch.name,
    destBranchName: transfer.destBranch.name,
    lineCount: transfer.lines.length,
    totalQuantity: transfer.lines.reduce((sum, line) => sum + line.quantity, 0),
  }));
}
