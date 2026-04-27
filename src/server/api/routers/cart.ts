import { z } from "zod";

import { getProductBySlug, products } from "~/lib/catalog";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { calculateOrderTotal } from "~/server/services/pricing";

export const cartRouter = createTRPCRouter({
  estimate: publicProcedure
    .input(
      z.object({
        items: z.array(
          z.object({
            productSlug: z.string(),
            quantity: z.number().int().positive(),
          }),
        ),
        giftWrap: z.boolean().default(false),
        couponCode: z.string().optional(),
        fulfillmentMethod: z.enum(["DELIVERY", "PICKUP"]).default("DELIVERY"),
      }),
    )
    .query(({ input }) => {
      const items = input.items.map((item) => {
        const product = getProductBySlug(item.productSlug) ?? products[0]!;

        return {
          name: product.name,
          unitPrice: product.price,
          quantity: item.quantity,
        };
      });

      return {
        items,
        ...calculateOrderTotal({
          items,
          shipping: input.fulfillmentMethod === "DELIVERY" ? 29 : 0,
          coupon:
            input.couponCode === "APHRODITE10" ? { percentOff: 10 } : undefined,
        }),
      };
    }),
});
