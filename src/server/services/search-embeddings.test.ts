import { describe, expect, it } from "vitest";

import {
  buildProductEmbeddingText,
  calculateEmbeddingSimilarity,
  createProductEmbeddingSourceHash,
  getSearchEmbeddingConfig,
} from "./search-embeddings";
import type { CatalogProduct } from "./catalog";

describe("search embeddings", () => {
  it("builds stable product text and source hashes for embedding reindex", () => {
    const product = makeProduct({
      name: "Noor Pearl Earrings",
      stone: "פנינה",
      tags: ["gift", "daily"],
    });
    const text = buildProductEmbeddingText(product);

    expect(text).toContain("Noor Pearl Earrings");
    expect(text).toContain("פנינה");
    expect(text).toContain("gift");
    expect(createProductEmbeddingSourceHash(product)).toHaveLength(64);
    expect(createProductEmbeddingSourceHash(product)).toBe(
      createProductEmbeddingSourceHash(product),
    );
  });

  it("normalizes cosine similarity to a safe score range", () => {
    expect(calculateEmbeddingSimilarity([1, 0], [1, 0])).toBe(1);
    expect(calculateEmbeddingSimilarity([1, 0], [0, 1])).toBe(0);
    expect(calculateEmbeddingSimilarity([1, 0], undefined)).toBe(0);
  });

  it("keeps semantic search enabled but provider-gated by default", () => {
    expect(
      getSearchEmbeddingConfig({
        AI_EMBEDDING_DIMENSIONS: 1024,
        AI_EMBEDDING_MODEL: "cloudflare:@cf/baai/bge-m3",
        AI_SEMANTIC_SEARCH_ENABLED: "true",
        GOOGLE_GENERATIVE_AI_API_KEY: undefined,
      }),
    ).toMatchObject({
      dimension: 1024,
      enabled: true,
      provider: "cloudflare",
      providerReady: false,
    });
  });

  it("marks Cloudflare embeddings ready only with account and token", () => {
    expect(
      getSearchEmbeddingConfig({
        AI_EMBEDDING_MODEL: "cloudflare:@cf/baai/bge-m3",
        AI_SEMANTIC_SEARCH_ENABLED: "true",
        CLOUDFLARE_ACCOUNT_ID: "account",
        CLOUDFLARE_AI_API_TOKEN: "token",
      }),
    ).toMatchObject({
      dimension: 1024,
      provider: "cloudflare",
      providerReady: true,
    });
  });
});

function makeProduct(overrides: Partial<CatalogProduct> = {}): CatalogProduct {
  return {
    availabilityMode: "READY_TO_ORDER",
    categoryName: "עגילים",
    categorySlug: "earrings",
    collection: "Gift Studio",
    collections: ["Gift Studio"],
    commerceHighlights: [],
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    description: "עגילים עדינים למתנה או ליום יום.",
    image: "/product.png",
    images: ["/product.png"],
    inventory: { online: 2 },
    material: "זהב צהוב 14K",
    metalColors: ["זהב צהוב"],
    name: "Product",
    popularityScore: 4,
    price: 690,
    shortDescription: "עגילים עדינים",
    sizes: [],
    sku: "SKU",
    slug: "product",
    tags: [],
    variants: [],
    ...overrides,
  };
}
