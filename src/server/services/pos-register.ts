import { db } from "~/server/db";
import { postOrderSaleToLedger } from "~/server/services/finance";
import { awardPointsForOrder } from "~/server/services/loyalty";
import { createCommerceOrderNumber } from "~/server/services/order-workflow";

/**
 * Point-of-sale cash-register shifts (POS, Phase 8).
 *
 * A shift opens with a cash float; an in-store sale (`recordPosSale`) creates a
 * real PAID Order — deducting on-hand stock, writing the inventory ledger and
 * posting the balanced GL sale — so the register draws on the *same* inventory
 * and money source as e-commerce (PRIN-001). Closing reconciles the counted
 * cash against the expected (float + the shift's actual cash sales). The
 * variance math is pure and exported for unit testing.
 */

const POS_PAYMENT_PROVIDER = "pos_cash";

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

/** Line total for a single POS item. Pure. */
export function posLineTotal(unitPrice: number, quantity: number) {
  return round2(unitPrice * quantity);
}

/** Sum of actual cash-sale order totals booked against a shift. */
async function sumShiftCashSales(shiftId: string) {
  const agg = await db.order.aggregate({
    where: { registerShiftId: shiftId },
    _sum: { total: true },
  });
  return round2(Number(agg._sum.total ?? 0));
}

/**
 * Records an in-store cash sale against an open shift: creates a PAID Order,
 * deducts on-hand stock atomically, writes the inventory ledger, captures a
 * cash payment, then posts the GL sale and awards loyalty points via the same
 * idempotent post-commit paths the e-commerce webhook uses.
 */
