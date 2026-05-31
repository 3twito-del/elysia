import { createHmac, timingSafeEqual } from "node:crypto";

import { z } from "zod";

import { env } from "~/env";

export type ShopifyDropshipEnv = {
  NODE_ENV: string;
  SHOPIFY_ADMIN_ACCESS_TOKEN?: string;
  SHOPIFY_API_VERSION?: string;
  SHOPIFY_CLIENT_ID?: string;
  SHOPIFY_CLIENT_SECRET?: string;
  SHOPIFY_DROPSHIP_ENABLED?: string;
  SHOPIFY_STORE_DOMAIN?: string;
  SHOPIFY_STOREFRONT_ACCESS_TOKEN?: string;
  SHOPIFY_WEBHOOK_SECRET?: string;
};

export type ShopifyProductImage = {
  altText?: string;
  height?: number;
  url: string;
  width?: number;
};

export type ShopifyProductVariant = {
  availableForSale: boolean;
  compareAtAmount?: number;
  currencyCode: string;
  id: string;
  priceAmount: number;
  selectedOptions: Array<{
    name: string;
    value: string;
  }>;
  sku?: string;
  title: string;
};

export type ShopifyProduct = {
  description: string;
  handle: string;
  id: string;
  images: ShopifyProductImage[];
  productType?: string;
  tags: string[];
  title: string;
  variants: ShopifyProductVariant[];
  vendor?: string;
};

export type ShopifyCatalogPage = {
  hasNextPage: boolean;
  products: ShopifyProduct[];
};

export type ShopifyCartLineInput = {
  merchandiseId: string;
  quantity: number;
};

export type ShopifyCartCheckout = {
  checkoutUrl: string;
  cartId: string;
};

export interface ShopifyDropshipProvider {
  createCart(input: {
    lines: ShopifyCartLineInput[];
  }): Promise<ShopifyCartCheckout>;
  isConfigured(): boolean;
  isEnabled(): boolean;
  listProducts(input?: { first?: number }): Promise<ShopifyCatalogPage>;
}

export const SHOPIFY_DROPSHIP_DISABLED_ERROR =
  "Shopify dropshipping is disabled. Set SHOPIFY_DROPSHIP_ENABLED=true before using Shopify catalog operations.";

export const SHOPIFY_DROPSHIP_CONFIG_ERROR =
  "Shopify dropshipping requires SHOPIFY_STORE_DOMAIN and Shopify API credentials.";

export const SHOPIFY_STOREFRONT_TOKEN_ERROR =
  "Shopify checkout requires SHOPIFY_STOREFRONT_ACCESS_TOKEN or a Dev Dashboard app with Storefront unauthenticated scopes.";

const storefrontProductResponseSchema = z.object({
  data: z
    .object({
      products: z.object({
        edges: z.array(
          z.object({
            node: z.object({
              description: z.string().default(""),
              featuredImage: z
                .object({
                  altText: z.string().nullable(),
                  height: z.number().nullable(),
                  url: z.string(),
                  width: z.number().nullable(),
                })
                .nullable(),
              handle: z.string(),
              id: z.string(),
              images: z.object({
                edges: z.array(
                  z.object({
                    node: z.object({
                      altText: z.string().nullable(),
                      height: z.number().nullable(),
                      url: z.string(),
                      width: z.number().nullable(),
                    }),
                  }),
                ),
              }),
              productType: z.string().nullable(),
              tags: z.array(z.string()),
              title: z.string(),
              variants: z.object({
                edges: z.array(
                  z.object({
                    node: z.object({
                      availableForSale: z.boolean(),
                      compareAtPrice: z
                        .object({
                          amount: z.string(),
                          currencyCode: z.string(),
                        })
                        .nullable(),
                      id: z.string(),
                      price: z.object({
                        amount: z.string(),
                        currencyCode: z.string(),
                      }),
                      selectedOptions: z.array(
                        z.object({
                          name: z.string(),
                          value: z.string(),
                        }),
                      ),
                      sku: z.string().nullable(),
                      title: z.string(),
                    }),
                  }),
                ),
              }),
              vendor: z.string().nullable(),
            }),
          }),
        ),
        pageInfo: z.object({
          hasNextPage: z.boolean(),
        }),
      }),
    })
    .optional(),
  errors: z
    .array(
      z.object({
        message: z.string(),
      }),
    )
    .optional(),
});

