import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { shopifyDropshipProvider } from "~/server/adapters/shopify";
import { db } from "~/server/db";
import { recordAnalyticsEvent } from "~/server/services/analytics";
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
      message: "לא נמצא סל פעיל לסיום הזמנה נפרדת.",
    });
  }

  const dropshipItems = cart.items.filter(
    (item) => item.variant.product.source === "DROPSHIP_SHOPIFY",
  );

  if (dropshipItems.length === 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "אין פריטים שדורשים קופה נפרדת.",
    });
  }

  const missingVariantMapping = dropshipItems.find(
    (item) => !item.variant.externalVariantId?.trim(),
  );

  if (missingVariantMapping) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "חסר מזהה פריט לקופה הנפרדת.",
    });
  }

  const checkout = await shopifyDropshipProvider.createCart({
    lines: dropshipItems.map((item) => ({
      merchandiseId: item.variant.externalVariantId ?? "",
      quantity: item.quantity,
    })),
  });
  const itemCount = dropshipItems.reduce((sum, item) => sum + item.quantity, 0);

  await recordShopifyCheckoutAnalyticsSafely({
    type: "shopify_checkout_started",
    sessionKey: parsed.sessionKey,
    consentMode: "business",
    payload: {
      externalCartId: checkout.cartId,
      itemCount,
      lineCount: dropshipItems.length,
    },
    idempotencyKey: `shopify_checkout_started:${checkout.cartId}`,
  });

  return {
    checkoutUrl: checkout.checkoutUrl,
    externalCartId: checkout.cartId,
    itemCount,
    lineCount: dropshipItems.length,
  };
}

async function recordShopifyCheckoutAnalyticsSafely(
  input: Parameters<typeof recordAnalyticsEvent>[0],
) {
  try {
    await recordAnalyticsEvent(input);
  } catch (error) {
    console.error("[shopify-dropship-checkout:analytics-failed]", error);
  }
}
