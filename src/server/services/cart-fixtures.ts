import { TRPCError } from "@trpc/server";

import { DEFAULT_CATALOG_IMAGE } from "~/server/services/catalog-assets";
import {
  getFixtureCatalogProductBySlug,
  listFixtureCatalogProducts,
  shouldUseCatalogFixtures,
} from "~/server/services/catalog-fixtures";
import type {
  CatalogProduct,
  CatalogProductVariant,
} from "~/server/services/catalog-types";
import { normalizeCouponCode } from "~/server/services/coupons";
import { calculateOrderTotal } from "~/server/services/pricing";
import type { CartSummary } from "~/server/services/cart";

const CART_TTL_DAYS = 30;

type FixtureCartItem = {
  id: string;
  productImage: string;
  productName: string;
  productSlug: string;
  quantity: number;
  unitPrice: number;
  variantName: string;
  variantSku: string;
};

type FixtureCart = {
  couponCode: string | null;
  currency: string;
  expiresAt: Date;
  giftMessage: string | null;
  giftWrap: boolean;
  id: string;
  items: FixtureCartItem[];
  sessionKey: string;
  status: "ACTIVE";
};

const fixtureCarts = getFixtureCartStore();

export function shouldUseFixtureCart() {
  return shouldUseCatalogFixtures();
}

export function getFixtureCartBySession(sessionKey: string) {
  const cart = fixtureCarts.get(sessionKey);

  return cart ? mapFixtureCartSummary(cart, "DELIVERY") : null;
}

export function addFixtureCartItem(input: {
  branchSlug?: string;
  quantity: number;
  sessionKey: string;
  variantSku: string;
}) {
  const cart = getOrCreateFixtureCart(input.sessionKey);
  const { product, variant } = findFixtureVariant(input.variantSku);

  if (product.availabilityMode !== "READY_TO_ORDER") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "התכשיט הזה דורש תיאום עם השירות האישי לפני הזמנה.",
    });
  }

  if (variant.availableQuantity <= 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "האפשרות שנבחרה אינה פנויה כרגע.",
    });
  }

  if (!Number.isFinite(variant.price) || variant.price <= 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "פרטי המחיר דורשים אישור לפני צירוף לבחירה.",
    });
  }

  const itemId = getFixtureItemId(input.variantSku, input.branchSlug);
  const existingItem = cart.items.find((item) => item.id === itemId);

  if (existingItem) {
    existingItem.quantity = Math.min(
      10,
      existingItem.quantity + input.quantity,
    );
    existingItem.unitPrice = variant.price;
  } else {
    cart.items.push({
      id: itemId,
      productImage: product.images[0] ?? product.image ?? DEFAULT_CATALOG_IMAGE,
      productName: product.name,
      productSlug: product.slug,
      quantity: input.quantity,
      unitPrice: variant.price,
      variantName: variant.name,
      variantSku: variant.sku,
    });
  }

  return mapFixtureCartSummary(cart, "DELIVERY");
}

export function updateFixtureCartItemQuantity(input: {
  itemId: string;
  quantity: number;
  sessionKey: string;
}) {
  const cart = requireFixtureCart(input.sessionKey);
  const item = cart.items.find((item) => item.id === input.itemId);

  if (!item) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "התכשיט לא נמצא בבחירה.",
    });
  }

  item.quantity = input.quantity;

  return mapFixtureCartSummary(cart, "DELIVERY");
}

export function removeFixtureCartItem(input: {
  itemId: string;
  sessionKey: string;
}) {
  const cart = requireFixtureCart(input.sessionKey);
  const initialLength = cart.items.length;

  cart.items = cart.items.filter((item) => item.id !== input.itemId);

  if (cart.items.length === initialLength) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "התכשיט לא נמצא בבחירה.",
    });
  }

  return mapFixtureCartSummary(cart, "DELIVERY");
}

