import { TRPCError } from "@trpc/server";
import type { Cart, CartItem, Prisma } from "@prisma/client";
import { z } from "zod";

import { db } from "~/server/db";
import { getActiveCouponValue, normalizeCouponCode } from "./coupons";
import { calculateOrderTotal } from "~/server/services/pricing";

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
        sku: string;
        name: string;
        product: {
          slug: string;
          name: string;
        };
      };
    }
  >;
};

export type CartSummary = Awaited<ReturnType<typeof mapCartSummary>>;

export async function getCartBySession(sessionKey: string) {
  const parsed = cartSessionKeySchema.parse(sessionKey);
  const cart = await findActiveCartBySession(parsed);

  return cart ? mapCartSummary(cart, "DELIVERY") : null;
}

export async function addCartItem(
  input: z.infer<typeof addCartItemInputSchema>,
) {
  const parsed = addCartItemInputSchema.parse(input);

  const cart = await db.$transaction(async (tx) => {
    const cart = await getOrCreateActiveCart(tx, parsed.sessionKey);
    const variant = await tx.productVariant.findUnique({
      where: { sku: parsed.variantSku },
      include: {
        product: true,
        prices: {
          where: {
            currency: "ILS",
            OR: [{ validTo: null }, { validTo: { gt: new Date() } }],
          },
          orderBy: { validFrom: "desc" },
          take: 1,
        },
      },
    });

    if (variant?.product.status !== "ACTIVE") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "המוצר אינו זמין להוספה לסל.",
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

export async function updateCartItemQuantity(
  input: z.infer<typeof updateCartItemInputSchema>,
) {
  const parsed = updateCartItemInputSchema.parse(input);

  const cart = await requireActiveCartBySession(parsed.sessionKey);
  const item = cart.items.find((item) => item.id === parsed.itemId);

  if (!item) {
    throw new TRPCError({ code: "NOT_FOUND", message: "הפריט לא נמצא בסל." });
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
  const cart = await requireActiveCartBySession(parsed.sessionKey);
  const item = cart.items.find((item) => item.id === parsed.itemId);

  if (!item) {
    throw new TRPCError({ code: "NOT_FOUND", message: "הפריט לא נמצא בסל." });
  }

  await db.cartItem.delete({ where: { id: parsed.itemId } });

  return getCartBySession(parsed.sessionKey);
}

export async function updateCartOptions(
  input: z.infer<typeof updateCartOptionsInputSchema>,
) {
  const parsed = updateCartOptionsInputSchema.parse(input);
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
    throw new TRPCError({ code: "NOT_FOUND", message: "לא נמצא סל פעיל." });
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
    variantSku: item.variant.sku,
    variantName: item.variant.name,
    quantity: item.quantity,
    unitPrice: Number(item.unitPrice),
    lineTotal: Number(item.unitPrice) * item.quantity,
  }));
  const coupon = await getActiveCouponValue(cart.couponCode);
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
    couponValid: cart.couponCode ? Boolean(coupon) : undefined,
    expiresAt: cart.expiresAt,
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    totals,
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
          name: true,
          product: {
            select: {
              slug: true,
              name: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.CartInclude;
