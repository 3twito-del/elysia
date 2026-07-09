import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  cartFindFirst: vi.fn(),
  cartItemUpdate: vi.fn(),
  priceFindFirst: vi.fn(),
  priceUpdate: vi.fn(),
  productVariantUpdate: vi.fn(),
  productVariantUpdateMany: vi.fn(),
}));
const shopifyMocks = vi.hoisted(() => ({
  createCart: vi.fn(),
  getVariantNodes: vi.fn(),
}));

vi.mock("~/server/db", () => ({
  db: {
    cart: {
      findFirst: dbMocks.cartFindFirst,
    },
    cartItem: {
      update: dbMocks.cartItemUpdate,
    },
    price: {
      findFirst: dbMocks.priceFindFirst,
      update: dbMocks.priceUpdate,
    },
    productVariant: {
      update: dbMocks.productVariantUpdate,
      updateMany: dbMocks.productVariantUpdateMany,
    },
  },
}));

vi.mock("~/server/adapters/shopify", () => ({
  shopifyDropshipProvider: {
    createCart: shopifyMocks.createCart,
    getVariantNodes: shopifyMocks.getVariantNodes,
  },
}));

import { TRPCError } from "@trpc/server";

import {
  createShopifyDropshipCheckout,
  evaluateClickOutVerification,
} from "./shopify-dropship-checkout";

describe("click-out verification (pure)", () => {
  const item = {
    cartItemId: "item_1",
    externalVariantId: "gid://shopify/ProductVariant/10",
    unitPrice: 199,
    variantId: "variant_1",
  };

  it("passes when the live variant matches availability, currency, and price", () => {
    expect(
      evaluateClickOutVerification({
        items: [item],
        liveVariants: [
          {
            availableForSale: true,
            currencyCode: "ILS",
            id: item.externalVariantId,
            priceAmount: 199,
          },
        ],
      }),
    ).toEqual({ status: "ok" });
  });

  it("blocks when the live variant is missing", () => {
    const verdict = evaluateClickOutVerification({
      items: [item],
      liveVariants: [],
    });

    expect(verdict.status).toBe("blocked");
    if (verdict.status === "blocked") {
      expect(verdict.reasons).toEqual([
        { externalVariantId: item.externalVariantId, reason: "missing" },
      ]);
    }
  });

  it("blocks when the live variant is not available for sale", () => {
    const verdict = evaluateClickOutVerification({
      items: [item],
      liveVariants: [
        {
          availableForSale: false,
          currencyCode: "ILS",
          id: item.externalVariantId,
          priceAmount: 199,
        },
      ],
    });

    expect(verdict.status).toBe("blocked");
  });

  it("blocks a non-ILS supplier price instead of converting it", () => {
    const verdict = evaluateClickOutVerification({
      items: [item],
      liveVariants: [
        {
          availableForSale: true,
          currencyCode: "USD",
          id: item.externalVariantId,
          priceAmount: 55,
        },
      ],
    });

    expect(verdict.status).toBe("blocked");
    if (verdict.status === "blocked") {
      expect(verdict.reasons[0]?.reason).toBe("currency");
    }
  });

  it("reports price drift when the supplier price moved", () => {
    const verdict = evaluateClickOutVerification({
      items: [item],
      liveVariants: [
        {
          availableForSale: true,
          currencyCode: "ILS",
          id: item.externalVariantId,
          priceAmount: 219,
        },
      ],
    });

    expect(verdict.status).toBe("price_drift");
    if (verdict.status === "price_drift") {
      expect(verdict.drifts).toEqual([
        {
          cartItemId: "item_1",
          displayedPrice: 199,
          externalVariantId: item.externalVariantId,
          livePrice: 219,
          variantId: "variant_1",
        },
      ]);
    }
  });

  it("prefers blocking over drift when both occur", () => {
    const second = {
      ...item,
      cartItemId: "item_2",
      externalVariantId: "gid://shopify/ProductVariant/11",
      variantId: "variant_2",
    };
    const verdict = evaluateClickOutVerification({
      items: [item, second],
      liveVariants: [
        {
          availableForSale: false,
          currencyCode: "ILS",
          id: item.externalVariantId,
          priceAmount: 199,
        },
        {
          availableForSale: true,
          currencyCode: "ILS",
          id: second.externalVariantId,
          priceAmount: 500,
        },
      ],
    });

    expect(verdict.status).toBe("blocked");
  });
});

