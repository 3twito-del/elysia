import { TRPCError } from "@trpc/server";
import { describe, expect, it } from "vitest";

import {
  assertManualOrderTransitionAllowed,
  assertManualReservationAvailable,
  calculateManualOrderTotals,
  createManualOrderCustomerMessage,
  createManualOrderOperationsMessage,
  createManualOrderStatusAuditMetadata,
  createManualOrderNumber,
  createManualOrderInputSchema,
  formatManualOrderAmount,
  getManualOrderReservationExpiresAt,
  redactManualOrderNotificationRecipient,
} from "./manual-order";

describe("manual order service", () => {
  it("calculates manual order totals with delivery shipping", () => {
    expect(
      calculateManualOrderTotals({
        unitPrice: 690,
        quantity: 2,
        fulfillmentMethod: "DELIVERY",
      }),
    ).toEqual({
      subtotal: 1380,
      discount: 0,
      shipping: 29,
      total: 1409,
    });
  });

  it("does not add shipping for pickup orders", () => {
    expect(
      calculateManualOrderTotals({
        unitPrice: 840,
        quantity: 1,
        fulfillmentMethod: "PICKUP",
      }).total,
    ).toBe(840);
  });

  it("creates deterministic order numbers when suffix and date are provided", () => {
    expect(
      createManualOrderNumber(new Date("2026-04-27T08:00:00.000Z"), "ab12cd"),
    ).toBe("APH-20260427-AB12CD");
  });

  it("reserves manual orders for 24 hours", () => {
    expect(
      getManualOrderReservationExpiresAt(
        new Date("2026-04-27T08:00:00.000Z"),
      ).toISOString(),
    ).toBe("2026-04-28T08:00:00.000Z");
  });

  it("rejects reservations above sellable stock", () => {
    expect(() =>
      assertManualReservationAvailable({
        quantity: 3,
        reserved: 1,
        safetyStock: 1,
        requested: 2,
      }),
    ).toThrow(TRPCError);
  });

  it("requires shipping address for delivery manual orders", () => {
    const result = createManualOrderInputSchema.safeParse({
      productSlug: "venus-line-ring",
      quantity: 1,
      fulfillmentMethod: "DELIVERY",
      branchSlug: "tel-aviv",
      customer: {
        name: "Dana Levi",
        email: "dana@example.com",
        phone: "0501234567",
      },
    });

    expect(result.success).toBe(false);
  });

  it("allows pickup manual orders without shipping address", () => {
    const result = createManualOrderInputSchema.safeParse({
      productSlug: "venus-line-ring",
      quantity: 1,
      fulfillmentMethod: "PICKUP",
      branchSlug: "tel-aviv",
      customer: {
        name: "Dana Levi",
        email: "dana@example.com",
        phone: "0501234567",
      },
    });

    expect(result.success).toBe(true);
  });

  it("allows only the next operational status for manual orders", () => {
    expect(() =>
      assertManualOrderTransitionAllowed({
        currentStatus: "PENDING_PAYMENT",
        nextStatus: "PAID",
        fulfillmentMethod: "DELIVERY",
      }),
    ).not.toThrow();

    expect(() =>
      assertManualOrderTransitionAllowed({
        currentStatus: "PENDING_PAYMENT",
        nextStatus: "COMPLETED",
        fulfillmentMethod: "DELIVERY",
      }),
    ).toThrow(TRPCError);
  });

  it("blocks fulfillment-specific status mistakes", () => {
    expect(() =>
      assertManualOrderTransitionAllowed({
        currentStatus: "PREPARING",
        nextStatus: "READY_FOR_PICKUP",
        fulfillmentMethod: "DELIVERY",
      }),
    ).toThrow(TRPCError);

    expect(() =>
      assertManualOrderTransitionAllowed({
        currentStatus: "PREPARING",
        nextStatus: "SHIPPED",
        fulfillmentMethod: "PICKUP",
      }),
    ).toThrow(TRPCError);
  });

  it("creates audit metadata for manual order status changes", () => {
    expect(
      createManualOrderStatusAuditMetadata({
        orderNumber: "APH-20260427-AB12CD",
        oldStatus: "PENDING_PAYMENT",
        newStatus: "PAID",
      }),
    ).toEqual({
      orderNumber: "APH-20260427-AB12CD",
      oldStatus: "PENDING_PAYMENT",
      newStatus: "PAID",
    });
  });

  it("formats and describes manual order customer confirmations", () => {
    const message = createManualOrderCustomerMessage({
      orderId: "order_1",
      orderNumber: "APH-20260427-AB12CD",
      customerName: "Dana",
      customerEmail: "dana@example.com",
      customerPhone: "0501234567",
      branchName: "Elysia Tel Aviv",
      branchPhone: "03-1234567",
      productName: "Venus Line Ring",
      sku: "RING-VENUS",
      quantity: 1,
      total: 1290,
      fulfillmentMethod: "PICKUP",
      reservationExpiresAt: new Date("2026-04-28T08:00:00.000Z"),
    });

    expect(message.to).toBe("dana@example.com");
    expect(message.subject).toContain("APH-20260427-AB12CD");
    expect(message.body).toContain("Venus Line Ring");
    expect(message.body).toContain(formatManualOrderAmount(1290));
  });

  it("creates operational manual order notifications", () => {
    const message = createManualOrderOperationsMessage({
      orderId: "order_1",
      orderNumber: "APH-20260427-AB12CD",
      customerName: "Dana",
      customerEmail: "dana@example.com",
      customerPhone: "0501234567",
      branchName: "Elysia Tel Aviv",
      branchPhone: "03-1234567",
      productName: "Venus Line Ring",
      sku: "RING-VENUS",
      quantity: 2,
      total: 2580,
      fulfillmentMethod: "DELIVERY",
      reservationExpiresAt: new Date("2026-04-28T08:00:00.000Z"),
    });

    expect(message.subject).toContain("APH-20260427-AB12CD");
    expect(message.body).toContain("dana@example.com");
    expect(message.body).toContain("RING-VENUS");
  });

  it("redacts manual-order notification recipients for job metadata", () => {
    expect(redactManualOrderNotificationRecipient("dana@example.com")).toBe(
      "d***@example.com",
    );
    expect(redactManualOrderNotificationRecipient("050-123-4567")).toBe(
      "***4567",
    );
    expect(redactManualOrderNotificationRecipient(null)).toBeNull();
  });
});
