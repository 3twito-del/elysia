import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { shopifyDropshipProvider } from "~/server/adapters/shopify";
import { db } from "~/server/db";
import { cartSessionKeySchema } from "~/server/services/cart";

export const shopifyDropshipCheckoutInputSchema = z.object({
  sessionKey: cartSessionKeySchema,
});

export async function createShopifyDropshipCheckout(
  input: z.infer<typeof shopifyDropshipCheckoutInputSchema>,
) {
  const parsed = shopifyDropshipCheckoutInputSchema.parse(input);
  const cart = await db.cart.findFirst({
    where: {
      sessionKey: parsed.sessionKey,
      status: "ACTIVE",
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    include: {
      items: {
        orderBy: { id: "asc" },
        include: {
          variant: {
            include: {
              product: true,
            },
          },
        },
      },
    },
  });

  if (!cart) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "לא נמצאה בחירה פעילה לסיום הזמנת הספק.",
    });
  }

  const dropshipItems = cart.items.filter(
    (item) => item.variant.product.source === "DROPSHIP_SHOPIFY",
  );

  if (dropshipItems.length === 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "אין פריטי ספק שדורשים קופה נפרדת.",
    });
  }

  const missingVariantMapping = dropshipItems.find(
    (item) => !item.variant.externalVariantId?.trim(),
  );

  if (missingVariantMapping) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "פריט ספק חסר מזהה Shopify Variant.",
    });
  }

  const checkout = await shopifyDropshipProvider.createCart({
    lines: dropshipItems.map((item) => ({
      merchandiseId: item.variant.externalVariantId ?? "",
      quantity: item.quantity,
    })),
  });

  return {
    checkoutUrl: checkout.checkoutUrl,
    externalCartId: checkout.cartId,
    itemCount: dropshipItems.reduce((sum, item) => sum + item.quantity, 0),
    lineCount: dropshipItems.length,
  };
}
