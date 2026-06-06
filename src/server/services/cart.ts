import { TRPCError } from "@trpc/server";
import type { Cart, CartItem, Prisma } from "@prisma/client";
import { z } from "zod";

import { db } from "~/server/db";
import { evaluateCouponCode, normalizeCouponCode } from "./coupons";
import { DEFAULT_CATALOG_IMAGE } from "~/server/services/catalog";
import {
  addFixtureCartItem,
  getFixtureCartBySession,
  mergeFixtureGuestCartToCustomer,
  removeFixtureCartItem,
  shouldUseFixtureCart,
  updateFixtureCartItemQuantity,
  updateFixtureCartOptions,
} from "~/server/services/cart-fixtures";
import { calculateOrderTotal } from "~/server/services/pricing";
import { getPublicCatalogSku } from "~/server/services/public-catalog-identifiers";

const CART_TTL_DAYS = 30;

export const cartSessionKeySchema = z.string().trim().min(16).max(128);

export const addCartItemInputSchema = z.object({
  sessionKey: cartSessionKeySchema,
  variantSku: z.string().trim().min(1),
  branchSlug: z.string().trim().min(1).optional(),
  quantity: z.number().int().positive().max(10).default(1),
});

export const updateCartItemInputSchema = z.object({
  sessionKey: cartSessionKeySchema,
  itemId: z.string().trim().min(1),
  quantity: z.number().int().positive().max(10),
});

export const removeCartItemInputSchema = z.object({
  sessionKey: cartSessionKeySchema,
  itemId: z.string().trim().min(1),
});

export const updateCartOptionsInputSchema = z.object({
  sessionKey: cartSessionKeySchema,
  giftWrap: z.boolean().optional(),
  giftMessage: z.string().trim().max(500).optional(),
  couponCode: z.string().trim().max(64).optional(),
  fulfillmentMethod: z.enum(["DELIVERY", "PICKUP"]).default("DELIVERY"),
});

type CartWithItems = Cart & {
  items: Array<
    CartItem & {
      variant: {
        externalVariantId: string | null;
        sku: string;
        name: string;
        product: {
          slug: string;
          name: string;
          source: "OWN" | "DROPSHIP_SHOPIFY";
          externalProvider: string | null;
          externalProductId: string | null;
          externalHandle: string | null;
          supplierKey: string | null;
          media: Array<{
            url: string;
          }>;
        };
      };
    }
  >;
};

export type CartSummary = Awaited<ReturnType<typeof mapCartSummary>>;
type CartGroupCoupon = Parameters<typeof calculateOrderTotal>[0]["coupon"];

export async function getCartBySession(sessionKey: string) {
  const parsed = cartSessionKeySchema.parse(sessionKey);

  if (shouldUseFixtureCart()) {
    return getFixtureCartBySession(parsed);
  }

  const cart = await findActiveCartBySession(parsed);

  return cart ? mapCartSummary(cart, "DELIVERY") : null;
}

export async function addCartItem(
  input: z.infer<typeof addCartItemInputSchema>,
) {
  const parsed = addCartItemInputSchema.parse(input);

  if (shouldUseFixtureCart()) {
    return addFixtureCartItem(parsed);
  }

  const cart = await db.$transaction(async (tx) => {
    const cart = await getOrCreateActiveCart(tx, parsed.sessionKey);
    const variant = await findCartVariantByPublicSku(tx, parsed.variantSku);

    if (variant?.product.status !== "ACTIVE") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "הבחירה הזו אינה פנויה כרגע.",
      });
    }

    const branch = parsed.branchSlug
      ? await tx.branch.findUnique({ where: { slug: parsed.branchSlug } })
      : null;
    const existingItem = await tx.cartItem.findFirst({
      where: {
        cartId: cart.id,
        variantId: variant.id,
        branchId: branch?.id ?? null,
      },
    });
    const unitPrice =
      Number(variant.prices[0]?.amount ?? variant.product.basePrice) +
      Number(variant.priceDelta);

    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "פרטי המחיר דורשים אישור לפני הוספה לסל.",
      });
    }

    if (existingItem) {
      await tx.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: { increment: parsed.quantity }, unitPrice },
      });
    } else {
      await tx.cartItem.create({
        data: {
          cartId: cart.id,
          variantId: variant.id,
          branchId: branch?.id,
          quantity: parsed.quantity,
          unitPrice,
        },
      });
    }

    return getCartById(tx, cart.id);
  });

  return mapCartSummary(cart, "DELIVERY");
}

