import { describe, expect, it } from "vitest";

import {
  computeLocalRelevanceScore,
  LOCAL_RELEVANCE_WEIGHTS,
} from "./search";
import type { CatalogProduct } from "~/server/services/catalog-types";

describe("computeLocalRelevanceScore", () => {
  it("ranks an exact name match above a partial name match", () => {
    const exact = createProduct({ name: "Venus" });
    const partial = createProduct({ name: "Venus Line Ring" });

    expect(computeLocalRelevanceScore(exact, "venus")).toBeGreaterThan(
      computeLocalRelevanceScore(partial, "venus"),
    );
  });

  it("gives exact intent the full name-exact weight, case-insensitively", () => {
    const product = createProduct({ name: "Venus" });

    expect(computeLocalRelevanceScore(product, "venus")).toBe(
      LOCAL_RELEVANCE_WEIGHTS.nameExact + LOCAL_RELEVANCE_WEIGHTS.available,
    );
  });

  it("ranks a name-starts-with match above a name-contains match", () => {
    const startsWith = createProduct({ name: "Venus Line Ring" });
    const contains = createProduct({ name: "Signature Venus Ring" });

    expect(computeLocalRelevanceScore(startsWith, "venus")).toBeGreaterThan(
      computeLocalRelevanceScore(contains, "venus"),
    );
  });

  it("ranks a name match above a match that only hits a tag or material", () => {
    const nameMatch = createProduct({ name: "Diamond Halo Ring" });
    const facetMatch = createProduct({
      material: "Diamond",
      name: "Signature Ring",
    });

    expect(computeLocalRelevanceScore(nameMatch, "diamond")).toBeGreaterThan(
      computeLocalRelevanceScore(facetMatch, "diamond"),
    );
  });

  it("ranks a facet match above a description-only match", () => {
    const facetMatch = createProduct({ tags: ["gift"] });
    const descriptionMatch = createProduct({
      description: "A perfect gift for any occasion.",
      shortDescription: "Elegant everyday piece.",
    });

    expect(computeLocalRelevanceScore(facetMatch, "gift")).toBeGreaterThan(
      computeLocalRelevanceScore(descriptionMatch, "gift"),
    );
  });

  it("ranks an available item above an otherwise identical unavailable one", () => {
    const available = createProduct({ inventory: { "online-service": 3 } });
    const unavailable = createProduct({ inventory: { "online-service": 0 } });

    expect(computeLocalRelevanceScore(available, "")).toBeGreaterThan(
      computeLocalRelevanceScore(unavailable, ""),
    );
  });

  it("treats a made-to-order product as available even with zero inventory", () => {
    const madeToOrder = createProduct({
      availabilityMode: "MADE_TO_ORDER",
      inventory: { "online-service": 0 },
    });

    expect(computeLocalRelevanceScore(madeToOrder, "")).toBe(
      LOCAL_RELEVANCE_WEIGHTS.available,
    );
  });

  it("returns zero for an empty query and no availability boost when out of stock", () => {
    const product = createProduct({ inventory: { "online-service": 0 } });

    expect(computeLocalRelevanceScore(product, "")).toBe(0);
  });
});

function createProduct(overrides: Partial<CatalogProduct> = {}): CatalogProduct {
  return {
    availabilityMode: "READY_TO_ORDER",
    categoryName: "Rings",
    categorySlug: "rings",
    collection: "Signature",
    collections: ["Signature"],
    commerceHighlights: [],
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    description: "A carefully finished piece.",
    image: "/product.jpg",
    images: ["/product.jpg"],
    inventory: { "online-service": 2 },
    material: "Gold",
    metalColors: [],
    name: "Signature Ring",
    popularityScore: 1,
    price: 500,
    requiresSeparateCheckout: false,
    shortDescription: "A signature piece.",
    sizes: [],
    sku: "TEST-SKU",
    slug: "test-product",
    stone: "Diamond",
    tags: [],
    variants: [],
    ...overrides,
  };
}
