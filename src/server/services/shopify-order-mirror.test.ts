import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  shopifyOrderMirrorUpsert: vi.fn(),
}));

vi.mock("~/server/db", () => ({
  db: {
    shopifyOrderMirror: {
      upsert: dbMocks.shopifyOrderMirrorUpsert,
    },
  },
}));

import { mirrorShopifyOrderWebhook } from "./shopify-order-mirror";

type ShopifyOrderMirrorUpsertInput = {
  create: Record<string, unknown>;
  update: Record<string, unknown>;
  where: { shopifyOrderId: string };
};

describe("Shopify order mirror", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mirrors Shopify order webhooks without creating local orders", async () => {
    dbMocks.shopifyOrderMirrorUpsert.mockResolvedValueOnce({
      customerEmail: "buyer@example.com",
      id: "mirror_1",
      shopifyOrderId: "gid://shopify/Order/123",
      shopifyOrderName: "#1001",
      total: { toString: () => "189.90" },
    });

    await expect(
      mirrorShopifyOrderWebhook({
        admin_graphql_api_id: "gid://shopify/Order/123",
        currency: "ILS",
        customer: { email: "BUYER@example.com" },
        current_total_price: "189.9",
        financial_status: "paid",
        fulfillment_status: null,
        line_items: [
          {
            quantity: 1,
            sku: "SUP-RING-54",
            supplier_key: "supplier-a",
            title: "Supplier Ring",
          },
        ],
        name: "#1001",
      }),
    ).resolves.toEqual({
      customerEmail: "buyer@example.com",
      orderMirrorId: "mirror_1",
      shopifyOrderId: "gid://shopify/Order/123",
      shopifyOrderName: "#1001",
      total: "189.90",
    });

    const upsertInput = dbMocks.shopifyOrderMirrorUpsert.mock.calls[0]?.[0] as
      | ShopifyOrderMirrorUpsertInput
      | undefined;

    expect(upsertInput).toBeDefined();
    expect(upsertInput?.where).toEqual({
      shopifyOrderId: "gid://shopify/Order/123",
    });
    expect(upsertInput?.create).toMatchObject({
      customerEmail: "buyer@example.com",
      financialStatus: "paid",
      shopifyOrderId: "gid://shopify/Order/123",
      supplierKey: "supplier-a",
      total: "189.90",
    });
    expect(upsertInput?.update).toMatchObject({
      customerEmail: "buyer@example.com",
      financialStatus: "paid",
      supplierKey: "supplier-a",
      total: "189.90",
    });
  });
});
