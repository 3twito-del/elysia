import { beforeEach, describe, expect, it, vi } from "vitest";

import { resetRateLimitStateForTests } from "~/server/services/rate-limit";

const shopifyMocks = vi.hoisted(() => ({
  verifyShopifyWebhookSignature: vi.fn(),
}));
const mirrorMocks = vi.hoisted(() => ({
  mirrorShopifyOrderWebhook: vi.fn(),
}));
const webhookMocks = vi.hoisted(() => ({
  parseWebhookJson: vi.fn((rawBody: string) =>
    rawBody.trim() ? (JSON.parse(rawBody) as unknown) : {},
  ),
  recordWebhookEvent: vi.fn(),
}));

vi.mock("~/server/adapters/shopify", () => ({
  verifyShopifyWebhookSignature: shopifyMocks.verifyShopifyWebhookSignature,
}));

vi.mock("~/server/services/shopify-order-mirror", () => ({
  mirrorShopifyOrderWebhook: mirrorMocks.mirrorShopifyOrderWebhook,
}));

vi.mock("~/server/services/webhook-events", () => ({
  parseWebhookJson: webhookMocks.parseWebhookJson,
  recordWebhookEvent: webhookMocks.recordWebhookEvent,
}));

import { POST } from "./route";

describe("Shopify order webhook route", () => {
  beforeEach(() => {
    resetRateLimitStateForTests();
    vi.clearAllMocks();

    shopifyMocks.verifyShopifyWebhookSignature.mockReturnValue(true);
    mirrorMocks.mirrorShopifyOrderWebhook.mockResolvedValue({
      id: "mirror_1",
      shopifyOrderId: "gid://shopify/Order/123",
    });
    webhookMocks.recordWebhookEvent.mockResolvedValue({ id: "webhook_evt_1" });
  });

  it("returns a stable unauthorized response for invalid signatures", async () => {
    shopifyMocks.verifyShopifyWebhookSignature.mockReturnValue(false);

    const response = await POST(createShopifyWebhookRequest());

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "Invalid Shopify signature.",
    });
    expect(webhookMocks.recordWebhookEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "shopify",
        status: "FAILED",
        fallbackEventType: "shopify.orders.unverified",
      }),
    );
    expect(mirrorMocks.mirrorShopifyOrderWebhook).not.toHaveBeenCalled();
  });

  it("returns a redacted 503 when mirror processing fails", async () => {
    const errorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    mirrorMocks.mirrorShopifyOrderWebhook.mockRejectedValueOnce(
      new Error("admin token leaked"),
    );

    try {
      const response = await POST(createShopifyWebhookRequest());

      expect(response.status).toBe(503);
      await expect(response.json()).resolves.toEqual({
        ok: false,
        error: "Shopify webhook processing is unavailable.",
      });
      expect(webhookMocks.recordWebhookEvent).toHaveBeenCalledTimes(1);
      expect(webhookMocks.recordWebhookEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: "shopify",
          status: "RECEIVED",
          fallbackEventType: "shopify.orders.webhook",
        }),
      );
    } finally {
      errorSpy.mockRestore();
    }
  });
});

function createShopifyWebhookRequest() {
  return new Request("http://localhost/api/webhooks/shopify/orders", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": "203.0.113.72",
      "x-shopify-hmac-sha256": "test-signature",
    },
    body: JSON.stringify({
      id: 123,
      admin_graphql_api_id: "gid://shopify/Order/123",
      name: "#1001",
    }),
  });
}
