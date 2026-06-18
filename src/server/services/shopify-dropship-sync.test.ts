import { describe, expect, it } from "vitest";

import {
  getShopifyDropshipSyncRevalidationInput,
  isShopifyDropshipSyncEnabled,
  mapShopifyProductsToImportPlan,
  syncShopifyDropshipCatalog,
} from "./shopify-dropship-sync";

describe("Shopify dropship sync", () => {
  it("keeps catalog writes disabled unless explicitly enabled", async () => {
    await expect(
      syncShopifyDropshipCatalog(
        { first: 1 },
        { SHOPIFY_DROPSHIP_SYNC_ENABLED: "false" },
      ),
    ).resolves.toMatchObject({
      imported: 0,
      ok: false,
      skipped: 0,
    });
  });

  it("parses the sync feature flag", () => {
    expect(
      isShopifyDropshipSyncEnabled({
        SHOPIFY_DROPSHIP_SYNC_ENABLED: "true",
      }),
    ).toBe(true);
    expect(
      isShopifyDropshipSyncEnabled({
        SHOPIFY_DROPSHIP_SYNC_ENABLED: "0",
      }),
    ).toBe(false);
  });

  it("maps Shopify products into local dropship import records", () => {
    const plan = mapShopifyProductsToImportPlan({
      supplierKey: "supplier-a",
      products: [
        {
          description: "Imported supplier product",
          handle: "supplier-ring",
          id: "gid://shopify/Product/1",
          images: [
            {
              altText: "Supplier ring on hand",
              height: 1200,
              url: "https://cdn.shopify.com/ring.jpg",
              width: 1200,
            },
            {
              altText: "Supplier ring detail",
              height: 1200,
              url: "https://cdn.shopify.com/ring-detail.jpg",
              width: 1200,
            },
            { url: "https://cdn.shopify.com/ring.jpg" },
          ],
          productType: "Rings",
          tags: ["dropship"],
          title: "Supplier Ring",
          variants: [
            {
              availableForSale: true,
              currencyCode: "ILS",
              id: "gid://shopify/ProductVariant/10",
              priceAmount: 299,
              selectedOptions: [{ name: "Size", value: "54" }],
              sku: "SUP-RING-54",
              title: "54",
            },
          ],
          vendor: "Supplier",
        },
      ],
    });

    expect(plan.skipped).toEqual([]);
    expect(plan.products[0]).toMatchObject({
      basePrice: 299,
      categorySlug: "rings",
      externalHandle: "supplier-ring",
      externalProductId: "gid://shopify/Product/1",
      images: [
        {
          altText: "Supplier ring on hand",
          height: 1200,
          url: "https://cdn.shopify.com/ring.jpg",
          width: 1200,
        },
        {
          altText: "Supplier ring detail",
          height: 1200,
          url: "https://cdn.shopify.com/ring-detail.jpg",
          width: 1200,
        },
      ],
      supplierKey: "supplier-a",
      variants: [
        {
          externalVariantId: "gid://shopify/ProductVariant/10",
          price: 299,
          sku: "SUP-RING-54",
        },
      ],
    });
  });

  it("skips Shopify products without priced variants", () => {
    const plan = mapShopifyProductsToImportPlan({
      supplierKey: "supplier-a",
      products: [
        {
          description: "",
          handle: "empty",
          id: "gid://shopify/Product/2",
          images: [],
          tags: [],
          title: "Empty",
          variants: [],
        },
      ],
    });

    expect(plan.products).toEqual([]);
    expect(plan.skipped).toEqual([
      {
        externalProductId: "gid://shopify/Product/2",
        reason: "No priced Shopify variants are available for import.",
      },
    ]);
  });

  it("derives catalog revalidation input from imported Shopify handles and categories", () => {
    expect(
      getShopifyDropshipSyncRevalidationInput({
        products: [
          {
            basePrice: 299,
            categorySlug: "rings",
            description: "Imported supplier product",
            externalHandle: "supplier-ring",
            externalProductId: "gid://shopify/Product/1",
            images: [],
            materialSlug: "supplier",
            name: "Supplier Ring",
            shortDescription: "Imported",
            sku: "SUP-RING-54",
            supplierKey: "supplier-a",
            tags: [],
            variants: [
              {
                externalVariantId: "gid://shopify/ProductVariant/10",
                name: "54",
                price: 299,
                sku: "SUP-RING-54",
              },
            ],
          },
        ],
        skipped: [],
      }),
    ).toEqual({
      categorySlugs: ["rings"],
      productSlugs: ["supplier-ring"],
    });
  });
});
