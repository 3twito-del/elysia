import { describe, expect, it } from "vitest";

import {
  evaluateShopifyIntegrationDrift,
  getExpectedShopifyOrderWebhookAddress,
} from "./shopify-integration-drift";

const EXPECTED_ADDRESS = "https://elysia-jewellery.com/api/webhooks/shopify/orders";

describe("Shopify integration drift (K-06)", () => {
  it("reports ok when every expected webhook is registered at the right address with all scopes granted", () => {
    const report = evaluateShopifyIntegrationDrift({
      expectedWebhookAddress: EXPECTED_ADDRESS,
      grantedScopes: ["read_products", "read_orders", "read_customers"],
      registeredWebhooks: [
        { address: EXPECTED_ADDRESS, topic: "orders/create" },
        { address: EXPECTED_ADDRESS, topic: "orders/updated" },
        { address: EXPECTED_ADDRESS, topic: "orders/cancelled" },
      ],
    });

    expect(report.ok).toBe(true);
    expect(report.webhooks.every((webhook) => webhook.status === "ok")).toBe(
      true,
    );
    expect(report.missingScopes).toEqual([]);
  });

  it("flags a missing webhook topic", () => {
    const report = evaluateShopifyIntegrationDrift({
      expectedWebhookAddress: EXPECTED_ADDRESS,
      grantedScopes: ["read_products", "read_orders"],
      registeredWebhooks: [
        { address: EXPECTED_ADDRESS, topic: "orders/create" },
        { address: EXPECTED_ADDRESS, topic: "orders/updated" },
      ],
    });

    expect(report.ok).toBe(false);
    expect(report.webhooks).toContainEqual({
      status: "missing",
      topic: "orders/cancelled",
    });
  });

  it("flags a webhook registered for the right topic but a stale/wrong address", () => {
    const report = evaluateShopifyIntegrationDrift({
      expectedWebhookAddress: EXPECTED_ADDRESS,
      grantedScopes: ["read_products", "read_orders"],
      registeredWebhooks: [
        { address: EXPECTED_ADDRESS, topic: "orders/create" },
        {
          address: "https://stale-preview-url.vercel.app/api/webhooks/shopify/orders",
          topic: "orders/updated",
        },
        { address: EXPECTED_ADDRESS, topic: "orders/cancelled" },
      ],
    });

    expect(report.ok).toBe(false);
    expect(report.webhooks).toContainEqual({
      registeredAddress:
        "https://stale-preview-url.vercel.app/api/webhooks/shopify/orders",
      status: "address-mismatch",
      topic: "orders/updated",
    });
  });

  it("flags a missing required access scope", () => {
    const report = evaluateShopifyIntegrationDrift({
      expectedWebhookAddress: EXPECTED_ADDRESS,
      grantedScopes: ["read_products"],
      registeredWebhooks: [
        { address: EXPECTED_ADDRESS, topic: "orders/create" },
        { address: EXPECTED_ADDRESS, topic: "orders/updated" },
        { address: EXPECTED_ADDRESS, topic: "orders/cancelled" },
      ],
    });

    expect(report.ok).toBe(false);
    expect(report.missingScopes).toEqual(["read_orders"]);
  });

  it("builds the expected webhook address from SITE_URL with a stable fallback", () => {
    expect(getExpectedShopifyOrderWebhookAddress()).toMatch(
      /\/api\/webhooks\/shopify\/orders$/u,
    );
  });
});
