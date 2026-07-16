import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  canRefundOrderStatus,
  shouldRestockRefundedOrder,
} from "./admin-commerce";
import { resolveRefundLines } from "./admin-commerce-workflow";

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
      "updateAdminProductMediaAsset",
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
    expect(refundSource).toContain("tx.payment.update");
    expect(refundSource).toContain("tx.order.update");
    expect(refundSource).not.toContain("db.payment.updateMany");
    expect(refundSource).not.toContain("db.order.update");
  });

  it("resolves refund lines against remaining unrefunded quantity, not the original quantity (OMS-006)", () => {
    const items = [
      { id: "item-1", variantId: "v1", quantity: 5, refundedQuantity: 2, unitPrice: 100 },
      { id: "item-2", variantId: "v2", quantity: 3, refundedQuantity: 0, unitPrice: 50 },
      { id: "item-3", variantId: "v3", quantity: 2, refundedQuantity: 2, unitPrice: 10 },
    ];

    // Omitting `requestedLines` refunds every item's remaining quantity —
    // item-3 (fully refunded already) is correctly excluded entirely.
    expect(resolveRefundLines({ items })).toEqual([
      { orderItemId: "item-1", variantId: "v1", quantity: 3, unitPrice: 100 },
      { orderItemId: "item-2", variantId: "v2", quantity: 3, unitPrice: 50 },
    ]);

    // An explicit partial selection refunds only that item/quantity.
    expect(
      resolveRefundLines({
        items,
        requestedLines: [{ orderItemId: "item-1", quantity: 1 }],
      }),
    ).toEqual([
      { orderItemId: "item-1", variantId: "v1", quantity: 1, unitPrice: 100 },
    ]);

    // Requesting more than remains unrefunded is rejected, not silently
    // clamped — a real over-refund attempt must be a loud error.
    expect(() =>
      resolveRefundLines({
        items,
        requestedLines: [{ orderItemId: "item-1", quantity: 10 }],
      }),
    ).toThrow(/נותרו לזיכוי 3/);

    // The same order item can't appear twice in one refund request.
    expect(() =>
      resolveRefundLines({
        items,
        requestedLines: [
          { orderItemId: "item-1", quantity: 1 },
          { orderItemId: "item-1", quantity: 1 },
        ],
      }),
    ).toThrow(/יותר מפעם אחת/);

    // An item id that isn't on the order at all is rejected.
    expect(() =>
      resolveRefundLines({
        items,
        requestedLines: [{ orderItemId: "not-real", quantity: 1 }],
      }),
    ).toThrow(/לא נמצא/);
  });

  it("keeps the shipment-notification idempotency key stable across retries (I-08)", () => {
    // A real bug: this key used to embed Date.now(), so a webhook/EDI retry
    // for the same order+status produced a fresh key every call, defeating
    // createOutboxEvent's upsert-by-idempotencyKey dedupe entirely -- every
    // retry sent a second "your order shipped" email. The key must depend
    // only on stable identifiers (order id + shipment status), never on wall
    // clock time or any other per-call-unique value.
    const source = read("src/server/services/admin-commerce.ts");
    const shipmentSource = getFunctionSource(source, "upsertAdminShipment");
    const idempotencyKeyLine = shipmentSource
      .split("\n")
      .find((line) => line.includes("idempotencyKey:"));

    expect(idempotencyKeyLine).toBeDefined();
    expect(idempotencyKeyLine).toContain("shipment:${order.id}:${shipment.status}");
    expect(idempotencyKeyLine).not.toContain("Date.now()");
  });

  it("clears a media asset's approval rather than leaving it stale (B-07)", () => {
    // Unchecking "approve" in the admin UI must revoke a prior approval, not
    // silently leave a stale approvedAt/approvedBy from before the toggle.
    const source = read("src/server/services/admin-commerce.ts");
    const mediaSource = getFunctionSource(
      source,
      "updateAdminProductMediaAsset",
    );

    expect(mediaSource).toContain("approvedAt: parsed.approve ? new Date() : null");
    expect(mediaSource).toContain(
      "approvedBy: parsed.approve ? input.adminUserId : null",
    );
    expect(mediaSource).toContain("writeAdminAudit");
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
