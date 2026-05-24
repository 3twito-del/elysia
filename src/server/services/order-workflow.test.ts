import { TRPCError } from "@trpc/server";
import { describe, expect, it } from "vitest";

import {
  assertReservationAvailable,
  calculateSingleItemOrderTotals,
  createCommerceOrderNumber,
  createOrderItemName,
  createOrderShippingAddress,
  getDeliveryShippingTotal,
  getReservationExpiresAt,
  hasReservableStock,
} from "./order-workflow";

describe("order workflow helpers", () => {
  it("creates stable commerce order numbers", () => {
    expect(
      createCommerceOrderNumber(new Date("2026-04-28T08:00:00.000Z"), "ab12cd"),
    ).toBe("APH-20260428-AB12CD");
  });

  it("calculates reservation expiry from an explicit duration", () => {
    expect(
      getReservationExpiresAt({
        now: new Date("2026-04-28T08:00:00.000Z"),
        durationMs: 90 * 60_000,
      }).toISOString(),
    ).toBe("2026-04-28T09:30:00.000Z");
  });

  it("centralizes delivery shipping and single-item totals", () => {
    expect(getDeliveryShippingTotal("DELIVERY")).toBe(29);
    expect(getDeliveryShippingTotal("PICKUP")).toBe(0);
    expect(
      calculateSingleItemOrderTotals({
        unitPrice: 200,
        quantity: 2,
        fulfillmentMethod: "DELIVERY",
      }),
    ).toEqual({
      subtotal: 400,
      discount: 0,
      shipping: 29,
      total: 429,
    });
  });

  it("keeps reservation availability checks consistent", () => {
    expect(
      hasReservableStock({
        quantity: 4,
        reserved: 1,
        safetyStock: 1,
        requested: 2,
      }),
    ).toBe(true);
    expect(() =>
      assertReservationAvailable(
        {
          quantity: 4,
          reserved: 2,
          safetyStock: 1,
          requested: 2,
        },
        "not enough stock",
      ),
    ).toThrow(TRPCError);
  });

  it("normalizes order display names and shipping payloads", () => {
    expect(
      createOrderItemName({
        productName: "Venus Ring",
        variantName: "Gold",
      }),
    ).toBe("Venus Ring - Gold");
    expect(
      createOrderItemName({
        productName: "Venus Ring",
        variantName: "Venus Ring",
      }),
    ).toBe("Venus Ring");
    expect(
      createOrderShippingAddress({
        customerName: "Dana",
        customerPhone: "0501234567",
        shippingAddress: {
          city: "Tel Aviv",
          street: "Herzl 1",
        },
      }),
    ).toEqual({
      recipient: "Dana",
      phone: "0501234567",
      city: "Tel Aviv",
      street: "Herzl 1",
      postalCode: null,
    });
  });
});
