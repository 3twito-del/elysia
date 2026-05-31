import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import {
  cartCheckoutInputSchema,
  createCartCheckoutOrder,
} from "~/server/services/cart-checkout";
import {
  consumeRateLimit,
  createRateLimitKey,
} from "~/server/services/rate-limit";
import {
  createManualOrder,
  createManualOrderInputSchema,
} from "~/server/services/manual-order";
import { createPaymentCheckoutSession } from "~/server/services/payment-checkout";
import {
  createShopifyDropshipCheckout,
  shopifyDropshipCheckoutInputSchema,
} from "~/server/services/shopify-dropship-checkout";

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
          message: "יותר מדי ניסיונות לסיום הזמנה. נסו שוב בעוד כמה דקות.",
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
          message: "יותר מדי ניסיונות לסיום הזמנה. נסו שוב בעוד כמה דקות.",
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

      return createPaymentCheckoutSession({
        checkout: input,
        headers: ctx.headers,
      });
    }),

  createShopifyDropshipCheckout: publicProcedure
    .input(shopifyDropshipCheckoutInputSchema)
    .mutation(async ({ input }) => {
      const rateLimit = await consumeRateLimit({
        key: createRateLimitKey("shopify-dropship-checkout", input.sessionKey),
        limit: 8,
        windowMs: 15 * 60_000,
      });

      if (!rateLimit.allowed) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "יותר מדי ניסיונות לקופת ספק. נסו שוב בעוד כמה דקות.",
        });
      }

      return createShopifyDropshipCheckout(input);
    }),
});
