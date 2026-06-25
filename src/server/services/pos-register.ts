import { db } from "~/server/db";

/**
 * Point-of-sale cash-register shifts (POS, Phase 8).
 *
 * A shift opens with a cash float; closing records the counted cash against the
 * expected (float + cash sales) and stores the variance. The variance math is
 * pure and exported for unit testing.
 */

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

/** Expected cash (float + sales) and the counted-vs-expected variance. Pure. */
export function computeShiftVariance(input: {
  openingFloat: number;
  cashSales: number;
  countedCash: number;
}) {
  const expectedCash = round2(input.openingFloat + input.cashSales);
  return { expectedCash, variance: round2(input.countedCash - expectedCash) };
}

async function nextShiftNumber() {
  const today = new Date();
  const prefix = `SH-${today.getUTCFullYear()}${String(
    today.getUTCMonth() + 1,
  ).padStart(2, "0")}`;
  const count = await db.registerShift.count({
    where: { shiftNumber: { startsWith: prefix } },
  });
  return `${prefix}-${String(count + 1).padStart(5, "0")}`;
}

/** Opens a register shift with a cash float. */
export async function openShift(input: {
  branchId?: string;
  openingFloat: number;
  openedById?: string;
}) {
  const openingFloat = round2(input.openingFloat);
  if (openingFloat < 0) throw new Error("קופה פותחת לא יכולה להיות שלילית.");

  return db.registerShift.create({
    data: {
      shiftNumber: await nextShiftNumber(),
      branchId: input.branchId,
      openingFloat,
      openedById: input.openedById,
    },
  });
}

/** Closes a shift, recording cash sales, counted cash and the variance. */
export async function closeShift(input: {
  shiftId: string;
  cashSales: number;
  countedCash: number;
  closedById?: string;
}) {
  const shift = await db.registerShift.findUnique({
    where: { id: input.shiftId },
    select: { status: true, openingFloat: true },
  });
  if (!shift) throw new Error("משמרת לא נמצאה.");
  if (shift.status !== "OPEN") throw new Error("ניתן לסגור רק משמרת פתוחה.");

  const cashSales = round2(input.cashSales);
  const countedCash = round2(input.countedCash);
  const { variance } = computeShiftVariance({
    openingFloat: Number(shift.openingFloat),
    cashSales,
    countedCash,
  });

  return db.registerShift.update({
    where: { id: input.shiftId },
    data: {
      status: "CLOSED",
      cashSales,
      countedCash,
      variance,
      closedById: input.closedById,
      closedAt: new Date(),
    },
  });
}

/** Recent register shifts. */
export async function listShifts(limit = 20) {
  const shifts = await db.registerShift.findMany({
    orderBy: { openedAt: "desc" },
    take: limit,
    select: {
      id: true,
      shiftNumber: true,
      status: true,
      openingFloat: true,
      cashSales: true,
      countedCash: true,
      variance: true,
    },
  });

  return shifts.map((shift) => ({
    id: shift.id,
    shiftNumber: shift.shiftNumber,
    status: shift.status,
    openingFloat: Number(shift.openingFloat),
    cashSales: Number(shift.cashSales),
    countedCash: shift.countedCash != null ? Number(shift.countedCash) : null,
    variance: shift.variance != null ? Number(shift.variance) : null,
  }));
}
