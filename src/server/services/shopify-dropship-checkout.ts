import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  type ShopifyLiveVariant,
  shopifyDropshipProvider,
} from "~/server/adapters/shopify";
import { db } from "~/server/db";
import { recordAnalyticsEvent } from "~/server/services/analytics";
import { cartSessionKeySchema } from "~/server/services/cart";

export const shopifyDropshipCheckoutInputSchema = z.object({
  sessionKey: cartSessionKeySchema,
});

export const CLICK_OUT_VERIFY_FAILED_MESSAGE =
  "לא הצלחנו לאמת את זמינות הפריטים והמחיר מול הספק. המעבר לתשלום נחסם — נסו שוב בעוד מספר דקות.";

export const CLICK_OUT_UNAVAILABLE_MESSAGE =
  "חלק מהפריטים בסל אינם זמינים כעת אצל הספק. הסירו אותם מהסל או נסו שוב מאוחר יותר.";

export const CLICK_OUT_CURRENCY_MESSAGE =
  "פריט בסל מתומחר אצל הספק במטבע שאינו נתמך, ולכן המעבר לתשלום נחסם.";

export const CLICK_OUT_PRICE_DRIFT_MESSAGE =
  "המחיר עודכן על ידי הספק. הסל עודכן למחיר הנוכחי — בדקו ואשרו שוב לפני המעבר לתשלום.";

const PRICE_TOLERANCE = 0.005;

export type ClickOutItem = {
  cartItemId: string;
  variantId: string;
  externalVariantId: string;
  unitPrice: number;
};

export type ClickOutVerification =
  | { status: "ok" }
  | {
      status: "blocked";
      reasons: {
        externalVariantId: string;
        reason: "missing" | "unavailable" | "currency";
        currencyCode?: string;
      }[];
    }
  | {
      status: "price_drift";
      drifts: {
        cartItemId: string;
        variantId: string;
        externalVariantId: string;
        displayedPrice: number;
        livePrice: number;
      }[];
    };

/**
 * ADR 0012 click-out verification (pure): the moment before the supplier
 * redirect is Elysia-owned and must not lie. Blocking conditions win over
 * price drift; failure to verify is handled by the caller and never grants
 * permission to proceed.
 */
export function evaluateClickOutVerification(input: {
  items: ClickOutItem[];
  liveVariants: ShopifyLiveVariant[];
}): ClickOutVerification {
  const liveById = new Map(
    input.liveVariants.map((variant) => [variant.id, variant]),
  );
  const blockedReasons: Extract<
    ClickOutVerification,
    { status: "blocked" }
  >["reasons"] = [];
  const drifts: Extract<
    ClickOutVerification,
    { status: "price_drift" }
  >["drifts"] = [];

  for (const item of input.items) {
    const live = liveById.get(item.externalVariantId);

    if (!live) {
      blockedReasons.push({
        externalVariantId: item.externalVariantId,
        reason: "missing",
      });
      continue;
    }

    if (!live.availableForSale) {
      blockedReasons.push({
        externalVariantId: item.externalVariantId,
        reason: "unavailable",
      });
      continue;
    }

    if (live.currencyCode !== "ILS") {
      blockedReasons.push({
        currencyCode: live.currencyCode,
        externalVariantId: item.externalVariantId,
        reason: "currency",
      });
      continue;
    }

    if (
      !Number.isFinite(live.priceAmount) ||
      Math.abs(live.priceAmount - item.unitPrice) > PRICE_TOLERANCE
    ) {
      drifts.push({
        cartItemId: item.cartItemId,
        displayedPrice: item.unitPrice,
        externalVariantId: item.externalVariantId,
        livePrice: live.priceAmount,
        variantId: item.variantId,
      });
    }
  }

  if (blockedReasons.length > 0) {
    return { reasons: blockedReasons, status: "blocked" };
  }

  if (drifts.length > 0) {
    return { drifts, status: "price_drift" };
  }

  return { status: "ok" };
}

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

  await verifyClickOutOrThrow({
    items: dropshipItems.map((item) => ({
      cartItemId: item.id,
      externalVariantId: item.variant.externalVariantId ?? "",
      unitPrice: Number(item.unitPrice),
      variantId: item.variantId,
    })),
    sessionKey: parsed.sessionKey,
  });

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