describe("Shopify dropship checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    shopifyMocks.getVariantNodes.mockResolvedValue([
      {
        availableForSale: true,
        currencyCode: "ILS",
        id: "gid://shopify/ProductVariant/10",
        priceAmount: 199,
      },
    ]);
    dbMocks.productVariantUpdateMany.mockResolvedValue({ count: 1 });
  });

  it("creates a Shopify checkout after live verification passes", async () => {
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
    expect(shopifyMocks.getVariantNodes).toHaveBeenCalledWith({
      ids: ["gid://shopify/ProductVariant/10"],
    });
    expect(dbMocks.productVariantUpdateMany).toHaveBeenCalled();
    expect(shopifyMocks.createCart).toHaveBeenCalledWith({
      lines: [
        {
          merchandiseId: "gid://shopify/ProductVariant/10",
          quantity: 2,
        },
      ],
    });
  });

  it("fails closed when live verification is unreachable", async () => {
    dbMocks.cartFindFirst.mockResolvedValueOnce(
      makeCart({
        items: [
          makeCartItem({
            externalVariantId: "gid://shopify/ProductVariant/10",
            source: "DROPSHIP_SHOPIFY",
          }),
        ],
      }),
    );
    shopifyMocks.getVariantNodes.mockRejectedValueOnce(
      new Error("storefront down"),
    );

    await expect(
      createShopifyDropshipCheckout({
        sessionKey: "cart-session-123456789",
      }),
    ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    expect(shopifyMocks.createCart).not.toHaveBeenCalled();
  });

  it("blocks the redirect when the supplier reports the item unavailable", async () => {
    dbMocks.cartFindFirst.mockResolvedValueOnce(
      makeCart({
        items: [
          makeCartItem({
            externalVariantId: "gid://shopify/ProductVariant/10",
            source: "DROPSHIP_SHOPIFY",
          }),
        ],
      }),
    );
    shopifyMocks.getVariantNodes.mockResolvedValueOnce([
      {
        availableForSale: false,
        currencyCode: "ILS",
        id: "gid://shopify/ProductVariant/10",
        priceAmount: 199,
      },
    ]);

    await expect(
      createShopifyDropshipCheckout({
        sessionKey: "cart-session-123456789",
      }),
    ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    expect(shopifyMocks.createCart).not.toHaveBeenCalled();
  });

  it("updates the display truth and requires re-confirmation on price drift", async () => {
    dbMocks.cartFindFirst.mockResolvedValueOnce(
      makeCart({
        items: [
          makeCartItem({
            externalVariantId: "gid://shopify/ProductVariant/10",
            source: "DROPSHIP_SHOPIFY",
            unitPrice: 199,
          }),
        ],
      }),
    );
    shopifyMocks.getVariantNodes.mockResolvedValueOnce([
      {
        availableForSale: true,
        currencyCode: "ILS",
        id: "gid://shopify/ProductVariant/10",
        priceAmount: 249,
      },
    ]);
    dbMocks.cartItemUpdate.mockResolvedValueOnce({});
    dbMocks.priceFindFirst.mockResolvedValueOnce({
      amount: 199,
      id: "price_1",
    });
    dbMocks.priceUpdate.mockResolvedValueOnce({});
    dbMocks.productVariantUpdate.mockResolvedValueOnce({});

    await expect(
      createShopifyDropshipCheckout({
        sessionKey: "cart-session-123456789",
      }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
    expect(dbMocks.cartItemUpdate).toHaveBeenCalledWith({
      where: { id: "item_1" },
      data: { unitPrice: 249 },
    });
    expect(dbMocks.priceUpdate).toHaveBeenCalledWith({
      where: { id: "price_1" },
      data: { amount: 249 },
    });
    expect(shopifyMocks.createCart).not.toHaveBeenCalled();
  });

  it("skips verification only when the provider reports it unavailable (dev mock)", async () => {
    dbMocks.cartFindFirst.mockResolvedValueOnce(
      makeCart({
        items: [
          makeCartItem({
            externalVariantId: "gid://shopify/ProductVariant/10",
            source: "DROPSHIP_SHOPIFY",
          }),
        ],
      }),
    );
    shopifyMocks.getVariantNodes.mockResolvedValueOnce(null);
    shopifyMocks.createCart.mockResolvedValueOnce({
      cartId: "mock_shopify_cart",
      checkoutUrl: "/checkout/mock-shopify-dropship",
    });

    await expect(
      createShopifyDropshipCheckout({
        sessionKey: "cart-session-123456789",
      }),
    ).resolves.toMatchObject({ externalCartId: "mock_shopify_cart" });
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
  unitPrice?: number;
}) {
  return {
    id: input.id ?? "item_1",
    quantity: input.quantity ?? 1,
    unitPrice: input.unitPrice ?? 199,
    variantId: `variant_${input.id ?? "item_1"}`,
    variant: {
      externalVariantId: input.externalVariantId ?? null,
      product: {
        source: input.source,
      },
    },
  };
}
