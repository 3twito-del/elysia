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
import { consumeRateLimit } from "~/server/services/rate-limit";
import {
  createManualOrder,
  createManualOrderInputSchema,
} from "~/server/services/manual-order";

export const checkoutRouter = createTRPCRouter({
  createManualOrder: publicProcedure
    .input(createManualOrderInputSchema)
    .mutation(async ({ input }) => {
      const rateLimit = await consumeRateLimit({
        key: `checkout:${input.customer.email}`,
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
        key: `cart-checkout:${input.customer.email}`,
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
    .input(
      z.object({
        orderId: z.string(),
        orderNumber: z.string(),
        amount: z.number().positive(),
        customerEmail: z.string().email(),
        returnUrl: z.string().url(),
      }),
    )
    .mutation(async ({ input }) => {
      const rateLimit = await consumeRateLimit({
        key: `payment:${input.customerEmail}`,
        limit: 8,
        windowMs: 15 * 60_000,
      });

      if (!rateLimit.allowed) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "יותר מדי ניסיונות תשלום. נסו שוב בעוד כמה דקות.",
        });
      }

      const session = await paymentProvider.createCheckout({
        ...input,
        currency: "ILS",
      });

      await db.payment.upsert({
        where: { idempotencyKey: session.idempotencyKey },
        update: {
          providerPaymentId: session.providerPaymentId,
          providerStatus: "checkout_created",
          rawPayload: {
            redirectUrl: session.redirectUrl,
            orderNumber: input.orderNumber,
          },
        },
        create: {
          orderId: input.orderId,
          provider: session.provider,
          providerPaymentId: session.providerPaymentId,
          providerStatus: "checkout_created",
          status: "PENDING",
          amount: input.amount,
          currency: "ILS",
          idempotencyKey: session.idempotencyKey,
          rawPayload: {
            redirectUrl: session.redirectUrl,
            orderNumber: input.orderNumber,
          },
        },
      });

      await enqueueOutboxEvent({
        type: "payment.checkout_created",
        aggregateType: "Order",
        aggregateId: input.orderId,
        idempotencyKey: `payment.checkout_created:${input.orderId}:${session.providerPaymentId}`,
        payload: {
          orderId: input.orderId,
          orderNumber: input.orderNumber,
          provider: session.provider,
          providerPaymentId: session.providerPaymentId,
        },
      });

      await enqueueOutboxEvent({
        type: BUSINESS_EVENTS.emailRequested,
        aggregateType: "Order",
        aggregateId: input.orderId,
        idempotencyKey: `${BUSINESS_EVENTS.emailRequested}:payment-link:${input.orderId}`,
        payload: {
          orderId: input.orderId,
          orderNumber: input.orderNumber,
          customerEmail: input.customerEmail,
          template: "payment_link_created",
        },
      });

      return session;
    }),
});
