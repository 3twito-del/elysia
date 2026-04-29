import { TRPCError } from "@trpc/server";
import { describe, expect, it } from "vitest";

import {
  assertCartReservationAvailable,
  createCartCheckoutOrderNumber,
  getCartCheckoutReservationExpiresAt,
  getCartCheckoutShippingTotal,
  isCouponUsable,
} from "./cart-checkout";

describe("cart checkout service", () => {
  it("creates deterministic cart checkout order numbers", () => {
    expect(
      createCartCheckoutOrderNumber(
        new Date("2026-04-28T08:00:00.000Z"),
        "ab12cd",
      ),
    ).toBe("APH-20260428-AB12CD");
  });

  it("reserves cart checkout orders for 30 minutes", () => {
    expect(
      getCartCheckoutReservationExpiresAt(
        new Date("2026-04-28T08:00:00.000Z"),
      ).toISOString(),
    ).toBe("2026-04-28T08:30:00.000Z");
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

  it("rejects checkout reservations above sellable stock", () => {
    expect(() =>
      assertCartReservationAvailable({
        quantity: 4,
        reserved: 2,
        safetyStock: 1,
        requested: 2,
      }),
    ).toThrow(TRPCError);
  });
});
