import { TRPCError } from "@trpc/server";
import { describe, expect, it } from "vitest";

import {
  assertCartCheckoutPricesAvailable,
  assertCartCheckoutOwnItems,
  cartCheckoutInputSchema,
  createCartCheckoutOrderNumber,
  getCartCheckoutReservationExpiresAt,
  getCartCheckoutShippingTotal,
  getCartCheckoutOwnItems,
  isCouponUsable,
} from "./cart-checkout";

describe("cart checkout service", () => {
  it("creates deterministic cart checkout order numbers", () => {
    expect(
      createCartCheckoutOrderNumber(
        new Date("2026-04-28T08:00:00.000Z"),
        "ab12cd",
      ),
    ).toBe("ELY-20260428-AB12CD");
  });

  it("reserves cart checkout orders for 24 hours, matching the manual-order window", () => {
    expect(
      getCartCheckoutReservationExpiresAt(
        new Date("2026-04-28T08:00:00.000Z"),
      ).toISOString(),
    ).toBe("2026-04-29T08:00:00.000Z");
  });

  it("charges delivery shipping only for delivery", () => {
    expect(getCartCheckoutShippingTotal("DELIVERY")).toBe(29);
    expect(getCartCheckoutShippingTotal("PICKUP")).toBe(0);
  });

  it("rejects expired, inactive, future, and exhausted coupons", () => {
    const now = new Date("2026-04-28T08:00:00.000Z");

    expect(
      isCouponUsable({
        isActive: true,
        startsAt: new Date("2026-04-01T00:00:00.000Z"),
        endsAt: null,
        maxUses: null,
        usedCount: 0,
        now,
      }),
    ).toBe(true);
    expect(
      isCouponUsable({
        isActive: false,
        startsAt: new Date("2026-04-01T00:00:00.000Z"),
        endsAt: null,
        maxUses: null,
        usedCount: 0,
        now,
      }),
    ).toBe(false);
    expect(
      isCouponUsable({
        isActive: true,
        startsAt: new Date("2026-05-01T00:00:00.000Z"),
        endsAt: null,
        maxUses: null,
        usedCount: 0,
        now,
      }),
    ).toBe(false);
    expect(
      isCouponUsable({
        isActive: true,
        startsAt: new Date("2026-04-01T00:00:00.000Z"),
        endsAt: new Date("2026-04-20T00:00:00.000Z"),
        maxUses: null,
        usedCount: 0,
        now,
      }),
    ).toBe(false);
    expect(
      isCouponUsable({
        isActive: true,
        startsAt: new Date("2026-04-01T00:00:00.000Z"),
        endsAt: null,
        maxUses: 3,
        usedCount: 3,
        now,
      }),
    ).toBe(false);
  });

  it("rejects checkout items without a usable price", () => {
    expect(() =>
      assertCartCheckoutPricesAvailable([
        { quantity: 1, unitPrice: 0 },
        { quantity: 1, unitPrice: 1290 },
      ]),
    ).toThrow(TRPCError);
  });

  it("rejects Shopify dropship items from local checkout", () => {
    expect(() =>
      assertCartCheckoutOwnItems([
        { variant: { product: { source: "OWN" } } },
        { variant: { product: { source: "DROPSHIP_SHOPIFY" } } },
      ]),
    ).toThrow(TRPCError);
  });

  it("selects only owned items for local checkout in mixed carts", () => {
    expect(
      getCartCheckoutOwnItems([
        { id: "own", variant: { product: { source: "OWN" } } },
        {
          id: "dropship",
          variant: { product: { source: "DROPSHIP_SHOPIFY" } },
        },
      ]).map((item) => item.id),
    ).toEqual(["own"]);
  });

  it("requires shipping address for delivery checkout", () => {
    const result = cartCheckoutInputSchema.safeParse({
      sessionKey: "cart-session-key-123456",
      fulfillmentMethod: "DELIVERY",
      customer: {
        name: "Dana Levi",
        email: "dana@example.com",
        phone: "0501234567",
      },
    });

    expect(result.success).toBe(false);
  });

  it("allows online delivery checkout without a public inventory source", () => {
    const result = cartCheckoutInputSchema.safeParse({
      sessionKey: "cart-session-key-123456",
      fulfillmentMethod: "DELIVERY",
      customer: {
        name: "Dana Levi",
        email: "dana@example.com",
        phone: "0501234567",
      },
      shippingAddress: {
        city: "Tel Aviv",
        street: "Herzl 1",
      },
    });

    expect(result.success).toBe(true);
  });
});