const adminProductResponseSchema = z.object({
  data: z
    .object({
      products: z.object({
        edges: z.array(
          z.object({
            node: z.object({
              descriptionHtml: z.string().default(""),
              featuredImage: z
                .object({
                  altText: z.string().nullable(),
                  height: z.number().nullable(),
                  url: z.string(),
                  width: z.number().nullable(),
                })
                .nullable(),
              handle: z.string(),
              id: z.string(),
              images: z.object({
                edges: z.array(
                  z.object({
                    node: z.object({
                      altText: z.string().nullable(),
                      height: z.number().nullable(),
                      url: z.string(),
                      width: z.number().nullable(),
                    }),
                  }),
                ),
              }),
              productType: z.string().nullable(),
              tags: z.array(z.string()),
              title: z.string(),
              variants: z.object({
                edges: z.array(
                  z.object({
                    node: z.object({
                      compareAtPrice: z.string().nullable(),
                      id: z.string(),
                      price: z.string(),
                      selectedOptions: z.array(
                        z.object({
                          name: z.string(),
                          value: z.string(),
                        }),
                      ),
                      sku: z.string().nullable(),
                      title: z.string(),
                    }),
                  }),
                ),
              }),
              vendor: z.string().nullable(),
            }),
          }),
        ),
        pageInfo: z.object({
          hasNextPage: z.boolean(),
        }),
      }),
    })
    .optional(),
  errors: z
    .array(
      z.object({
        message: z.string(),
      }),
    )
    .optional(),
});

const storefrontProductsQuery = `#graphql
  query DropshipProducts($first: Int!) {
    products(first: $first) {
      edges {
        node {
          id
          handle
          title
          description
          vendor
          productType
          tags
          featuredImage {
            url
            altText
            width
            height
          }
          images(first: 6) {
            edges {
              node {
                url
                altText
                width
                height
              }
            }
          }
          variants(first: 50) {
            edges {
              node {
                id
                sku
                title
                availableForSale
                selectedOptions {
                  name
                  value
                }
                price {
                  amount
                  currencyCode
                }
                compareAtPrice {
                  amount
                  currencyCode
                }
              }
            }
          }
        }
      }
      pageInfo {
        hasNextPage
      }
    }
  }
`;

const adminProductsQuery = `#graphql
  query DropshipAdminProducts($first: Int!) {
    products(first: $first) {
      edges {
        node {
          id
          handle
          title
          descriptionHtml
          vendor
          productType
          tags
          featuredImage {
            url
            altText
            width
            height
          }
          images(first: 6) {
            edges {
              node {
                url
                altText
                width
                height
              }
            }
          }
          variants(first: 50) {
            edges {
              node {
                id
                sku
                title
                selectedOptions {
                  name
                  value
                }
                price
                compareAtPrice
              }
            }
          }
        }
      }
      pageInfo {
        hasNextPage
      }
    }
  }
`;

const storefrontCartCreateMutation = `#graphql
  mutation DropshipCartCreate($lines: [CartLineInput!]!) {
    cartCreate(input: { lines: $lines }) {
      cart {
        id
        checkoutUrl
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const storefrontCartCreateResponseSchema = z.object({
  data: z
    .object({
      cartCreate: z.object({
        cart: z
          .object({
            checkoutUrl: z.string().url(),
            id: z.string(),
          })
          .nullable(),
        userErrors: z.array(
          z.object({
            field: z.array(z.string()).nullable(),
            message: z.string(),
          }),
        ),
      }),
    })
    .optional(),
  errors: z
    .array(
      z.object({
        message: z.string(),
      }),
    )
    .optional(),
});

const adminTokenResponseSchema = z.object({
  access_token: z.string().min(1),
  expires_in: z.number().int().positive().optional(),
  scope: z.string().optional(),
});

const storefrontTokenCreateResponseSchema = z.object({
  data: z
    .object({
      storefrontAccessTokenCreate: z.object({
        storefrontAccessToken: z
          .object({
            accessToken: z.string().min(1),
          })
          .nullable(),
        userErrors: z.array(
          z.object({
            field: z.array(z.string()).nullable(),
            message: z.string(),
          }),
        ),
      }),
    })
    .optional(),
  errors: z
    .array(
      z.object({
        message: z.string(),
      }),
    )
    .optional(),
});

const storefrontTokenCreateMutation = `#graphql
  mutation DropshipStorefrontTokenCreate($input: StorefrontAccessTokenInput!) {
    storefrontAccessTokenCreate(input: $input) {
      storefrontAccessToken {
        accessToken
      }
      userErrors {
        field
        message
      }
    }
  }
