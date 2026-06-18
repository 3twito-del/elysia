import { describe, expect, it } from "vitest";

import {
  getProductsCollectionName,
  shouldUseLocalSearchFallback,
  paginateSearchHits,
  normalizeSearchPagination,
  shouldFallbackToLocalSearchPage,
} from "./search";

describe("search adapter config", () => {
  it("uses the local catalog fallback when Typesense credentials are absent", () => {
    expect(
      shouldUseLocalSearchFallback({
        NODE_ENV: "development",
        TYPESENSE_API_KEY: undefined,
        TYPESENSE_HOST: undefined,
      }),
    ).toBe(true);

    expect(
      shouldUseLocalSearchFallback({
        NODE_ENV: "test",
        TYPESENSE_API_KEY: undefined,
        TYPESENSE_HOST: undefined,
      }),
    ).toBe(true);

    expect(
      shouldUseLocalSearchFallback({
        NODE_ENV: "production",
        TYPESENSE_API_KEY: undefined,
        TYPESENSE_HOST: undefined,
      }),
    ).toBe(true);
  });

  it("uses Typesense when production credentials are configured", () => {
    expect(
      shouldUseLocalSearchFallback({
        NODE_ENV: "production",
        TYPESENSE_API_KEY: "typesense-key",
        TYPESENSE_HOST: "search.example.com",
      }),
    ).toBe(false);

    expect(
      shouldUseLocalSearchFallback({
        NODE_ENV: "production",
        TYPESENSE_API_KEY: "typesense-key",
        TYPESENSE_HOST: undefined,
      }),
    ).toBe(true);
  });

  it("names semantic Typesense collections by embedding model and dimension", () => {
    expect(getProductsCollectionName("cloudflare:@cf/baai/bge-m3", 1024)).toBe(
      "products_semantic_cf_baai_bge_m3_1024_v1",
    );
  });
});

describe("search pagination", () => {
  it("normalizes invalid page input to a bounded default", () => {
    expect(normalizeSearchPagination({ page: -1, perPage: 999 })).toEqual({
      page: 1,
      perPage: 48,
    });

    expect(normalizeSearchPagination({ page: 2, perPage: 12 })).toEqual({
      page: 2,
      perPage: 12,
    });
  });

  it("slices local search results without changing the source list", () => {
    const hits = Array.from({ length: 30 }, (_, index) => index + 1);

    expect(
      paginateSearchHits(
        hits,
        normalizeSearchPagination({ page: 2, perPage: 10 }),
      ),
    ).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
    expect(hits).toHaveLength(30);
  });

  it("clamps local search pagination to the last available page", () => {
    const hits = Array.from({ length: 15 }, (_, index) => index + 1);

    expect(
      paginateSearchHits(
        hits,
        normalizeSearchPagination({ page: 99, perPage: 10 }),
      ),
    ).toEqual([11, 12, 13, 14, 15]);
  });
});

describe("typesense page reconciliation", () => {
  it("keeps Typesense results when every indexed hit resolves to a catalog product", () => {
    expect(
      shouldFallbackToLocalSearchPage({
        found: 24,
        indexedHits: 24,
        page: 1,
        perPage: 24,
        resolvedHits: 24,
      }),
    ).toBe(false);
  });

  it("keeps short final Typesense pages when the result total explains them", () => {
    expect(
      shouldFallbackToLocalSearchPage({
        found: 25,
        indexedHits: 1,
        page: 2,
        perPage: 24,
        resolvedHits: 1,
      }),
    ).toBe(false);
  });

  it("falls back to local search when the indexed page contains stale catalog slugs", () => {
    expect(
      shouldFallbackToLocalSearchPage({
        found: 24,
        indexedHits: 24,
        page: 1,
        perPage: 24,
        resolvedHits: 1,
      }),
    ).toBe(true);
  });

  it("falls back to local search when Typesense returns fewer hits than the reported page should contain", () => {
    expect(
      shouldFallbackToLocalSearchPage({
        found: 300,
        indexedHits: 1,
        page: 1,
        perPage: 24,
        resolvedHits: 1,
      }),
    ).toBe(true);
  });

  it("falls back to local search when Typesense reports matches for an empty indexed page", () => {
    expect(
      shouldFallbackToLocalSearchPage({
        found: 24,
        indexedHits: 0,
        page: 99,
        perPage: 24,
        resolvedHits: 0,
      }),
    ).toBe(true);
  });

  it("does not fall back for genuinely empty searches", () => {
    expect(
      shouldFallbackToLocalSearchPage({
        found: 0,
        indexedHits: 0,
        page: 1,
        perPage: 24,
        resolvedHits: 0,
      }),
    ).toBe(false);
  });
});
