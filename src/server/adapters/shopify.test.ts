import { createHmac } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  getShopifyAdminOrderUrl,
  mapAdminProductsResponse,
  mapStorefrontCartCreateResponse,
  mapStorefrontProductsResponse,
  mapStorefrontTokenCreateResponse,
  normalizeShopifyDomain,
  verifyShopifyWebhookSignature,
} from "./shopify";

describe("Shopify dropship adapter", () => {
  it("normalizes Shopify store domains for Storefront API calls", () => {
    expect(
      normalizeShopifyDomain("https://elysia-supplier.myshopify.com/admin"),
    ).toBe("elysia-supplier.myshopify.com");
  });

  it("builds Shopify admin order links from GraphQL order IDs", () => {
    expect(
      getShopifyAdminOrderUrl({
        shopDomain: "https://elysia-supplier.myshopify.com/admin",
        shopifyOrderId: "gid://shopify/Order/1234567890",
      }),
    ).toBe("https://elysia-supplier.myshopify.com/admin/orders/1234567890");
    expect(
      getShopifyAdminOrderUrl({
        shopDomain: "elysia-supplier.myshopify.com",
        shopifyOrderId: "not-an-id",
      }),
    ).toBeUndefined();
  });

  it("maps Storefront product responses into dropship products", () => {
    const page = mapStorefrontProductsResponse({
      data: {
        products: {
          edges: [
            {
              node: {
                description: "Supplier product",
                featuredImage: null,
                handle: "supplier-ring",
                id: "gid://shopify/Product/1",
                images: {
                  edges: [
                    {
                      node: {
                        altText: "Supplier ring",
                        height: 1200,
                        url: "https://cdn.shopify.com/ring.jpg",
                        width: 1200,
                      },
                    },
                  ],
                },
                productType: "Rings",
                tags: ["dropship"],
                title: "Supplier Ring",
                variants: {
                  edges: [
                    {
                      node: {
                        availableForSale: true,
                        compareAtPrice: null,
                        id: "gid://shopify/ProductVariant/10",
                        price: {
                          amount: "129.90",
                          currencyCode: "ILS",
                        },
                        selectedOptions: [{ name: "Size", value: "54" }],
                        sku: "SUP-RING-54",
                        title: "54",
                      },
                    },
                  ],
                },
                vendor: "Supplier",
              },
            },
          ],
          pageInfo: { hasNextPage: false },
        },
      },
    });

    expect(page.products[0]).toMatchObject({
      handle: "supplier-ring",
      id: "gid://shopify/Product/1",
      title: "Supplier Ring",
      variants: [
        {
          currencyCode: "ILS",
          id: "gid://shopify/ProductVariant/10",
          priceAmount: 129.9,
          sku: "SUP-RING-54",
        },
      ],
    });
  });

  it("maps Admin product responses into dropship products", () => {
    const page = mapAdminProductsResponse({
      data: {
        products: {
          edges: [
            {
              node: {
                descriptionHtml: "<p>Supplier product</p>",
                featuredImage: null,
                handle: "supplier-necklace",
                id: "gid://shopify/Product/2",
                images: {
                  edges: [
                    {
                      node: {
                        altText: "Supplier necklace",
                        height: 1200,
                        url: "https://cdn.shopify.com/necklace.jpg",
                        width: 1200,
                      },
                    },
                  ],
                },
                productType: "Necklaces",
                tags: ["dropship"],
                title: "Supplier Necklace",
                variants: {
                  edges: [
                    {
                      node: {
                        compareAtPrice: "169.90",
                        id: "gid://shopify/ProductVariant/20",
                        price: "149.90",
                        selectedOptions: [{ name: "Color", value: "Gold" }],
                        sku: "SUP-NECK-GOLD",
                        title: "Gold",
                      },
                    },
                  ],
                },
                vendor: "Supplier",
              },
            },
          ],
          pageInfo: { hasNextPage: false },
        },
      },
    });

    expect(page.products[0]).toMatchObject({
      description: "Supplier product",
      handle: "supplier-necklace",
      id: "gid://shopify/Product/2",
      title: "Supplier Necklace",
      variants: [
        {
          compareAtAmount: 169.9,
          currencyCode: "ILS",
          id: "gid://shopify/ProductVariant/20",
          priceAmount: 149.9,
          sku: "SUP-NECK-GOLD",
        },
      ],
    });
  });

  it("maps Shopify cart creation responses to checkout redirects", () => {
    expect(
      mapStorefrontCartCreateResponse({
        data: {
          cartCreate: {
            cart: {
              checkoutUrl: "https://checkout.shopify.com/cart/123",
              id: "gid://shopify/Cart/1",
            },
            userErrors: [],
          },
        },
      }),
    ).toEqual({
      cartId: "gid://shopify/Cart/1",
      checkoutUrl: "https://checkout.shopify.com/cart/123",
    });
  });

  it("maps generated Storefront access tokens", () => {
    expect(
      mapStorefrontTokenCreateResponse({
        data: {
          storefrontAccessTokenCreate: {
            storefrontAccessToken: {
              accessToken: "storefront-token",
            },
            userErrors: [],
          },
        },
      }),
    ).toBe("storefront-token");
  });

  it("raises a helpful error when Storefront access is not scoped", () => {
    expect(() =>
      mapStorefrontTokenCreateResponse({
        errors: [
          { message: "Access denied for storefrontAccessTokenCreate field." },
        ],
      }),
    ).toThrow(/Storefront unauthenticated scopes/u);
  });

  it("verifies Shopify HMAC webhook signatures", () => {
    const rawBody = JSON.stringify({ id: 123, name: "#1001" });
    const signature = createHmac("sha256", "shopify-webhook-secret")
      .update(rawBody, "utf8")
      .digest("base64");

    expect(
      verifyShopifyWebhookSignature({
        rawBody,
        secret: "shopify-webhook-secret",
        signature,
      }),
    ).toBe(true);
    expect(
      verifyShopifyWebhookSignature({
        rawBody,
        secret: "shopify-webhook-secret",
        signature: "invalid",
      }),
    ).toBe(false);
  });
});
