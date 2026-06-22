import { describe, expect, it } from "vitest";

import {
  canExpireReservationForOrderStatus,
  createOutboxEmailMessage,
  getOutboxPayloadString,
  getPublicOutboxJobFailureMessage,
  redactJobRecipient,
} from "./jobs";
import { getOutboxRetryAvailableAt, getOutboxRetryDelayMs } from "./outbox";

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
      orderNumber: "ELY-20260428-AB12CD",
      template: "cart_checkout_created",
    });

    expect(message?.to).toBe("dana@example.com");
    expect(message?.subject).toContain("ELY-20260428-AB12CD");
    expect(message?.body).toContain("ELY-20260428-AB12CD");
    expect(message?.body).toContain(
      "https://elysia-jewellery.com/shipping-returns",
    );
    expect(message?.body).not.toContain("cart_checkout_created");
  });

  it("skips email messages without a recipient", () => {
    expect(
      createOutboxEmailMessage({
        orderNumber: "ELY-20260428-AB12CD",
      }),
    ).toBeNull();
  });

  it("redacts recipients before job metadata persistence", () => {
    expect(redactJobRecipient("dana@example.com")).toBe("d***@example.com");
    expect(redactJobRecipient("+972-50-123-4567")).toBe("***4567");
    expect(redactJobRecipient("")).toBe("[redacted]");
  });

  it("uses public retry copy for provider-backed job failures", () => {
    expect(
      getPublicOutboxJobFailureMessage("search.reindex_requested"),
    ).toContain("search provider is available");
    expect(getPublicOutboxJobFailureMessage("email.requested")).toContain(
      "email delivery is available",
    );
    expect(getPublicOutboxJobFailureMessage("unknown.event")).toBe(
      "Outbox job failed. It will retry when the processor is available.",
    );
  });

  it("keeps failed outbox retries bounded and jittered by event id", () => {
    const firstDelay = getOutboxRetryDelayMs({
      attempts: 1,
      seed: "outbox_event_1",
    });
    const sameFirstDelay = getOutboxRetryDelayMs({
      attempts: 1,
      seed: "outbox_event_1",
    });
    const otherFirstDelay = getOutboxRetryDelayMs({
      attempts: 1,
      seed: "outbox_event_2",
    });
    const laterDelay = getOutboxRetryDelayMs({
      attempts: 6,
      seed: "outbox_event_1",
    });

    expect(firstDelay).toBe(sameFirstDelay);
    expect(firstDelay).not.toBe(otherFirstDelay);
    expect(firstDelay).toBeGreaterThanOrEqual(2 * 60_000);
    expect(firstDelay).toBeLessThan(3 * 60_000);
    expect(laterDelay).toBeLessThanOrEqual(60 * 60_000);
    expect(laterDelay).toBeGreaterThan(firstDelay);
  });

  it("calculates retry timestamps from the provided clock", () => {
    const now = new Date("2026-06-01T10:00:00.000Z");
    const retryAt = getOutboxRetryAvailableAt({
      attempts: 2,
      now,
      seed: "outbox_event_1",
    });

    expect(retryAt.getTime()).toBe(
      now.getTime() +
        getOutboxRetryDelayMs({ attempts: 2, seed: "outbox_event_1" }),
    );
  });
});
