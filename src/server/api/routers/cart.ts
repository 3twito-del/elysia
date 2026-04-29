import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import {
  addCartItem,
  addCartItemInputSchema,
  getCartBySession,
  removeCartItem,
  removeCartItemInputSchema,
  updateCartItemInputSchema,
  updateCartItemQuantity,
  updateCartOptions,
  updateCartOptionsInputSchema,
} from "~/server/services/cart";
import {
  getCatalogProductBySlug,
  getFeaturedCatalogProducts,
} from "~/server/services/catalog";
import { getActiveCouponValue } from "~/server/services/coupons";
import { calculateOrderTotal } from "~/server/services/pricing";

export const cartRouter = createTRPCRouter({
  get: publicProcedure
    .input(z.object({ sessionKey: z.string().min(16) }))
    .query(({ input }) => getCartBySession(input.sessionKey)),

  addItem: publicProcedure
    .input(addCartItemInputSchema)
    .mutation(({ input }) => addCartItem(input)),

  updateItem: publicProcedure
    .input(updateCartItemInputSchema)
    .mutation(({ input }) => updateCartItemQuantity(input)),

  removeItem: publicProcedure
    .input(removeCartItemInputSchema)
    .mutation(({ input }) => removeCartItem(input)),

  updateOptions: publicProcedure
    .input(updateCartOptionsInputSchema)
    .mutation(({ input }) => updateCartOptions(input)),

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
    .query(async ({ input }) => {
      const fallbackProducts = await getFeaturedCatalogProducts(1);
      const [items, coupon] = await Promise.all([
        Promise.all(
          input.items.map(async (item) => {
            const product =
              (await getCatalogProductBySlug(item.productSlug)) ??
              fallbackProducts[0];

            if (!product) {
              throw new Error(
                "No active product is available for cart estimate.",
              );
            }

            return {
              name: product.name,
              unitPrice: product.price,
              quantity: item.quantity,
            };
          }),
        ),
        getActiveCouponValue(input.couponCode),
      ]);

      return {
        items,
        ...calculateOrderTotal({
          items,
          shipping: input.fulfillmentMethod === "DELIVERY" ? 29 : 0,
          coupon: coupon?.value,
        }),
        couponValid: input.couponCode ? Boolean(coupon) : undefined,
      };
    }),
});
