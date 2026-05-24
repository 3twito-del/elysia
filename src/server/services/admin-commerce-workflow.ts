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
