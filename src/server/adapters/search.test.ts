import { describe, expect, it } from "vitest";

import {
  getProductsCollectionName,
  shouldUseLocalSearchFallback,
  paginateSearchHits,
  normalizeSearchPagination,
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