`;

class StorefrontShopifyDropshipProvider implements ShopifyDropshipProvider {
  private adminToken?: string;
  private adminTokenExpiresAt = 0;
  private generatedStorefrontToken?: string;

  constructor(private readonly config: ShopifyDropshipEnv = env) {}

  isEnabled() {
    return isTruthy(this.config.SHOPIFY_DROPSHIP_ENABLED);
  }

  isConfigured() {
    const hasClientCredentials = Boolean(
      this.config.SHOPIFY_CLIENT_ID?.trim() &&
      this.config.SHOPIFY_CLIENT_SECRET?.trim(),
    );

    return Boolean(
      this.config.SHOPIFY_STORE_DOMAIN?.trim() &&
      [
        this.config.SHOPIFY_STOREFRONT_ACCESS_TOKEN?.trim(),
        this.config.SHOPIFY_ADMIN_ACCESS_TOKEN?.trim(),
        hasClientCredentials,
      ].some(Boolean),
    );
  }

  async listProducts(input: { first?: number } = {}) {
    if (!this.isEnabled()) {
      throw new Error(SHOPIFY_DROPSHIP_DISABLED_ERROR);
    }

    if (!this.isConfigured()) {
      if (this.config.NODE_ENV === "production") {
        throw new Error(SHOPIFY_DROPSHIP_CONFIG_ERROR);
      }

      return { hasNextPage: false, products: [] };
    }

    if (!this.config.SHOPIFY_STOREFRONT_ACCESS_TOKEN?.trim()) {
      return this.listProductsWithAdminApi(input);
    }

    const response = await fetch(this.getStorefrontGraphqlUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token":
          this.config.SHOPIFY_STOREFRONT_ACCESS_TOKEN ?? "",
      },
      body: JSON.stringify({
        query: storefrontProductsQuery,
        variables: { first: input.first ?? 50 },
      }),
    });

    if (!response.ok) {
      throw new Error(`Shopify Storefront API failed with ${response.status}.`);
    }

    return mapStorefrontProductsResponse(await response.json());
  }

  async createCart(input: {
    lines: ShopifyCartLineInput[];
  }): Promise<ShopifyCartCheckout> {
    if (!this.isEnabled()) {
      throw new Error(SHOPIFY_DROPSHIP_DISABLED_ERROR);
    }

    if (input.lines.length === 0) {
      throw new Error("Shopify cart creation requires at least one line.");
    }

    if (!this.isConfigured()) {
      if (this.config.NODE_ENV === "production") {
        throw new Error(SHOPIFY_DROPSHIP_CONFIG_ERROR);
      }

      return {
        cartId: "mock_shopify_cart",
        checkoutUrl: "/checkout/mock-shopify-dropship",
      };
    }

    const storefrontToken = await this.getStorefrontAccessToken();
    const response = await fetch(this.getStorefrontGraphqlUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": storefrontToken,
      },
      body: JSON.stringify({
        query: storefrontCartCreateMutation,
        variables: { lines: input.lines },
      }),
    });

    if (!response.ok) {
      throw new Error(`Shopify Storefront API failed with ${response.status}.`);
    }

    return mapStorefrontCartCreateResponse(await response.json());
  }

  private async listProductsWithAdminApi(input: { first?: number }) {
    const response = await fetch(this.getAdminGraphqlUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": await this.getAdminAccessToken(),
      },
      body: JSON.stringify({
        query: adminProductsQuery,
        variables: { first: input.first ?? 50 },
      }),
    });

    if (!response.ok) {
      throw new Error(`Shopify Admin API failed with ${response.status}.`);
    }

    return mapAdminProductsResponse(await response.json());
  }

  private async getStorefrontAccessToken() {
    const configuredToken = this.config.SHOPIFY_STOREFRONT_ACCESS_TOKEN?.trim();
    if (configuredToken) return configuredToken;
    if (this.generatedStorefrontToken) return this.generatedStorefrontToken;

    const response = await fetch(this.getAdminGraphqlUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": await this.getAdminAccessToken(),
      },
      body: JSON.stringify({
        query: storefrontTokenCreateMutation,
        variables: {
          input: {
            title: "Elysia Storefront API",
          },
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Shopify Admin API failed with ${response.status}.`);
    }

    const token = mapStorefrontTokenCreateResponse(await response.json());
    this.generatedStorefrontToken = token;

    return token;
  }

  private async getAdminAccessToken() {
    const configuredToken = this.config.SHOPIFY_ADMIN_ACCESS_TOKEN?.trim();
    if (configuredToken) return configuredToken;

    if (this.adminToken && Date.now() < this.adminTokenExpiresAt - 60_000) {
      return this.adminToken;
    }

    const clientId = this.config.SHOPIFY_CLIENT_ID?.trim();
    const clientSecret = this.config.SHOPIFY_CLIENT_SECRET?.trim();

    if (!clientId || !clientSecret) {
      throw new Error(SHOPIFY_DROPSHIP_CONFIG_ERROR);
    }

    const response = await fetch(this.getAdminAccessTokenUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Shopify Admin token request failed with ${response.status}.`,
      );
    }

    const parsed = adminTokenResponseSchema.parse(await response.json());
    this.adminToken = parsed.access_token;
    this.adminTokenExpiresAt =
      Date.now() + (parsed.expires_in ?? 86_399) * 1000;

    return parsed.access_token;
  }

  private getAdminAccessTokenUrl() {
    const domain = normalizeShopifyDomain(this.config.SHOPIFY_STORE_DOMAIN);

    return `https://${domain}/admin/oauth/access_token`;
  }

  private getAdminGraphqlUrl() {
    const domain = normalizeShopifyDomain(this.config.SHOPIFY_STORE_DOMAIN);
    const version = this.config.SHOPIFY_API_VERSION?.trim() ?? "2026-04";

    return `https://${domain}/admin/api/${version}/graphql.json`;
  }

  private getStorefrontGraphqlUrl() {
    const domain = normalizeShopifyDomain(this.config.SHOPIFY_STORE_DOMAIN);
    const version = this.config.SHOPIFY_API_VERSION?.trim() ?? "2026-04";

    return `https://${domain}/api/${version}/graphql.json`;
  }
}

