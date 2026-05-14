import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { paymentProvider } from "~/server/adapters/payment";
import { db } from "~/server/db";
import {
  cartCheckoutInputSchema,
  createCartCheckoutOrder,
} from "~/server/services/cart-checkout";
import { BUSINESS_EVENTS, enqueueOutboxEvent } from "~/server/services/outbox";
import {
  consumeRateLimit,
  createRateLimitKey,
} from "~/server/services/rate-limit";
import {
  createManualOrder,
  createManualOrderInputSchema,
} from "~/server/services/manual-order";

const createPaymentInputSchema = z.object({
  orderId: z.string().trim().min(1).max(128),
  orderNumber: z.string().trim().min(3).max(64),
  amount: z.number().positive().max(1_000_000),
  customerEmail: z.string().email().toLowerCase(),
  returnUrl: z.string().url().max(2_048),
});

export const checkoutRouter = createTRPCRouter({
  createManualOrder: publicProcedure
    .input(createManualOrderInputSchema)
    .mutation(async ({ input }) => {
      const rateLimit = await consumeRateLimit({
        key: createRateLimitKey("checkout", input.customer.email),
        limit: 5,
        windowMs: 15 * 60_000,
      });

      if (!rateLimit.allowed) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "יותר מדי ניסיונות קופה. נסו שוב בעוד כמה דקות.",
        });
      }

      return createManualOrder(input);
    }),

  createCartOrder: publicProcedure
    .input(cartCheckoutInputSchema)
    .mutation(async ({ input }) => {
      const rateLimit = await consumeRateLimit({
        key: createRateLimitKey("cart-checkout", input.customer.email),
        limit: 5,
        windowMs: 15 * 60_000,
      });

      if (!rateLimit.allowed) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "יותר מדי ניסיונות קופה. נסו שוב בעוד כמה דקות.",
        });
      }

      return createCartCheckoutOrder(input);
    }),

  createPayment: publicProcedure
    .input(createPaymentInputSchema)
    .mutation(async ({ ctx, input }) => {
      const rateLimit = await consumeRateLimit({
        key: createRateLimitKey("payment", input.customerEmail),
        limit: 8,
        windowMs: 15 * 60_000,
      });

      if (!rateLimit.allowed) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "יותר מדי ניסיונות תשלום. נסו שוב בעוד כמה דקות.",
        });
      }

      const order = await db.order.findUnique({
        where: { id: input.orderId },
        include: { payments: true },
      });

      if (
        order?.orderNumber !== input.orderNumber ||
        order.email.toLowerCase() !== input.customerEmail
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

      if (!amountsMatch(orderTotal, input.amount)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Payment amount does not match the order total.",
        });
      }

      const returnUrl = assertTrustedReturnUrl(input.returnUrl, ctx.headers);
      const session = await paymentProvider.createCheckout({
        ...input,
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
    }),
});

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
