import { describe, expect, it } from "vitest";

import {
  createWebhookExternalId,
  getWebhookEventType,
  parseWebhookJson,
  redactWebhookPayload,
} from "./webhook-events";

describe("webhook event helpers", () => {
  it("parses invalid webhook JSON as an empty object", () => {
    expect(parseWebhookJson("{not-json")).toEqual({});
  });

  it("prefers provider payload ids over body hashes", () => {
    expect(
      createWebhookExternalId("cloudinary", "{}", {
        public_id: "product/venus",
      }),
    ).toBe("product/venus");
  });

  it("uses a deterministic fallback id and event type", () => {
    expect(createWebhookExternalId("cardcom", "{}", {})).toBe(
      createWebhookExternalId("cardcom", "{}", {}),
    );
    expect(getWebhookEventType({}, "cardcom.webhook")).toBe("cardcom.webhook");
  });

  it("redacts sensitive payment payload fields before persistence", () => {
    expect(
      redactWebhookPayload({
        orderNumber: "APH-1001",
        CardOwnerEmail: "customer@example.com",
        CardToken: "tok_123",
        nested: {
          phone: "0500000000",
          status: "approved",
        },
      }),
    ).toEqual({
      orderNumber: "APH-1001",
      CardOwnerEmail: "[redacted]",
      CardToken: "[redacted]",
      nested: {
        phone: "[redacted]",
        status: "approved",
      },
    });
  });
});
