import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  cartFindFirst: vi.fn(),
  cartUpdate: vi.fn(),
  cartItemUpdate: vi.fn(),
  couponFindUnique: vi.fn(),
}));

vi.mock("~/server/db", () => ({
  db: {
    cart: {
      findFirst: dbMocks.cartFindFirst,
      update: dbMocks.cartUpdate,
    },
    cartItem: {
      update: dbMocks.cartItemUpdate,
    },
    coupon: {
      findUnique: dbMocks.couponFindUnique,
    },
  },
}));

import {
  getCartBySession,
  updateCartItemQuantity,
  updateCartOptions,
} from "./cart";

describe("cart service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMocks.couponFindUnique.mockResolvedValue(null);
  });

  it("maps active carts into checkout summaries with coupon totals", async () => {
    dbMocks.cartFindFirst.mockResolvedValueOnce(
      makeCart({
        couponCode: "SAVE10",
        items: [
          makeCartItem({ id: "item_1", quantity: 2, unitPrice: 500 }),
          makeCartItem({
            id: "item_2",
            productSlug: "noor-earrings",
            quantity: 1,
            unitPrice: 100,
            variantSku: "EAR-NOOR",
          }),
        ],
      }),
    );
    dbMocks.couponFindUnique.mockResolvedValueOnce({
      amountOff: null,
      code: "SAVE10",
      endsAt: null,
      id: "coupon_1",
      isActive: true,
      maxUses: null,
      percentOff: 10,
      startsAt: new Date("2026-01-01T00:00:00.000Z"),
      usedCount: 0,
    });

    const summary = await getCartBySession("session-key-123456789");

    expect(summary).toMatchObject({
      couponCode: "SAVE10",
      couponValid: true,
      itemCount: 3,
      items: [
        {
          id: "item_1",
          lineTotal: 1000,
          productSlug: "venus-line-ring",
          quantity: 2,
          unitPrice: 500,
          variantSku: "RING-VENUS",
        },
        {
          id: "item_2",
          lineTotal: 100,
          productSlug: "noor-earrings",
          quantity: 1,
          unitPrice: 100,
          variantSku: "EAR-NOOR",
        },
      ],
      totals: {
        discount: 110,
        shipping: 29,
        subtotal: 1100,
        total: 1019,
      },
    });
  });

  it("updates cart options, normalizes coupon code, and recalculates pickup totals", async () => {
    const activeCart = makeCart({ id: "cart_1" });
    const updatedCart = makeCart({
      couponCode: "SAVE20",
      giftMessage: "Happy birthday",
      giftWrap: true,
      id: "cart_1",
      items: [makeCartItem({ quantity: 1, unitPrice: 500 })],
    });

    dbMocks.cartFindFirst.mockResolvedValueOnce(activeCart);
    dbMocks.cartUpdate.mockResolvedValueOnce(updatedCart);
    dbMocks.couponFindUnique.mockResolvedValueOnce({
      amountOff: 20,
      code: "SAVE20",
      endsAt: null,
      id: "coupon_1",
      isActive: true,
      maxUses: null,
      percentOff: null,
      startsAt: new Date("2026-01-01T00:00:00.000Z"),
      usedCount: 0,
    });

    const summary = await updateCartOptions({
      couponCode: " save20 ",
      fulfillmentMethod: "PICKUP",
      giftMessage: "Happy birthday",
      giftWrap: true,
      sessionKey: "session-key-123456789",
    });

    const updateInput = getFirstMockArg(dbMocks.cartUpdate) as {
      data: {
        couponCode: string;
        giftMessage: string;
        giftWrap: boolean;
      };
      include?: unknown;
      where: { id: string };
    };

    expect(updateInput.include).toBeDefined();
    expect(updateInput.where).toEqual({ id: "cart_1" });
    expect(updateInput.data).toEqual({
      couponCode: "SAVE20",
      giftMessage: "Happy birthday",
      giftWrap: true,
    });
    expect(summary).toMatchObject({
      couponCode: "SAVE20",
      couponValid: true,
      giftMessage: "Happy birthday",
      giftWrap: true,
      totals: {
        discount: 20,
        shipping: 0,
        subtotal: 500,
        total: 480,
      },
    });
  });

  it("updates item quantities only after finding the item in the active cart", async () => {
    dbMocks.cartFindFirst
      .mockResolvedValueOnce(
        makeCart({
          items: [makeCartItem({ id: "item_1", quantity: 1, unitPrice: 500 })],
        }),
      )
      .mockResolvedValueOnce(
        makeCart({
          items: [makeCartItem({ id: "item_1", quantity: 3, unitPrice: 500 })],
        }),
      );
    dbMocks.cartItemUpdate.mockResolvedValueOnce({});

    const summary = await updateCartItemQuantity({
      itemId: "item_1",
      quantity: 3,
      sessionKey: "session-key-123456789",
    });

    expect(dbMocks.cartItemUpdate).toHaveBeenCalledWith({
      data: { quantity: 3 },
      where: { id: "item_1" },
    });
    expect(summary?.itemCount).toBe(3);
    expect(summary?.totals.subtotal).toBe(1500);
  });
});

function makeCart(overrides: Record<string, unknown> = {}) {
  return {
    couponCode: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    currency: "ILS",
    customerId: null,
    expiresAt: new Date("2026-02-01T00:00:00.000Z"),
    giftMessage: null,
    giftWrap: false,
    id: "cart_1",
    items: [makeCartItem()],
    mergeMetadata: null,
    sessionKey: "session-key-123456789",
    status: "ACTIVE",
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

function getFirstMockArg(mock: ReturnType<typeof vi.fn>): unknown {
  return mock.mock.calls[0]?.[0];
}

function makeCartItem(
  overrides: {
    id?: string;
    productSlug?: string;
    quantity?: number;
    unitPrice?: number;
    variantSku?: string;
  } = {},
) {
  return {
    branchId: null,
    cartId: "cart_1",
    id: overrides.id ?? "item_1",
    quantity: overrides.quantity ?? 1,
    unitPrice: overrides.unitPrice ?? 500,
    variant: {
      name: "Default",
      product: {
        media: [{ url: "/venus.png" }],
        name: "Venus Line Ring",
        slug: overrides.productSlug ?? "venus-line-ring",
      },
      sku: overrides.variantSku ?? "RING-VENUS",
    },
    variantId: "variant_1",
  };
}
