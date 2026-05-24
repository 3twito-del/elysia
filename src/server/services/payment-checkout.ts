import { TRPCError } from "@trpc/server";

import { paymentProvider } from "~/server/adapters/payment";
import { db } from "~/server/db";
import { BUSINESS_EVENTS, enqueueOutboxEvent } from "~/server/services/outbox";

export type CreatePaymentCheckoutInput = {
  orderId: string;
  orderNumber: string;
  amount: number;
  customerEmail: string;
  returnUrl: string;
};

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
      message: "Order not found.",
    });
  }

  if (order.status !== "PENDING_PAYMENT") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Order is not waiting for payment.",
    });
  }

  if (order.payments.some((payment) => payment.status === "CAPTURED")) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Order is already paid.",
    });
  }

  const orderTotal = Number(order.total);

  if (!amountsMatch(orderTotal, input.checkout.amount)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Payment amount does not match the order total.",
    });
  }

  const returnUrl = assertTrustedReturnUrl(
    input.checkout.returnUrl,
    input.headers,
  );
  const session = await paymentProvider.createCheckout({
    ...input.checkout,
    amount: orderTotal,
    currency: "ILS",
    returnUrl,
  });

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

function amountsMatch(expected: number, actual: number) {
  return Math.round(expected * 100) === Math.round(actual * 100);
}

function assertTrustedReturnUrl(returnUrl: string, headers: Headers) {
  const parsedReturnUrl = new URL(returnUrl);
  const requestOrigin = getRequestOrigin(headers);

  if (!requestOrigin || parsedReturnUrl.origin !== requestOrigin) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Payment return URL is not allowed.",
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
