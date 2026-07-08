import type { Prisma } from "@prisma/client";

import { db } from "~/server/db";
import { recordAnalyticsEvent } from "~/server/services/analytics";
import {
  postOrderSaleToLedger,
  refreshFinanceLedgerFromOrders,
} from "~/server/services/finance";
import { awardPointsForOrder } from "~/server/services/loyalty";
import {
  BUSINESS_EVENTS,
  createOutboxEvent,
  markOutboxEventStatus,
} from "~/server/services/outbox";
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
  // ADR 0002 — the atomic unit is {payment update, order → PAID, outbox row}.
  // The outbox row is the durable obligation to represent the money event; a
  // crash after this commit can no longer lose the accounting pipeline.
  const { updated, capturedEvent } = await db.$transaction(async (tx) => {
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

    const event = captured
      ? await createOutboxEvent(tx, {
          type: BUSINESS_EVENTS.paymentCaptured,
          aggregateType: "Order",
          aggregateId: payment.orderId,
          idempotencyKey: `${BUSINESS_EVENTS.paymentCaptured}:cardcom:${updatedPayment.id}`,
          payload: {
            orderId: payment.orderId,
            orderNumber: order.orderNumber,
            provider: "cardcom",
            providerPaymentId: updatedPayment.providerPaymentId,
          },
        })
      : null;

    return { updated: updatedPayment, capturedEvent: event };
  });

  if (captured && capturedEvent) {
    await runPaymentCapturedFastPath({
      amount: Number(updated.amount),
      currency: updated.currency,
      customerId: order.customerId ?? undefined,
      orderCreatedAt: order.createdAt,
      orderId: payment.orderId,
      orderNumber: order.orderNumber,
      outboxEventId: capturedEvent.id,
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

/**
 * The durable money-event work (ADR 0002): GL sale posting plus loyalty, both
 * idempotent per order. This is what the `payment.captured` outbox consumer
 * runs on every retry until it converges — a thrown error keeps the event
 * retryable instead of vanishing into a log line. Skip results (e.g. a
 * non-OWN_SALE treatment, ADR 0009) are legitimate terminal outcomes.
 */
export async function runPaymentCapturedConvergence(input: { orderId: string }) {
  // Post the balanced double-entry GL journal for the sale (FIN-GL-001).
  const sale = await postOrderSaleToLedger(input.orderId);

  // Award loyalty points for the purchase (idempotent per order; no-op for
  // guest orders or when no points are due). CRM-LOY. Runs after GL and
  // shares its retry loop: GL outranks loyalty, but both converge.
  const loyalty = await awardPointsForOrder(input.orderId);

  return { sale, loyalty };
}

/**
 * The inline accelerator (ADR 0002): analytics/read-model refresh plus one
 * immediate convergence attempt. Success marks the outbox row processed;
 * failure leaves the durable row pending for the per-minute worker. The
 * outbox is the guarantee — this path only buys latency.
 */
async function runPaymentCapturedFastPath(input: {
  amount: number;
  currency: string;
  customerId?: string;
  orderCreatedAt: Date;
  orderId: string;
  orderNumber: string;
  outboxEventId: string;
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
  } catch (error) {
    // Analytics/read-model refresh is not the accounting obligation; its
    // failure must not block convergence or the webhook response.
    console.error("[payment-webhooks:analytics-refresh-failed]", error);
  }

  try {
    await runPaymentCapturedConvergence({ orderId: input.orderId });
    await markOutboxEventStatus({
      id: input.outboxEventId,
      status: "PROCESSED",
    });
  } catch (error) {
    // Leave the outbox row PENDING — the per-minute worker retries it with
    // backoff and the invariant sweep alerts if it stays unconverged.
    console.error("[payment-webhooks:inline-convergence-deferred]", error);
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
