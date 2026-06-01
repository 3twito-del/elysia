import { readFileSync } from "node:fs";
import path from "node:path";

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

  it("keeps multi-step admin mutations inside transaction boundaries", () => {
    const source = read("src/server/services/admin-commerce.ts");

    for (const operation of [
      "upsertAdminShipment",
      "refundAdminOrder",
      "updateAdminAppointmentStatus",
      "createAdminProduct",
      "updateAdminProductCommerce",
      "updateAdminProductStatus",
      "updateAdminInventory",
      "createAdminCoupon",
      "updateAdminCouponStatus",
    ]) {
      expect(getFunctionSource(source, operation)).toContain("db.$transaction");
    }

    const refundSource = getFunctionSource(source, "refundAdminOrder");

    expect(refundSource).toContain("tx.returnRequest");
    expect(refundSource).toContain("releaseOutstandingReservationsForRefund");
    expect(refundSource).toContain("tx.payment.updateMany");
    expect(refundSource).toContain("tx.order.update");
    expect(refundSource).not.toContain("db.payment.updateMany");
    expect(refundSource).not.toContain("db.order.update");
  });
});

function getFunctionSource(source: string, functionName: string) {
  const start = source.indexOf(`export async function ${functionName}`);
  const next = source.indexOf("\nexport async function ", start + 1);

  expect(start).toBeGreaterThanOrEqual(0);

  return source.slice(start, next === -1 ? source.length : next);
}

function read(relativePath: string) {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}