async function findCartVariantByPublicSku(
  tx: Prisma.TransactionClient,
  variantSku: string,
) {
  const include = createCartVariantInclude();
  const direct = await tx.productVariant.findUnique({
    where: { sku: variantSku },
    include,
  });

  if (direct) return direct;

  const candidates = await tx.productVariant.findMany({
    where: {
      product: {
        status: "ACTIVE",
      },
    },
    include,
  });

  return (
    candidates.find((candidate) => getPublicCatalogSku(candidate.sku) === variantSku) ??
    null
  );
}

function createCartVariantInclude() {
  return {
    product: true,
    prices: {
      where: {
        currency: "ILS",
        OR: [{ validTo: null }, { validTo: { gt: new Date() } }],
      },
      orderBy: { validFrom: "desc" },
      take: 1,
    },
  } satisfies Prisma.ProductVariantInclude;
}

export async function updateCartItemQuantity(
  input: z.infer<typeof updateCartItemInputSchema>,
) {
  const parsed = updateCartItemInputSchema.parse(input);

  if (shouldUseFixtureCart()) {
    return updateFixtureCartItemQuantity(parsed);
  }

  const cart = await requireActiveCartBySession(parsed.sessionKey);
  const item = cart.items.find((item) => item.id === parsed.itemId);

  if (!item) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "התכשיט לא נמצא בבחירה.",
    });
  }

  await db.cartItem.update({
    where: { id: parsed.itemId },
    data: { quantity: parsed.quantity },
  });

  return getCartBySession(parsed.sessionKey);
}

export async function removeCartItem(
  input: z.infer<typeof removeCartItemInputSchema>,
) {
  const parsed = removeCartItemInputSchema.parse(input);

  if (shouldUseFixtureCart()) {
    return removeFixtureCartItem(parsed);
  }

  const cart = await requireActiveCartBySession(parsed.sessionKey);
  const item = cart.items.find((item) => item.id === parsed.itemId);

  if (!item) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "התכשיט לא נמצא בבחירה.",
    });
  }

  await db.cartItem.delete({ where: { id: parsed.itemId } });

  return getCartBySession(parsed.sessionKey);
}

export async function updateCartOptions(
  input: z.infer<typeof updateCartOptionsInputSchema>,
) {
  const parsed = updateCartOptionsInputSchema.parse(input);

  if (shouldUseFixtureCart()) {
    return updateFixtureCartOptions(parsed);
  }

  const cart = await requireActiveCartBySession(parsed.sessionKey);

  const updated = await db.cart.update({
    where: { id: cart.id },
    data: {
      giftWrap: parsed.giftWrap,
      giftMessage: parsed.giftMessage,
      couponCode: parsed.couponCode?.toUpperCase(),
    },
    include: cartInclude,
  });

  return mapCartSummary(updated, parsed.fulfillmentMethod);
}

export async function mergeGuestCartToCustomer(input: {
  sessionKey: string;
  customerId: string;
}) {
  const sessionKey = cartSessionKeySchema.parse(input.sessionKey);

  if (shouldUseFixtureCart()) {
    return mergeFixtureGuestCartToCustomer({ sessionKey });
  }

  const cart = await findActiveCartBySession(sessionKey);

  if (!cart) return null;

  const updated = await db.cart.update({
    where: { id: cart.id },
    data: {
      customerId: input.customerId,
      mergeMetadata: {
        mergedFromSessionKey: sessionKey,
        mergedAt: new Date().toISOString(),
      },
    },
    include: cartInclude,
  });

  return mapCartSummary(updated, "DELIVERY");
}

async function getOrCreateActiveCart(
  tx: Prisma.TransactionClient,
  sessionKey: string,
) {
  const existing = await tx.cart.findFirst({
    where: {
      sessionKey,
      status: "ACTIVE",
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  });

  if (existing) return existing;

  return tx.cart.create({
    data: {
      sessionKey,
      status: "ACTIVE",
      expiresAt: getCartExpiresAt(),
    },
  });
}

async function requireActiveCartBySession(sessionKey: string) {
  const cart = await findActiveCartBySession(
    cartSessionKeySchema.parse(sessionKey),
  );

  if (!cart) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "לא נמצאה בחירה פעילה.",
    });
  }

  return cart;
}

