import type { OrderStatus, Prisma } from "@prisma/client";

import { BUSINESS_EVENTS, createOutboxEvent } from "~/server/services/outbox";

type TransactionClient = Prisma.TransactionClient;

export function canRefundOrderStatus(status: OrderStatus) {
  return [
    "PAID",
    "PREPARING",
    "READY_FOR_PICKUP",
    "SHIPPED",
    "COMPLETED",
  ].includes(status);
}

export function shouldRestockRefundedOrder(input: {
  status: OrderStatus;
  restockItems: boolean;
}) {
  return input.restockItems && ["SHIPPED", "COMPLETED"].includes(input.status);
}

export type RefundableOrderItem = {
  id: string;
  variantId: string;
  quantity: number;
  refundedQuantity: number;
  unitPrice: number;
};

export type ResolvedRefundLine = {
  orderItemId: string;
  variantId: string;
  quantity: number;
  unitPrice: number;
};

/**
 * OMS-006 (partial/line-level RMA): resolves exactly which order items and
 * quantities a refund covers. An explicit `requestedLines` refunds only
 * those (each validated against that item's own remaining unrefunded
 * quantity); omitting it refunds every item's full remaining unrefunded
 * quantity, which is the original full-order behavior unchanged.
 */
export function resolveRefundLines(input: {
  items: RefundableOrderItem[];
  requestedLines?: { orderItemId: string; quantity: number }[];
}): ResolvedRefundLine[] {
  if (!input.requestedLines) {
    return input.items
      .filter((item) => item.refundedQuantity < item.quantity)
      .map((item) => ({
        orderItemId: item.id,
        variantId: item.variantId,
        quantity: item.quantity - item.refundedQuantity,
        unitPrice: item.unitPrice,
      }));
  }

  const seen = new Set<string>();

  return input.requestedLines.map((requested) => {
    if (seen.has(requested.orderItemId)) {
      throw new Error("אותו פריט הזמנה מופיע יותר מפעם אחת בבקשת הזיכוי.");
    }
    seen.add(requested.orderItemId);

    const item = input.items.find((i) => i.id === requested.orderItemId);
    if (!item) throw new Error("פריט הזמנה לא נמצא לזיכוי.");

    const remaining = item.quantity - item.refundedQuantity;
    if (requested.quantity > remaining) {
      throw new Error(
        `לא ניתן לזכות ${requested.quantity} יח' — נותרו לזיכוי ${remaining} בלבד עבור פריט זה.`,
      );
    }

    return {
      orderItemId: item.id,
      variantId: item.variantId,
      quantity: requested.quantity,
      unitPrice: item.unitPrice,
    };
  });
}

export async function writeAdminAudit(
  tx: TransactionClient,
  input: {
    adminUserId: string;
    action: string;
    entity: string;
    entityId?: string;
    metadata?: Prisma.InputJsonValue;
  },
) {
  await tx.auditLog.create({
    data: {
      adminUserId: input.adminUserId,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      metadata: input.metadata,
    },
  });
}

export async function releaseOutstandingReservationsForRefund(
  tx: TransactionClient,
  input: {
    orderId: string;
    orderNumber: string;
  },
) {
  const reservations = await tx.inventoryReservation.findMany({
    where: {
      orderId: input.orderId,
      releasedAt: null,
    },
  });

  for (const reservation of reservations) {
    await tx.inventoryItem.updateMany({
      where: {
        branchId: reservation.branchId,
        variantId: reservation.variantId,
        reserved: { gte: reservation.quantity },
      },
      data: {
        reserved: { decrement: reservation.quantity },
      },
    });

    await tx.inventoryReservation.update({
      where: { id: reservation.id },
      data: { releasedAt: new Date() },
    });

    await tx.inventoryLedger.create({
      data: {
        branchId: reservation.branchId,
        variantId: reservation.variantId,
        delta: reservation.quantity,
        reason: "refund_reservation_released",
        reference: input.orderNumber,
      },
    });
  }
}

export async function createSearchReindexEvent(
  tx: TransactionClient,
  input: { aggregateId: string; reason: string },
) {
  await createOutboxEvent(tx, {
    type: BUSINESS_EVENTS.searchReindexRequested,
    aggregateType: "Product",
    aggregateId: input.aggregateId,
    idempotencyKey: `${BUSINESS_EVENTS.searchReindexRequested}:${input.reason}:${input.aggregateId}:${Date.now()}`,
    payload: input,
  });
}