export const shopifyDropshipProvider: ShopifyDropshipProvider =
  new StorefrontShopifyDropshipProvider();

export function mapStorefrontProductsResponse(payload: unknown) {
  const parsed = storefrontProductResponseSchema.parse(payload);

  if (parsed.errors?.length) {
    throw new Error(
      `Shopify Storefront API returned errors: ${parsed.errors.map((error) => error.message).join("; ")}`,
    );
  }

  const products = parsed.data?.products.edges.map(({ node }) => {
    const images = node.images.edges.map(({ node: image }) => ({
      altText: image.altText ?? undefined,
      height: image.height ?? undefined,
      url: image.url,
      width: image.width ?? undefined,
    }));
    const featuredImage = node.featuredImage
      ? {
          altText: node.featuredImage.altText ?? undefined,
          height: node.featuredImage.height ?? undefined,
          url: node.featuredImage.url,
          width: node.featuredImage.width ?? undefined,
        }
      : undefined;

    return {
      description: node.description,
      handle: node.handle,
      id: node.id,
      images: images.length > 0 ? images : featuredImage ? [featuredImage] : [],
      productType: node.productType ?? undefined,
      tags: node.tags,
      title: node.title,
      variants: node.variants.edges.map(({ node: variant }) => ({
        availableForSale: variant.availableForSale,
        compareAtAmount: variant.compareAtPrice
          ? Number(variant.compareAtPrice.amount)
          : undefined,
        currencyCode: variant.price.currencyCode,
        id: variant.id,
        priceAmount: Number(variant.price.amount),
        selectedOptions: variant.selectedOptions,
        sku: variant.sku ?? undefined,
        title: variant.title,
      })),
      vendor: node.vendor ?? undefined,
    } satisfies ShopifyProduct;
  });

  return {
    hasNextPage: parsed.data?.products.pageInfo.hasNextPage ?? false,
    products: products ?? [],
  };
}

export function mapAdminProductsResponse(payload: unknown) {
  const parsed = adminProductResponseSchema.parse(payload);

  if (parsed.errors?.length) {
    throw new Error(
      `Shopify Admin API returned errors: ${parsed.errors.map((error) => error.message).join("; ")}`,
    );
  }

  const products = parsed.data?.products.edges.map(({ node }) => {
    const images = node.images.edges.map(({ node: image }) => ({
      altText: image.altText ?? undefined,
      height: image.height ?? undefined,
      url: image.url,
      width: image.width ?? undefined,
    }));
    const featuredImage = node.featuredImage
      ? {
          altText: node.featuredImage.altText ?? undefined,
          height: node.featuredImage.height ?? undefined,
          url: node.featuredImage.url,
          width: node.featuredImage.width ?? undefined,
        }
      : undefined;

    return {
      description: stripHtml(node.descriptionHtml),
      handle: node.handle,
      id: node.id,
      images: images.length > 0 ? images : featuredImage ? [featuredImage] : [],
      productType: node.productType ?? undefined,
      tags: node.tags,
      title: node.title,
      variants: node.variants.edges.map(({ node: variant }) => ({
        availableForSale: true,
        compareAtAmount: variant.compareAtPrice
          ? Number(variant.compareAtPrice)
          : undefined,
        currencyCode: "ILS",
        id: variant.id,
        priceAmount: Number(variant.price),
        selectedOptions: variant.selectedOptions,
        sku: variant.sku ?? undefined,
        title: variant.title,
      })),
      vendor: node.vendor ?? undefined,
    } satisfies ShopifyProduct;
  });

  return {
    hasNextPage: parsed.data?.products.pageInfo.hasNextPage ?? false,
    products: products ?? [],
  };
}

