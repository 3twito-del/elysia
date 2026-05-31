import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  cartFindFirst: vi.fn(),
}));
const shopifyMocks = vi.hoisted(() => ({
  createCart: vi.fn(),
}));

vi.mock("~/server/db", () => ({
  db: {
    cart: {
      findFirst: dbMocks.cartFindFirst,
    },
  },
}));

vi.mock("~/server/adapters/shopify", () => ({
  shopifyDropshipProvider: {
    createCart: shopifyMocks.createCart,
  },
}));

import { TRPCError } from "@trpc/server";

import { createShopifyDropshipCheckout } from "./shopify-dropship-checkout";

describe("Shopify dropship checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a Shopify checkout from dropship cart lines", async () => {
    dbMocks.cartFindFirst.mockResolvedValueOnce(
      makeCart({
        items: [
          makeCartItem({
            externalVariantId: "gid://shopify/ProductVariant/10",
            quantity: 2,
            source: "DROPSHIP_SHOPIFY",
          }),
          makeCartItem({ id: "own", source: "OWN" }),
        ],
      }),
    );
    shopifyMocks.createCart.mockResolvedValueOnce({
      cartId: "gid://shopify/Cart/1",
      checkoutUrl: "https://checkout.shopify.com/cart/1",
    });

    await expect(
      createShopifyDropshipCheckout({
        sessionKey: "cart-session-123456789",
      }),
    ).resolves.toEqual({
      checkoutUrl: "https://checkout.shopify.com/cart/1",
      externalCartId: "gid://shopify/Cart/1",
      itemCount: 2,
      lineCount: 1,
    });
    expect(shopifyMocks.createCart).toHaveBeenCalledWith({
      lines: [
        {
          merchandiseId: "gid://shopify/ProductVariant/10",
          quantity: 2,
        },
      ],
    });
  });

  it("rejects dropship checkout when Shopify variant mapping is missing", async () => {
    dbMocks.cartFindFirst.mockResolvedValueOnce(
      makeCart({
        items: [makeCartItem({ source: "DROPSHIP_SHOPIFY" })],
      }),
    );

    await expect(
      createShopifyDropshipCheckout({
        sessionKey: "cart-session-123456789",
      }),
    ).rejects.toBeInstanceOf(TRPCError);
    expect(shopifyMocks.createCart).not.toHaveBeenCalled();
  });

  it("rejects dropship checkout when the cart only has local items", async () => {
    dbMocks.cartFindFirst.mockResolvedValueOnce(
      makeCart({
        items: [makeCartItem({ source: "OWN" })],
      }),
    );

    await expect(
      createShopifyDropshipCheckout({
        sessionKey: "cart-session-123456789",
      }),
    ).rejects.toBeInstanceOf(TRPCError);
    expect(shopifyMocks.createCart).not.toHaveBeenCalled();
  });
});

function makeCart(overrides: { items?: unknown[] } = {}) {
  return {
    id: "cart_1",
    items: overrides.items ?? [],
  };
}

function makeCartItem(input: {
  externalVariantId?: string;
  id?: string;
  quantity?: number;
  source: "OWN" | "DROPSHIP_SHOPIFY";
}) {
  return {
    id: input.id ?? "item_1",
    quantity: input.quantity ?? 1,
    variant: {
      externalVariantId: input.externalVariantId ?? null,
      product: {
        source: input.source,
      },
    },
  };
}
