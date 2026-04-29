import { describe, expect, it } from "vitest";

import {
  canRefundOrderStatus,
  shouldRestockRefundedOrder,
} from "./admin-commerce";

describe("admin commerce helpers", () => {
  it("allows refunds only after payment or fulfillment work started", () => {
    expect(canRefundOrderStatus("PENDING_PAYMENT")).toBe(false);
    expect(canRefundOrderStatus("PAID")).toBe(true);
    expect(canRefundOrderStatus("PREPARING")).toBe(true);
    expect(canRefundOrderStatus("SHIPPED")).toBe(true);
    expect(canRefundOrderStatus("COMPLETED")).toBe(true);
    expect(canRefundOrderStatus("CANCELLED")).toBe(false);
    expect(canRefundOrderStatus("REFUNDED")).toBe(false);
  });

  it("restocks refunded items only after physical fulfillment", () => {
    expect(
      shouldRestockRefundedOrder({ status: "PAID", restockItems: true }),
    ).toBe(false);
    expect(
      shouldRestockRefundedOrder({ status: "SHIPPED", restockItems: true }),
    ).toBe(true);
    expect(
      shouldRestockRefundedOrder({ status: "COMPLETED", restockItems: true }),
    ).toBe(true);
    expect(
      shouldRestockRefundedOrder({ status: "COMPLETED", restockItems: false }),
    ).toBe(false);
  });
});
