import { describe, expect, it, vi } from "vitest";

type CatalogFilterInput = {
  category?: string;
  maxPrice?: number;
  query?: string;
};

const typesenseMocks = vi.hoisted(() => ({
  collectionExists: vi.fn(),
  documentSearch: vi.fn(),
  multiSearchPerform: vi.fn(),
}));

const catalogMocks = vi.hoisted(() => {
  const products = [
    createCatalogProduct({
      name: "Venus ring",
      popularityScore: 8,
      slug: "venus-ring",
    }),
    createCatalogProduct({
      categorySlug: "necklaces",
      categoryName: "Necklaces",
      name: "Luna necklace",
      popularityScore: 4,
      slug: "luna-necklace",
    }),
  ];

  function applyCatalogFilters(input: CatalogFilterInput) {
    const query = input.query?.trim().toLowerCase();

    return products
      .filter((product) =>
        input.category ? product.categorySlug === input.category : true,
      )
      .filter((product) =>
        input.maxPrice ? product.price <= input.maxPrice : true,
      )
      .filter((product) =>
        query
          ? [
              product.name,
              product.shortDescription,
              product.description,
              product.categoryName,
              product.material,
              product.stone,
              product.collection,
              ...product.tags,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase()
              .includes(query)
          : true,
      );
  }

  return {
    filterCatalogProducts: vi.fn(
      (items: typeof products, _input: CatalogFilterInput = {}) => items,
    ),
    getCatalogCategories: vi.fn(async () => [
      {
        description: "Rings",
        image: "/rings.jpg",
        imageUrl: "/rings.jpg",
        name: "Rings",
        slug: "rings",
      },
      {
        description: "Necklaces",
        image: "/necklaces.jpg",
        imageUrl: "/necklaces.jpg",
        name: "Necklaces",
        slug: "necklaces",
      },
    ]),
    getCatalogFacets: vi.fn(async () => ({
      collections: ["Signature"],
      colors: [],
      giftTags: [],
      materials: ["Gold"],
      priceRange: { min: 100, max: 200 },
      stones: ["Diamond"],
      styles: ["Signature"],
    })),
    listCatalogProducts: vi.fn(async () => products),
    searchCatalogProducts: vi.fn(async (input: CatalogFilterInput = {}) =>
      applyCatalogFilters(input),
    ),
  };
});

vi.mock("~/env", () => ({
  env: {
    NODE_ENV: "production",
    TYPESENSE_API_KEY: "typesense-key",
    TYPESENSE_HOST: "typesense.example.com",
    TYPESENSE_PORT: 443,
    TYPESENSE_PROTOCOL: "https",
  },
}));

vi.mock("typesense", () => ({
  Client: class {
    collections = vi.fn(() => ({
      documents: vi.fn(() => ({
        search: typesenseMocks.documentSearch,
      })),
      exists: typesenseMocks.collectionExists,
    }));

    multiSearch = {
      perform: typesenseMocks.multiSearchPerform,
    };
  },
}));

vi.mock("~/server/ai/search-intent", () => ({
  resolveSemanticSearchIntent: vi.fn(async () => ({
    excludedTerms: [],
    hardFilters: {},
    lexicalQuery: undefined,
    semanticQuery: undefined,
    softSignals: [],
  })),
}));

vi.mock("~/server/services/search-embeddings", () => ({
  calculateEmbeddingSimilarity: vi.fn(() => 0),
  embedSearchQuery: vi.fn(async () => undefined),
  ensureProductSearchEmbeddings: vi.fn(async () => ({
    dimension: 3,
    embedded: 0,
    embeddingsBySlug: new Map(),
    model: "test-model",
  })),
  getSearchEmbeddingConfig: vi.fn(() => ({
    dimension: 3,
    enabled: false,
    model: "test-model",
  })),
  loadStoredProductSearchEmbeddings: vi.fn(async () => ({
    dimension: 3,
    embedded: 0,
    embeddingsBySlug: new Map(),
    model: "test-model",
  })),
}));

vi.mock("~/server/services/catalog", () => catalogMocks);

import { searchProvider } from "./search";

describe("search provider fallback", () => {
  it("falls back to local catalog browse when Typesense keyword search is forbidden", async () => {
    typesenseMocks.collectionExists.mockResolvedValue(true);
    typesenseMocks.documentSearch.mockRejectedValue(
      Object.assign(new Error("Request failed with HTTP code 403"), {
        httpStatus: 403,
      }),
    );

    const result = await searchProvider.searchProducts({ perPage: 12 });

    expect(result.engine).toBe("local");
    expect(result.mode).toBe("classic");
    expect(result.total).toBe(2);
    expect(result.hits.map((hit) => hit.slug)).toEqual([
      "venus-ring",
      "luna-necklace",
    ]);
    expect(typesenseMocks.documentSearch).toHaveBeenCalled();
  });
});

function createCatalogProduct(input: {
  categoryName?: string;
  categorySlug?: string;
  name: string;
  popularityScore: number;
  slug: string;
}) {
  return {
    availabilityMode: "READY_TO_ORDER",
    categoryName: input.categoryName ?? "Rings",
    categorySlug: input.categorySlug ?? "rings",
    collection: "Signature",
    collections: ["Signature"],
    commerceHighlights: [],
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    description: `${input.name} description`,
    image: "/product.jpg",
    images: ["/product.jpg"],
    inventory: { online: 2 },
    material: "Gold",
    metalColors: [],
    name: input.name,
    popularityScore: input.popularityScore,
    price: 100,
    requiresSeparateCheckout: false,
    shortDescription: `${input.name} short description`,
    sizes: [],
    sku: input.slug.toUpperCase(),
    slug: input.slug,
    stone: "Diamond",
    tags: ["signature"],
    variants: [],
  };
}