async function findActiveCartBySession(sessionKey: string) {
  return db.cart.findFirst({
    where: {
      sessionKey,
      status: "ACTIVE",
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    include: cartInclude,
  });
}

function getCartById(tx: Prisma.TransactionClient, id: string) {
  return tx.cart.findUniqueOrThrow({
    where: { id },
    include: cartInclude,
  });
}

async function mapCartSummary(cart: CartWithItems, fulfillmentMethod: string) {
  const items = cart.items.map((item) => ({
    id: item.id,
    productSlug: item.variant.product.slug,
    productName: item.variant.product.name,
    productImage: item.variant.product.media[0]?.url ?? DEFAULT_CATALOG_IMAGE,
    source: item.variant.product.source,
    externalProvider: item.variant.product.externalProvider ?? undefined,
    externalProductId: item.variant.product.externalProductId ?? undefined,
    externalHandle: item.variant.product.externalHandle ?? undefined,
    supplierKey: item.variant.product.supplierKey ?? undefined,
    variantSku: item.variant.sku,
    externalVariantId: item.variant.externalVariantId ?? undefined,
    variantName: item.variant.name,
    quantity: item.quantity,
    unitPrice: Number(item.unitPrice),
    lineTotal: Number(item.unitPrice) * item.quantity,
  }));
  const couponEvaluation = await evaluateCouponCode(cart.couponCode);
  const coupon =
    couponEvaluation.status === "success" ? couponEvaluation : undefined;
  const totals = calculateOrderTotal({
    items,
    shipping: fulfillmentMethod === "DELIVERY" ? 29 : 0,
    coupon: coupon?.value,
  });

  return {
    id: cart.id,
    sessionKey: cart.sessionKey,
    status: cart.status,
    currency: cart.currency,
    giftWrap: cart.giftWrap,
    giftMessage: cart.giftMessage,
    couponCode: normalizeCouponCode(cart.couponCode),
    couponMessage: couponEvaluation.message,
    couponStatus:
      couponEvaluation.status === "none" ? undefined : couponEvaluation.status,
    couponValid: cart.couponCode
      ? couponEvaluation.status === "success"
      : undefined,
    expiresAt: cart.expiresAt,
    items,
    groups: groupCartItemsBySource(items, {
      coupon: coupon?.value,
      fulfillmentMethod,
    }),
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    totals,
  };
}

function groupCartItemsBySource(
  items: Array<{
    lineTotal: number;
    quantity: number;
    source: "OWN" | "DROPSHIP_SHOPIFY";
    unitPrice: number;
  }>,
  options: {
    coupon?: CartGroupCoupon;
    fulfillmentMethod: string;
  },
) {
  const own = items.filter((item) => item.source === "OWN");
  const dropshipShopify = items.filter(
    (item) => item.source === "DROPSHIP_SHOPIFY",
  );

  return {
    own: summarizeCartGroup(own, {
      coupon: options.coupon,
      shipping: options.fulfillmentMethod === "DELIVERY" ? 29 : 0,
    }),
    dropshipShopify: summarizeCartGroup(dropshipShopify),
  };
}

function summarizeCartGroup(
  items: Array<{
    lineTotal: number;
    quantity: number;
    source: "OWN" | "DROPSHIP_SHOPIFY";
    unitPrice: number;
  }>,
  options: {
    coupon?: CartGroupCoupon;
    shipping?: number;
  } = {},
) {
  const totals = calculateOrderTotal({
    coupon: options.coupon,
    items,
    shipping: items.length > 0 ? (options.shipping ?? 0) : 0,
  });

  return {
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    lineCount: items.length,
    subtotal: totals.subtotal,
    discount: totals.discount,
    shipping: totals.shipping,
    total: totals.total,
  };
}

function getCartExpiresAt(now = new Date()) {
  return new Date(now.getTime() + CART_TTL_DAYS * 24 * 60 * 60_000);
}

const cartInclude = {
  items: {
    orderBy: { id: "asc" },
    include: {
      variant: {
        select: {
          sku: true,
          externalVariantId: true,
          name: true,
          product: {
            select: {
              slug: true,
              name: true,
              source: true,
              externalProvider: true,
              externalProductId: true,
              externalHandle: true,
              supplierKey: true,
              media: {
                where: { kind: "IMAGE" },
                orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
                select: { url: true },
                take: 1,
              },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.CartInclude;
