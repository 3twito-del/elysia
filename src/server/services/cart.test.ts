import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  cartFindFirst: vi.fn(),
  cartUpdate: vi.fn(),
  cartItemUpdate: vi.fn(),
  couponFindUnique: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("~/server/db", () => ({
  db: {
    $transaction: dbMocks.transaction,
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
  addCartItem,
  getCartBySession,
  mergeGuestCartToCustomer,
  updateCartItemQuantity,
  updateCartOptions,
} from "./cart";

describe("cart service", () => {
  beforeEach(() => {
    // CI sets the catalog fixture flags (E2E_CATALOG_FIXTURES /
    // CATALOG_DB_ERROR_FALLBACK = "1") for the Playwright surfaces. They flip the
    // cart service onto its in-memory fixture path, which bypasses the mocked
    // `~/server/db` these unit tests depend on — deterministically breaking 7 of
    // them in CI while they passed locally (where the flags are unset). Force
    // real-db mode so the mock is exercised regardless of the ambient env.
    vi.stubEnv("E2E_CATALOG_FIXTURES", "0");
    vi.stubEnv("CATALOG_DB_ERROR_FALLBACK", "0");
    // resetAllMocks (not clearAllMocks) so leftover mockResolvedValueOnce values
    // never leak across tests.
    vi.resetAllMocks();
    dbMocks.couponFindUnique.mockResolvedValue(null);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
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
      couponMessage: "קוד ההטבה נקלט והסכום עודכן בסיכום.",
      couponStatus: "success",
      couponValid: true,
      groups: {
        dropshipShopify: {
          discount: 0,
          itemCount: 0,
          lineCount: 0,
          shipping: 0,
          subtotal: 0,
          total: 0,
        },
        own: {
          discount: 110,
          itemCount: 3,
          lineCount: 2,
          shipping: 29,
          subtotal: 1100,
          total: 1019,
        },
      },
      itemCount: 3,
      items: [
        {
          id: "item_1",
          lineTotal: 1000,
          productSlug: "venus-line-ring",
          quantity: 2,
          source: "OWN",
          unitPrice: 500,
          externalVariantId: undefined,
          variantSku: "RING-VENUS",
        },
        {
          id: "item_2",
          lineTotal: 100,
          productSlug: "noor-earrings",
          quantity: 1,
          source: "OWN",
          unitPrice: 100,
          externalVariantId: undefined,
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
      couponMessage: "קוד ההטבה נקלט והסכום עודכן בסיכום.",
      couponStatus: "success",
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

  it("keeps expired coupon status visible without applying a discount", async () => {
    dbMocks.cartFindFirst.mockResolvedValueOnce(
      makeCart({
        couponCode: "OLD",
        items: [makeCartItem({ quantity: 1, unitPrice: 500 })],
      }),
    );
    dbMocks.couponFindUnique.mockResolvedValueOnce({
      amountOff: null,
      code: "OLD",
      endsAt: new Date("2026-01-01T00:00:00.000Z"),
      id: "coupon_1",
      isActive: true,
      maxUses: null,
      percentOff: 10,
      startsAt: new Date("2025-01-01T00:00:00.000Z"),
      usedCount: 0,
    });

    const summary = await getCartBySession("session-key-123456789");

    expect(summary).toMatchObject({
      couponCode: "OLD",
      couponMessage: "קוד ההטבה פג תוקף ואינו זמין להזמנה הזו.",
      couponStatus: "expired",
      couponValid: false,
      totals: {
        discount: 0,
        shipping: 29,
        subtotal: 500,
        total: 529,
      },
    });
  });

  it("splits mixed carts into local and Shopify dropship groups", async () => {
    dbMocks.cartFindFirst.mockResolvedValueOnce(
      makeCart({
        items: [
          makeCartItem({ id: "item_1", quantity: 1, unitPrice: 500 }),
          makeCartItem({
            id: "item_2",
            productSlug: "supplier-necklace",
            quantity: 2,
            source: "DROPSHIP_SHOPIFY",
            unitPrice: 300,
            variantSku: "SHOPIFY-NECKLACE",
          }),
        ],
      }),
    );

    const summary = await getCartBySession("session-key-123456789");

    expect(summary?.groups).toEqual({
      dropshipShopify: {
        discount: 0,
        itemCount: 2,
        lineCount: 1,
        shipping: 0,
        subtotal: 600,
        total: 600,
      },
      own: {
        discount: 0,
        itemCount: 1,
        lineCount: 1,
        shipping: 29,
        subtotal: 500,
        total: 529,
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

  it("rejects malformed cart session keys before reading cart state", async () => {
    await expect(getCartBySession("short")).rejects.toThrow();
    await expect(
      updateCartOptions({
        fulfillmentMethod: "DELIVERY",
        sessionKey: "short",
      }),
    ).rejects.toThrow();

    expect(dbMocks.cartFindFirst).not.toHaveBeenCalled();
  });

  it("merges guest carts to a customer with merge metadata", async () => {
    dbMocks.cartFindFirst.mockResolvedValueOnce(makeCart({ id: "guest_cart" }));
    dbMocks.cartUpdate.mockResolvedValueOnce(
      makeCart({
        customerId: "customer_1",
        id: "guest_cart",
        mergeMetadata: {
          mergedAt: "2026-06-01T00:00:00.000Z",
          mergedFromSessionKey: "session-key-123456789",
        },
      }),
    );

    const summary = await mergeGuestCartToCustomer({
      customerId: "customer_1",
      sessionKey: "session-key-123456789",
    });
    const updateInput = getFirstMockArg(dbMocks.cartUpdate) as {
      data: {
        customerId: string;
        mergeMetadata: {
          mergedAt: string;
          mergedFromSessionKey: string;
        };
      };
      where: { id: string };
    };

    expect(updateInput.where).toEqual({ id: "guest_cart" });
    expect(updateInput.data.customerId).toBe("customer_1");
    expect(updateInput.data.mergeMetadata.mergedFromSessionKey).toBe(
      "session-key-123456789",
    );
    expect(
      new Date(updateInput.data.mergeMetadata.mergedAt).toString(),
    ).not.toBe("Invalid Date");
    expect(summary?.sessionKey).toBe("session-key-123456789");
  });

  it("increments an existing cart line instead of creating duplicate variant rows", async () => {
    const tx = makeCartTransaction();
    dbMocks.transaction.mockImplementationOnce(async (callback: unknown) => {
      const transactionCallback = callback as (
        txClient: ReturnType<typeof makeCartTransaction>,
      ) => Promise<unknown>;

      return transactionCallback(tx);
    });
    tx.cart.findFirst.mockResolvedValueOnce(makeCart({ id: "cart_1" }));
    tx.productVariant.findUnique.mockResolvedValueOnce({
      id: "variant_1",
      priceDelta: 0,
      prices: [{ amount: 500 }],
      product: {
        basePrice: 500,
        status: "ACTIVE",
      },
    });
    tx.cartItem.findFirst.mockResolvedValueOnce({
      branchId: null,
      cartId: "cart_1",
      id: "item_1",
      variantId: "variant_1",
    });
    tx.cartFindUniqueOrThrowResult = makeCart({
      id: "cart_1",
      items: [makeCartItem({ id: "item_1", quantity: 3, unitPrice: 500 })],
    });

    const summary = await addCartItem({
      quantity: 2,
      sessionKey: "session-key-123456789",
      variantSku: "RING-VENUS",
    });

    expect(tx.cartItem.update).toHaveBeenCalledWith({
      data: {
        quantity: { increment: 2 },
        unitPrice: 500,
      },
      where: { id: "item_1" },
    });
    expect(tx.cartItem.create).not.toHaveBeenCalled();
    expect(summary.itemCount).toBe(3);
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
    source?: "OWN" | "DROPSHIP_SHOPIFY";
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
        externalHandle: null,
        externalProductId: null,
        externalProvider: null,
        media: [{ url: "/venus.png" }],
        name: "Venus Line Ring",
        slug: overrides.productSlug ?? "venus-line-ring",
        source: overrides.source ?? "OWN",
        supplierKey: null,
      },
      sku: overrides.variantSku ?? "RING-VENUS",
    },
    variantId: "variant_1",
  };
}

function makeCartTransaction() {
  const tx = {
    branch: {
      findUnique: vi.fn(),
    },
    cart: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findUniqueOrThrow: vi.fn(async () => tx.cartFindUniqueOrThrowResult),
    },
    cartFindUniqueOrThrowResult: makeCart(),
    cartItem: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    productVariant: {
      findUnique: vi.fn(),
    },
  };

  return tx;
}
