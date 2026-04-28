import type { Prisma } from "@prisma/client";

import { db } from "~/server/db";
import { BUSINESS_EVENTS, enqueueOutboxEvent } from "~/server/services/outbox";

export async function applyCardComWebhook(payload: unknown) {
  const providerPaymentId = getPayloadString(payload, [
    "providerPaymentId",
    "transactionId",
    "TransactionId",
    "lowProfileCode",
    "LowProfileCode",
  ]);
  const orderId = getPayloadString(payload, ["orderId", "OrderId"]);
  const orderNumber = getPayloadString(payload, ["orderNumber", "OrderNumber"]);
  const providerStatus =
    getPayloadString(payload, ["status", "Status", "ResponseCode"]) ??
    "received";
  const captured = isCapturedStatus(providerStatus);
  const failed = isFailedStatus(providerStatus);
  const matchers: Prisma.PaymentWhereInput[] = [];

  if (providerPaymentId) matchers.push({ providerPaymentId });
  if (orderId) matchers.push({ orderId });
  if (orderNumber) matchers.push({ order: { orderNumber } });

  if (matchers.length === 0) {
    return {
      matched: false,
      captured,
      providerStatus,
    };
  }

  const payment = await db.payment.findFirst({
    where: {
      provider: "cardcom",
      OR: matchers,
    },
  });

  if (!payment) {
    return {
      matched: false,
      captured,
      providerStatus,
    };
  }

  const order = await db.order.findUniqueOrThrow({
    where: { id: payment.orderId },
  });
  const updated = await db.$transaction(async (tx) => {
    const updatedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: {
        providerPaymentId: providerPaymentId ?? payment.providerPaymentId,
        providerStatus,
        status: captured ? "CAPTURED" : failed ? "FAILED" : payment.status,
        capturedAt: captured ? new Date() : payment.capturedAt,
        failureCode: failed ? providerStatus : payment.failureCode,
        rawPayload: payload as Prisma.InputJsonValue,
      },
    });

    if (captured && order.status === "PENDING_PAYMENT") {
      await tx.order.update({
        where: { id: payment.orderId },
        data: {
          status: "PAID",
          paidAt: new Date(),
        },
      });
    }

    return updatedPayment;
  });

  if (captured) {
    await enqueueOutboxEvent({
      type: BUSINESS_EVENTS.paymentCaptured,
      aggregateType: "Order",
      aggregateId: payment.orderId,
      idempotencyKey: `${BUSINESS_EVENTS.paymentCaptured}:cardcom:${updated.id}`,
      payload: {
        orderId: payment.orderId,
        orderNumber: order.orderNumber,
        provider: "cardcom",
        providerPaymentId: updated.providerPaymentId,
      },
    });
  }

  return {
    matched: true,
    captured,
    providerStatus,
    paymentId: updated.id,
    orderId: payment.orderId,
  };
}

function getPayloadString(payload: unknown, keys: string[]) {
  if (!payload || typeof payload !== "object") return null;

  const record = payload as Record<string, unknown>;

  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }

  return null;
}

function isCapturedStatus(status: string) {
  return ["0", "success", "succeeded", "paid", "captured", "approved"].includes(
    status.trim().toLowerCase(),
  );
}

function isFailedStatus(status: string) {
  return ["failed", "failure", "declined", "error", "rejected"].includes(
    status.trim().toLowerCase(),
  );
}
