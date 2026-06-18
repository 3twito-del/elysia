import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  webhookEventUpsert: vi.fn(),
}));

const outboxMocks = vi.hoisted(() => ({
  createOutboxEvent: vi.fn(),
}));

vi.mock("~/server/db", () => ({
  db: {
    $transaction: dbMocks.transaction,
  },
}));

vi.mock("~/server/services/outbox", () => ({
  BUSINESS_EVENTS: {
    webhookReceived: "webhook.received",
  },
  createOutboxEvent: outboxMocks.createOutboxEvent,
}));

import {
  createWebhookErrorSummary,
  createWebhookExternalId,
  createWebhookSafeLogContext,
  getWebhookEventType,
  parseWebhookJson,
  recordWebhookEvent,
  redactWebhookPayload,
} from "./webhook-events";

describe("webhook event helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMocks.transaction.mockImplementation(async (callback: unknown) => {
      const transactionCallback = callback as (txClient: {
        webhookEvent: {
          upsert: typeof dbMocks.webhookEventUpsert;
        };
      }) => Promise<unknown>;

      return transactionCallback({
        webhookEvent: {
          upsert: dbMocks.webhookEventUpsert,
        },
      });
    });
    dbMocks.webhookEventUpsert.mockResolvedValue({ id: "webhook_evt_1" });
  });

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
        orderNumber: "ELY-1001",
        CardOwnerEmail: "customer@example.com",
        CardToken: "tok_123",
        nested: {
          phone: "0500000000",
          status: "approved",
        },
      }),
    ).toEqual({
      orderNumber: "ELY-1001",
      CardOwnerEmail: "[redacted]",
      CardToken: "[redacted]",
      nested: {
        phone: "[redacted]",
        status: "approved",
      },
    });
  });

  it("creates safe webhook log context without raw payload or error details", () => {
    const context = createWebhookSafeLogContext({
      fallbackEventType: "shopify.orders.webhook",
      payload: {
        admin_graphql_api_id: "gid://shopify/Order/123",
        email: "customer@example.com",
        signature: "payload-secret",
      },
      provider: "shopify",
      rawBody: JSON.stringify({
        email: "customer@example.com",
        signature: "payload-secret",
      }),
      stage: "processing",
      status: "FAILED",
    });

    expect(context.rawBodyHash).toMatch(/^[a-f0-9]{64}$/);
    expect(context).toEqual({
      eventType: "shopify.orders.webhook",
      payloadKeys: ["admin_graphql_api_id", "email", "signature"],
      provider: "shopify",
      rawBodyHash: context.rawBodyHash,
      stage: "processing",
      status: "FAILED",
    });
    expect(JSON.stringify(context)).not.toContain("customer@example.com");
    expect(JSON.stringify(context)).not.toContain("payload-secret");

    expect(createWebhookErrorSummary(new Error("admin token leaked"))).toEqual({
      name: "Error",
    });
  });

  it("uses stable record and outbox idempotency keys for replayed webhooks", async () => {
    const payload = {
      TransactionId: "cardcom_tx_1",
      providerPaymentId: "cardcom_payment_1",
      status: "captured",
    };
    const rawBody = JSON.stringify(payload);

    await recordWebhookEvent({
      fallbackEventType: "cardcom.webhook",
      payload,
      provider: "cardcom",
      rawBody,
      status: "PROCESSED",
    });
    await recordWebhookEvent({
      fallbackEventType: "cardcom.webhook",
      payload,
      provider: "cardcom",
      rawBody,
      status: "PROCESSED",
    });

    expect(dbMocks.webhookEventUpsert).toHaveBeenCalledTimes(2);
    const firstUpsert = dbMocks.webhookEventUpsert.mock.calls[0]?.[0] as {
      where: {
        provider_externalId: {
          externalId: string;
          provider: string;
        };
      };
    };
    const secondUpsert = dbMocks.webhookEventUpsert.mock.calls[1]?.[0] as {
      where: {
        provider_externalId: {
          externalId: string;
          provider: string;
        };
      };
    };

    expect(firstUpsert.where).toEqual(secondUpsert.where);
    expect(firstUpsert).toMatchObject({
      where: {
        provider_externalId: {
          externalId: "cardcom_tx_1",
          provider: "cardcom",
        },
      },
    });
    expect(outboxMocks.createOutboxEvent).toHaveBeenCalledTimes(2);
    expect(outboxMocks.createOutboxEvent.mock.calls[0]?.[1]).toMatchObject({
      aggregateId: "webhook_evt_1",
      idempotencyKey: "webhook.received:cardcom:cardcom_tx_1",
      type: "webhook.received",
    });
    expect(outboxMocks.createOutboxEvent.mock.calls[0]?.[1]).toEqual(
      outboxMocks.createOutboxEvent.mock.calls[1]?.[1],
    );
  });
});
