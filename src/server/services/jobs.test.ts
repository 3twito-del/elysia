import { describe, expect, it } from "vitest";

import {
  canExpireReservationForOrderStatus,
  createOutboxEmailMessage,
  getOutboxPayloadString,
  redactJobRecipient,
} from "./jobs";

describe("outbox job helpers", () => {
  it("extracts string and numeric payload values", () => {
    expect(getOutboxPayloadString({ orderId: "order_1" }, "orderId")).toBe(
      "order_1",
    );
    expect(getOutboxPayloadString({ count: 12 }, "count")).toBe("12");
    expect(getOutboxPayloadString([], "count")).toBeNull();
  });

  it("expires only unpaid reservation orders", () => {
    expect(canExpireReservationForOrderStatus("PENDING_PAYMENT")).toBe(true);
    expect(canExpireReservationForOrderStatus("PAID")).toBe(false);
    expect(canExpireReservationForOrderStatus("COMPLETED")).toBe(false);
  });

  it("builds email messages from outbox payloads", () => {
    const message = createOutboxEmailMessage({
      customerEmail: "dana@example.com",
      orderNumber: "APH-20260428-AB12CD",
      template: "cart_checkout_created",
    });

    expect(message?.to).toBe("dana@example.com");
    expect(message?.subject).toContain("APH-20260428-AB12CD");
    expect(message?.body).toContain("cart_checkout_created");
  });

  it("skips email messages without a recipient", () => {
    expect(
      createOutboxEmailMessage({
        orderNumber: "APH-20260428-AB12CD",
      }),
    ).toBeNull();
  });

  it("redacts recipients before job metadata persistence", () => {
    expect(redactJobRecipient("dana@example.com")).toBe("d***@example.com");
    expect(redactJobRecipient("+972-50-123-4567")).toBe("***4567");
    expect(redactJobRecipient("")).toBe("[redacted]");
  });
});