export function mapStorefrontTokenCreateResponse(payload: unknown) {
  const parsed = storefrontTokenCreateResponseSchema.parse(payload);

  if (parsed.errors?.length) {
    throw new Error(
      `${SHOPIFY_STOREFRONT_TOKEN_ERROR} Shopify returned: ${parsed.errors.map((error) => error.message).join("; ")}`,
    );
  }

  if (parsed.data?.storefrontAccessTokenCreate.userErrors.length) {
    throw new Error(
      `${SHOPIFY_STOREFRONT_TOKEN_ERROR} Shopify returned: ${parsed.data.storefrontAccessTokenCreate.userErrors.map((error) => error.message).join("; ")}`,
    );
  }

  const token = parsed.data?.storefrontAccessTokenCreate.storefrontAccessToken;

  if (!token) {
    throw new Error(SHOPIFY_STOREFRONT_TOKEN_ERROR);
  }

  return token.accessToken;
}

export function mapStorefrontCartCreateResponse(payload: unknown) {
  const parsed = storefrontCartCreateResponseSchema.parse(payload);

  if (parsed.errors?.length) {
    throw new Error(
      `Shopify Storefront API returned errors: ${parsed.errors.map((error) => error.message).join("; ")}`,
    );
  }

  if (parsed.data?.cartCreate.userErrors.length) {
    throw new Error(
      `Shopify cart creation failed: ${parsed.data.cartCreate.userErrors.map((error) => error.message).join("; ")}`,
    );
  }

  const cart = parsed.data?.cartCreate.cart;

  if (!cart) {
    throw new Error("Shopify cart creation did not return a cart.");
  }

  return {
    cartId: cart.id,
    checkoutUrl: cart.checkoutUrl,
  };
}

export function normalizeShopifyDomain(value: string | undefined) {
  return (value ?? "")
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/.*$/u, "");
}

export function getShopifyAdminOrderUrl(input: {
  shopDomain?: string;
  shopifyOrderId: string;
}) {
  const domain = normalizeShopifyDomain(input.shopDomain);
  const orderId = getShopifyNumericId(input.shopifyOrderId);

  if (!domain || !orderId) return undefined;

  return `https://${domain}/admin/orders/${orderId}`;
}

function getShopifyNumericId(value: string) {
  const trimmed = value.trim();
  const gidMatch = /\/(\d+)(?:\?.*)?$/u.exec(trimmed);

  if (gidMatch?.[1]) return gidMatch[1];
  if (/^\d+$/u.test(trimmed)) return trimmed;

  return undefined;
}

function stripHtml(value: string) {
  return value
    .replace(/<[^>]*>/gu, " ")
    .replace(/&nbsp;/gu, " ")
    .replace(/&amp;/gu, "&")
    .replace(/&quot;/gu, '"')
    .replace(/&#39;/gu, "'")
    .replace(/\s+/gu, " ")
    .trim();
}

export function verifyShopifyWebhookSignature(input: {
  rawBody: string;
  signature: string | null;
  secret?: string;
  nodeEnv?: string;
}) {
  const secret = input.secret ?? env.SHOPIFY_WEBHOOK_SECRET;

  if (!secret) {
    return (input.nodeEnv ?? env.NODE_ENV) !== "production";
  }

  if (!input.signature) return false;

  const expected = createHmac("sha256", secret)
    .update(input.rawBody, "utf8")
    .digest("base64");

  return safeEqualBase64(input.signature, expected);
}

function safeEqualBase64(actual: string, expected: string) {
  const actualBuffer = Buffer.from(actual, "base64");
  const expectedBuffer = Buffer.from(expected, "base64");

  return (
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  );
}

function isTruthy(value: string | undefined) {
  return value === "1" || value?.toLowerCase() === "true";
}