export function updateFixtureCartOptions(input: {
  couponCode?: string;
  fulfillmentMethod: "DELIVERY" | "PICKUP";
  giftMessage?: string;
  giftWrap?: boolean;
  sessionKey: string;
}) {
  const cart = requireFixtureCart(input.sessionKey);

  if (typeof input.giftWrap === "boolean") cart.giftWrap = input.giftWrap;
  if (input.giftMessage !== undefined) {
    cart.giftMessage = input.giftMessage || null;
  }
  if (input.couponCode !== undefined) {
    cart.couponCode = normalizeCouponCode(input.couponCode);
  }

  return mapFixtureCartSummary(cart, input.fulfillmentMethod);
}

export function mergeFixtureGuestCartToCustomer(input: { sessionKey: string }) {
  return getFixtureCartBySession(input.sessionKey);
}

function getOrCreateFixtureCart(sessionKey: string) {
  const existing = fixtureCarts.get(sessionKey);

  if (existing) return existing;

  const cart: FixtureCart = {
    couponCode: null,
    currency: "ILS",
    expiresAt: getCartExpiresAt(),
    giftMessage: null,
    giftWrap: false,
    id: `fixture_cart_${hashFixtureId(sessionKey)}`,
    items: [],
    sessionKey,
    status: "ACTIVE",
  };

  fixtureCarts.set(sessionKey, cart);

  return cart;
}

function requireFixtureCart(sessionKey: string) {
  const cart = fixtureCarts.get(sessionKey);

  if (!cart) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "לא נמצאה בחירה פעילה.",
    });
  }

  return cart;
}

function findFixtureVariant(variantSku: string): {
  product: CatalogProduct;
  variant: CatalogProductVariant;
} {
  for (const product of listFixtureCatalogProducts()) {
    const variant = product.variants.find(
      (variant) => variant.sku === variantSku,
    );

    if (variant) return { product, variant };
  }

  const productSku = variantSku.split("-").slice(0, 3).join("-");
  const product = productSku
    ? getFixtureCatalogProductBySlug(productSku)
    : null;

  if (product) {
    const variant = product.variants.find(
      (variant) => variant.sku === variantSku,
    );

    if (variant) return { product, variant };
  }

  throw new TRPCError({
    code: "NOT_FOUND",
    message: "האפשרות שנבחרה אינה פנויה כרגע.",
  });
}

function mapFixtureCartSummary(
  cart: FixtureCart,
  fulfillmentMethod: "DELIVERY" | "PICKUP",
): CartSummary {
  const items = cart.items.map((item) => ({
    ...item,
    lineTotal: item.unitPrice * item.quantity,
  }));
  const totals = calculateOrderTotal({
    items,
    shipping: fulfillmentMethod === "DELIVERY" ? 29 : 0,
  });

  return {
    couponCode: cart.couponCode,
    couponValid: cart.couponCode ? false : undefined,
    currency: cart.currency,
    expiresAt: cart.expiresAt,
    giftMessage: cart.giftMessage,
    giftWrap: cart.giftWrap,
    id: cart.id,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    items,
    sessionKey: cart.sessionKey,
    status: cart.status,
    totals,
  };
}

function getFixtureItemId(variantSku: string, branchSlug?: string) {
  return `fixture_item_${hashFixtureId(`${variantSku}:${branchSlug ?? ""}`)}`;
}

function hashFixtureId(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash.toString(36);
}

function getCartExpiresAt(now = new Date()) {
  return new Date(now.getTime() + CART_TTL_DAYS * 24 * 60 * 60_000);
}

function getFixtureCartStore() {
  const globalForFixtures = globalThis as typeof globalThis & {
    __elysiaFixtureCarts?: Map<string, FixtureCart>;
  };

  globalForFixtures.__elysiaFixtureCarts ??= new Map<string, FixtureCart>();

  return globalForFixtures.__elysiaFixtureCarts;
}
