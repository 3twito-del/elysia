import { TRPCError } from "@trpc/server";

import {
  paymentProvider,
  type CheckoutSession,
} from "~/server/adapters/payment";
import { db } from "~/server/db";
import { BUSINESS_EVENTS, enqueueOutboxEvent } from "~/server/services/outbox";

export type CreatePaymentCheckoutInput = {
  orderId: string;
  orderNumber: string;
  amount: number;
  customerEmail: string;
  returnUrl: string;
};

export type PaymentCheckoutFailureKind =
  | "provider_unavailable"
  | "payment_rejected"
  | "callback_mismatch"
  | "webhook_delay"
  | "payment_already_recorded";

const paymentCheckoutFailureMessages = {
  provider_unavailable:
    "Payment cannot be opened right now. Please keep the order page open and contact service if this continues.",
  payment_rejected:
    "The payment was not approved. No payment was recorded, so please try again or use service support.",
  callback_mismatch:
    "The payment link could not be verified for this order. Please return to checkout and create a fresh payment link.",
  webhook_delay:
    "The order is still waiting for payment confirmation. Please refresh in a moment before trying again.",
  payment_already_recorded:
    "Payment is already recorded for this order. Please refresh the order page before creating another payment link.",
} as const satisfies Record<PaymentCheckoutFailureKind, string>;

export function getPaymentCheckoutFailureMessage(
  kind: PaymentCheckoutFailureKind,
) {
  return paymentCheckoutFailureMessages[kind];
}

export function getExistingPaymentCheckoutSessionFromPayments(
  payments: Array<{
    idempotencyKey: string | null;
    provider: string;
    providerPaymentId: string | null;
    providerStatus: string | null;
    rawPayload: unknown;
    status: string;
  }>,
): CheckoutSession | null {
  for (const payment of payments) {
    if (
      payment.provider !== "cardcom" ||
      payment.status !== "PENDING" ||
      payment.providerStatus !== "checkout_created" ||
      !payment.providerPaymentId ||
      !payment.idempotencyKey
    ) {
      continue;
    }

    const rawPayload = payment.rawPayload;

    if (!isRecord(rawPayload) || typeof rawPayload.redirectUrl !== "string") {
      continue;
    }

    return {
      provider: "cardcom",
      providerPaymentId: payment.providerPaymentId,
      redirectUrl: rawPayload.redirectUrl,
      idempotencyKey: payment.idempotencyKey,
    };
  }

  return null;
}

export async function createPaymentCheckoutSession(input: {
  checkout: CreatePaymentCheckoutInput;
  headers: Headers;
}) {
  const order = await db.order.findUnique({
    where: { id: input.checkout.orderId },
    include: { payments: true },
  });

  if (
    order?.orderNumber !== input.checkout.orderNumber ||
    order.email.toLowerCase() !== input.checkout.customerEmail
  ) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: getPaymentCheckoutFailureMessage("callback_mismatch"),
    });
  }

  if (order.status !== "PENDING_PAYMENT") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: getPaymentCheckoutFailureMessage("webhook_delay"),
    });
  }

  if (order.payments.some((payment) => payment.status === "CAPTURED")) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: getPaymentCheckoutFailureMessage("payment_already_recorded"),
    });
  }

  const orderTotal = Number(order.total);

  if (!amountsMatch(orderTotal, input.checkout.amount)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: getPaymentCheckoutFailureMessage("callback_mismatch"),
    });
  }

  const returnUrl = assertTrustedReturnUrl(
    input.checkout.returnUrl,
    input.headers,
  );
  const existingSession = getExistingPaymentCheckoutSessionFromPayments(
    order.payments,
  );

  if (existingSession) {
    return existingSession;
  }

  let session: CheckoutSession;

  try {
    session = await paymentProvider.createCheckout({
      ...input.checkout,
      amount: orderTotal,
      currency: "ILS",
      returnUrl,
    });
  } catch {
    throw new TRPCError({
      code: "SERVICE_UNAVAILABLE",
      message: getPaymentCheckoutFailureMessage("provider_unavailable"),
    });
  }

  await db.payment.upsert({
    where: { idempotencyKey: session.idempotencyKey },
    update: {
      providerPaymentId: session.providerPaymentId,
      providerStatus: "checkout_created",
      rawPayload: {
        redirectUrl: session.redirectUrl,
        orderNumber: order.orderNumber,
      },
    },
    create: {
      orderId: order.id,
      provider: session.provider,
      providerPaymentId: session.providerPaymentId,
      providerStatus: "checkout_created",
      status: "PENDING",
      amount: orderTotal,
      currency: "ILS",
      idempotencyKey: session.idempotencyKey,
      rawPayload: {
        redirectUrl: session.redirectUrl,
        orderNumber: order.orderNumber,
      },
    },
  });

  await enqueueOutboxEvent({
    type: "payment.checkout_created",
    aggregateType: "Order",
    aggregateId: order.id,
    idempotencyKey: `payment.checkout_created:${order.id}:${session.providerPaymentId}`,
    payload: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      provider: session.provider,
      providerPaymentId: session.providerPaymentId,
    },
  });

  await enqueueOutboxEvent({
    type: BUSINESS_EVENTS.emailRequested,
    aggregateType: "Order",
    aggregateId: order.id,
    idempotencyKey: `${BUSINESS_EVENTS.emailRequested}:payment-link:${order.id}`,
    payload: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerEmail: order.email,
      template: "payment_link_created",
    },
  });

  return session;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function amountsMatch(expected: number, actual: number) {
  return Math.round(expected * 100) === Math.round(actual * 100);
}

function assertTrustedReturnUrl(returnUrl: string, headers: Headers) {
  const parsedReturnUrl = new URL(returnUrl);
  const requestOrigin = getRequestOrigin(headers);

  if (!requestOrigin || parsedReturnUrl.origin !== requestOrigin) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: getPaymentCheckoutFailureMessage("callback_mismatch"),
    });
  }

  return parsedReturnUrl.toString();
}

function getRequestOrigin(headers: Headers) {
  const origin = headers.get("origin");

  if (origin) {
    try {
      return new URL(origin).origin;
    } catch {
      return null;
    }
  }

  const host = headers.get("x-forwarded-host") ?? headers.get("host");

  if (!host) return null;

  const proto = headers.get("x-forwarded-proto") ?? "https";

  try {
    return new URL(`${proto.split(",")[0]}://${host.split(",")[0]}`).origin;
  } catch {
    return null;
  }
}
