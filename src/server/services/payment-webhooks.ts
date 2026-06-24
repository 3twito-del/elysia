import type { Prisma } from "@prisma/client";

import { db } from "~/server/db";
import { recordAnalyticsEvent } from "~/server/services/analytics";
import {
  postOrderSaleToLedger,
  refreshFinanceLedgerFromOrders,
} from "~/server/services/finance";
import { BUSINESS_EVENTS, enqueueOutboxEvent } from "~/server/services/outbox";
import { redactWebhookPayload } from "~/server/services/webhook-events";

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
        rawPayload: redactWebhookPayload(payload) as Prisma.InputJsonValue,
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
    await recordPaymentCapturedSideEffects({
      amount: Number(updated.amount),
      currency: updated.currency,
      customerId: order.customerId ?? undefined,
      orderCreatedAt: order.createdAt,
      orderId: payment.orderId,
      orderNumber: order.orderNumber,
      paymentId: updated.id,
      providerPaymentId: updated.providerPaymentId ?? undefined,
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

async function recordPaymentCapturedSideEffects(input: {
  amount: number;
  currency: string;
  customerId?: string;
  orderCreatedAt: Date;
  orderId: string;
  orderNumber: string;
  paymentId: string;
  providerPaymentId?: string;
}) {
  try {
    await recordAnalyticsEvent({
      type: "payment_captured",
      customerId: input.customerId,
      orderId: input.orderId,
      consentMode: "business",
      payload: {
        amount: input.amount,
        currency: input.currency,
        orderNumber: input.orderNumber,
        paymentId: input.paymentId,
        provider: "cardcom",
        providerPaymentId: input.providerPaymentId ?? null,
      },
      idempotencyKey: `payment_captured:${input.paymentId}`,
    });

    const from = new Date(input.orderCreatedAt);
    from.setDate(from.getDate() - 1);
    const to = new Date(input.orderCreatedAt);
    to.setDate(to.getDate() + 2);
    await refreshFinanceLedgerFromOrders({ from, to });

    // Post the balanced double-entry GL journal for the sale (FIN-GL-001).
    await postOrderSaleToLedger(input.orderId);
  } catch (error) {
    console.error("[payment-webhooks:analytics-finance-failed]", error);
  }
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