export async function recordPosSale(input: {
  shiftId: string;
  sku: string;
  quantity: number;
  customerEmail?: string;
  soldById?: string;
}) {
  const quantity = Math.trunc(input.quantity);
  if (quantity <= 0) throw new Error("כמות המכירה חייבת להיות מספר שלם חיובי.");

  const sku = input.sku.trim();
  if (!sku) throw new Error('יש להזין מק"ט.');

  const trimmedEmail = input.customerEmail?.trim();
  const customerEmail =
    trimmedEmail && trimmedEmail.length > 0 ? trimmedEmail : undefined;

  const result = await db.$transaction(async (tx) => {
    const shift = await tx.registerShift.findUnique({
      where: { id: input.shiftId },
      select: { id: true, status: true, branchId: true },
    });
    if (!shift) throw new Error("משמרת לא נמצאה.");
    if (shift.status !== "OPEN") throw new Error("ניתן למכור רק במשמרת פתוחה.");
    if (!shift.branchId) {
      throw new Error("למשמרת אין סניף — לא ניתן לנכות מלאי.");
    }

    const variant = await tx.productVariant.findUnique({
      where: { sku },
      select: {
        id: true,
        sku: true,
        name: true,
        priceDelta: true,
        product: { select: { name: true } },
        prices: {
          where: {
            currency: "ILS",
            OR: [{ validTo: null }, { validTo: { gt: new Date() } }],
          },
          orderBy: { validFrom: "desc" },
          take: 1,
        },
      },
    });
    if (!variant) throw new Error(`מק"ט לא ידוע: ${sku}`);

    const price = variant.prices[0];
    if (!price) throw new Error("לתכשיט אין מחיר פעיל בשקלים.");

    const inventoryItem = await tx.inventoryItem.findUnique({
      where: {
        branchId_variantId: { branchId: shift.branchId, variantId: variant.id },
      },
      select: { id: true, quantity: true, reserved: true },
    });
    if (!inventoryItem) {
      throw new Error("אין מלאי מוגדר לתכשיט בסניף המשמרת.");
    }
    if (inventoryItem.quantity - inventoryItem.reserved < quantity) {
      throw new Error("אין מספיק מלאי זמין למכירה.");
    }

    const unitPrice = Number(price.amount) + Number(variant.priceDelta);
    const total = posLineTotal(unitPrice, quantity);

    const customer = customerEmail
      ? await tx.customer.findUnique({
          where: { email: customerEmail },
          select: { id: true, phone: true, firstName: true },
        })
      : null;

    const now = new Date();
    const order = await tx.order.create({
      data: {
        orderNumber: createCommerceOrderNumber(now),
        customerId: customer?.id,
        branchId: shift.branchId,
        registerShiftId: shift.id,
        status: "PAID",
        fulfillmentMethod: "PICKUP",
        currency: "ILS",
        subtotal: total,
        total,
        paidAt: now,
        email: customerEmail ?? "pos@walk-in.local",
        phone: customer?.phone ?? "—",
        recipientName: customer?.firstName ?? "מכירת קופה",
        items: {
          create: {
            variantId: variant.id,
            name: `${variant.product.name} — ${variant.name}`,
            sku: variant.sku,
            quantity,
            unitPrice,
          },
        },
      },
    });

    // Deduct on-hand stock atomically (immediate handover — no reservation).
    const deducted = await tx.inventoryItem.updateMany({
      where: {
        id: inventoryItem.id,
        quantity: { gte: inventoryItem.reserved + quantity },
      },
      data: { quantity: { decrement: quantity } },
    });
    if (deducted.count !== 1) {
      throw new Error("מצב המלאי השתנה בזמן המכירה. נסו שוב.");
    }

    await tx.inventoryLedger.create({
      data: {
        branchId: shift.branchId,
        variantId: variant.id,
        delta: -quantity,
        reason: "pos_sale",
        reference: order.orderNumber,
      },
    });

    await tx.payment.create({
      data: {
        orderId: order.id,
        provider: POS_PAYMENT_PROVIDER,
        status: "CAPTURED",
        amount: total,
        currency: "ILS",
        capturedAt: now,
        idempotencyKey: `pos_${order.id}`,
      },
    });

    if (input.soldById) {
      await tx.auditLog.create({
        data: {
          adminUserId: input.soldById,
          action: "pos_sale_recorded",
          entity: "Order",
          entityId: order.id,
          metadata: {
            orderNumber: order.orderNumber,
            sku: variant.sku,
            quantity,
            total,
          },
        },
      });
    }

    return { orderId: order.id, orderNumber: order.orderNumber, total };
  });

  // Reuse the e-commerce post-commit paths: balanced GL sale (FIN-GL-001) and
  // loyalty accrual — both idempotent per order, best-effort so a posting hiccup
  // never voids a completed in-store sale.
  try {
    await postOrderSaleToLedger(result.orderId);
    await awardPointsForOrder(result.orderId);
  } catch (error) {
    console.error("[pos-sale:posting-failed]", error);
  }

  return result;
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

/**
 * Closes a shift. Cash sales are derived from the actual orders booked against
 * the shift (single source of truth) — only the physical count is supplied.
 */
export async function closeShift(input: {
  shiftId: string;
  countedCash: number;
  closedById?: string;
}) {
  const shift = await db.registerShift.findUnique({
    where: { id: input.shiftId },
    select: { status: true, openingFloat: true },
  });
  if (!shift) throw new Error("משמרת לא נמצאה.");
  if (shift.status !== "OPEN") throw new Error("ניתן לסגור רק משמרת פתוחה.");

  const cashSales = await sumShiftCashSales(input.shiftId);
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

/** Recent register shifts, with live cash sales + order count per shift. */
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

  const shiftIds = shifts.map((shift) => shift.id);
  const sales = shiftIds.length
    ? await db.order.groupBy({
        by: ["registerShiftId"],
        where: { registerShiftId: { in: shiftIds } },
        _sum: { total: true },
        _count: { _all: true },
      })
    : [];
  const salesByShift = new Map(
    sales.map((row) => [
      row.registerShiftId,
      { cash: round2(Number(row._sum.total ?? 0)), count: row._count._all },
    ]),
  );

  return shifts.map((shift) => {
    const live = salesByShift.get(shift.id);
    return {
      id: shift.id,
      shiftNumber: shift.shiftNumber,
      status: shift.status,
      openingFloat: Number(shift.openingFloat),
      // Open shifts show the running total; closed shifts the booked figure.
      cashSales:
        shift.status === "OPEN" ? (live?.cash ?? 0) : Number(shift.cashSales),
      salesCount: live?.count ?? 0,
      countedCash: shift.countedCash != null ? Number(shift.countedCash) : null,
      variance: shift.variance != null ? Number(shift.variance) : null,
    };
  });
}