/**
 * Fail-closed guarantee (ADR 0012): a redirect happens only after live
 * verification passes. Verification failure blocks; unavailability or a
 * non-ILS price blocks; a price drift updates the display truth (cart line +
 * current price row), records a drift event, and asks the customer to
 * re-confirm at the updated price.
 */
async function verifyClickOutOrThrow(input: {
  items: ClickOutItem[];
  sessionKey: string;
}) {
  let liveVariants: ShopifyLiveVariant[] | null;

  try {
    liveVariants = await shopifyDropshipProvider.getVariantNodes({
      ids: input.items.map((item) => item.externalVariantId),
    });
  } catch (error) {
    console.error("[shopify-dropship-checkout:click-out-verify-failed]", error);
    await recordShopifyCheckoutAnalyticsSafely({
      type: "dropship_clickout_blocked",
      sessionKey: input.sessionKey,
      consentMode: "business",
      payload: { reason: "verify_failed" },
      idempotencyKey: `dropship_clickout_blocked:${input.sessionKey}:${Date.now()}`,
    });
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: CLICK_OUT_VERIFY_FAILED_MESSAGE,
    });
  }

  if (liveVariants === null) {
    // Non-production without Shopify credentials: the provider also returns a
    // mock checkout URL, so there is no real redirect to protect.
    return;
  }

  const verification = evaluateClickOutVerification({
    items: input.items,
    liveVariants,
  });

  if (verification.status === "blocked") {
    const hasCurrencyBlock = verification.reasons.some(
      (reason) => reason.reason === "currency",
    );

    await recordShopifyCheckoutAnalyticsSafely({
      type: "dropship_clickout_blocked",
      sessionKey: input.sessionKey,
      consentMode: "business",
      payload: { reasons: verification.reasons },
      idempotencyKey: `dropship_clickout_blocked:${input.sessionKey}:${Date.now()}`,
    });

    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: hasCurrencyBlock
        ? CLICK_OUT_CURRENCY_MESSAGE
        : CLICK_OUT_UNAVAILABLE_MESSAGE,
    });
  }

  if (verification.status === "price_drift") {
    await applyPriceDrift(verification.drifts);
    await recordShopifyCheckoutAnalyticsSafely({
      type: "dropship_price_drift",
      sessionKey: input.sessionKey,
      consentMode: "business",
      payload: {
        drifts: verification.drifts.map((drift) => ({
          displayedPrice: drift.displayedPrice,
          externalVariantId: drift.externalVariantId,
          livePrice: drift.livePrice,
        })),
      },
      idempotencyKey: `dropship_price_drift:${input.sessionKey}:${Date.now()}`,
    });

    throw new TRPCError({
      code: "CONFLICT",
      message: CLICK_OUT_PRICE_DRIFT_MESSAGE,
    });
  }

  await db.productVariant.updateMany({
    where: { id: { in: input.items.map((item) => item.variantId) } },
    data: { lastLiveVerifiedAt: new Date() },
  });
}

/** Update the display truth so the customer re-confirms the supplier price. */
async function applyPriceDrift(
  drifts: Extract<ClickOutVerification, { status: "price_drift" }>["drifts"],
) {
  for (const drift of drifts) {
    await db.cartItem.update({
      where: { id: drift.cartItemId },
      data: { unitPrice: drift.livePrice },
    });

    const currentPrice = await db.price.findFirst({
      where: { variantId: drift.variantId, currency: "ILS" },
      orderBy: { validFrom: "desc" },
    });

    if (currentPrice && Number(currentPrice.amount) !== drift.livePrice) {
      await db.price.update({
        where: { id: currentPrice.id },
        data: { amount: drift.livePrice },
      });
    }

    await db.productVariant.update({
      where: { id: drift.variantId },
      data: { lastLiveVerifiedAt: new Date() },
    });
  }
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
