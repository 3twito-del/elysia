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
import {
  getPublicCouponStatusMessage,
  normalizeCouponCode,
} from "~/server/services/coupons";
import { calculateOrderTotal } from "~/server/services/pricing";
import type { CartSummary } from "~/server/services/cart";

const CART_TTL_DAYS = 30;

type FixtureCartItem = {
  id: string;
  externalHandle?: string;
  externalProductId?: string;
  externalProvider?: string;
  externalVariantId?: string;
  productImage: string;
  productName: string;
  productSlug: string;
  quantity: number;
  source: "OWN" | "DROPSHIP_SHOPIFY";
  supplierKey?: string;
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
      message: "התכשיט הזה דורש תיאום עם שירות הלקוחות לפני הזמנה.",
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
      message: "פרטי המחיר דורשים אישור לפני הוספה לסל.",
    });
  }

  const itemId = getFixtureItemId(input.variantSku, input.branchSlug);
  const existingItem = cart.items.find((item) => item.id === itemId);
  const requiresSeparateCheckout = product.requiresSeparateCheckout;

  if (existingItem) {
    existingItem.quantity = Math.min(
      10,
      existingItem.quantity + input.quantity,
    );
    existingItem.unitPrice = variant.price;
  } else {
    cart.items.push({
      id: itemId,
      externalHandle: requiresSeparateCheckout ? product.slug : undefined,
      externalProductId: requiresSeparateCheckout ? product.sku : undefined,
      externalProvider: requiresSeparateCheckout
        ? "separate-checkout"
        : undefined,
      externalVariantId: requiresSeparateCheckout ? variant.sku : undefined,
      productImage: product.images[0] ?? product.image ?? DEFAULT_CATALOG_IMAGE,
      productName: product.name,
      productSlug: product.slug,
      quantity: input.quantity,
      source: requiresSeparateCheckout ? "DROPSHIP_SHOPIFY" : "OWN",
      supplierKey: requiresSeparateCheckout ? "separate-checkout" : undefined,
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
    id: item.id,
    externalHandle: item.externalHandle,
    externalProductId: item.externalProductId,
    externalProvider: item.externalProvider,
    externalVariantId: item.externalVariantId,
    lineTotal: item.unitPrice * item.quantity,
    productImage: item.productImage,
    productName: item.productName,
    productSlug: item.productSlug,
    quantity: item.quantity,
    source: item.source,
    supplierKey: item.supplierKey,
    unitPrice: item.unitPrice,
    variantName: item.variantName,
    variantSku: item.variantSku,
  }));
  const totals = calculateOrderTotal({
    items,
    shipping: fulfillmentMethod === "DELIVERY" ? 29 : 0,
  });

  return {
    couponCode: cart.couponCode,
    couponMessage: cart.couponCode
      ? getPublicCouponStatusMessage("unknown")
      : undefined,
    couponStatus: cart.couponCode ? "unknown" : undefined,
    couponValid: cart.couponCode ? false : undefined,
    currency: cart.currency,
    expiresAt: cart.expiresAt,
    giftMessage: cart.giftMessage,
    giftWrap: cart.giftWrap,
    id: cart.id,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    items,
    groups: groupFixtureCartItemsBySource(items, fulfillmentMethod),
    sessionKey: cart.sessionKey,
    status: cart.status,
    totals,
  };
}

function groupFixtureCartItemsBySource(
  items: Array<{
    lineTotal: number;
    quantity: number;
    source: "OWN" | "DROPSHIP_SHOPIFY";
    unitPrice: number;
  }>,
  fulfillmentMethod: "DELIVERY" | "PICKUP",
) {
  const own = items.filter((item) => item.source === "OWN");
  const dropshipShopify = items.filter(
    (item) => item.source === "DROPSHIP_SHOPIFY",
  );

  return {
    own: summarizeFixtureCartGroup(own, {
      shipping: fulfillmentMethod === "DELIVERY" ? 29 : 0,
    }),
    dropshipShopify: summarizeFixtureCartGroup(dropshipShopify),
  };
}

function summarizeFixtureCartGroup(
  items: Array<{
    lineTotal: number;
    quantity: number;
    unitPrice: number;
  }>,
  options: {
    shipping?: number;
  } = {},
) {
  const totals = calculateOrderTotal({
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
