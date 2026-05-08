import { describe, expect, it } from "vitest";

import {
  assertLocalSearchAllowed,
  paginateSearchHits,
  normalizeSearchPagination,
} from "./search";

describe("search adapter config", () => {
  it("allows the local catalog fallback when Typesense is not configured", () => {
    expect(() =>
      assertLocalSearchAllowed({
        NODE_ENV: "production",
        TYPESENSE_API_KEY: undefined,
        TYPESENSE_HOST: undefined,
      }),
    ).not.toThrow();
  });

  it("allows Typesense when both required credentials are configured", () => {
    expect(() =>
      assertLocalSearchAllowed({
        NODE_ENV: "production",
        TYPESENSE_API_KEY: "typesense-key",
        TYPESENSE_HOST: "search.example.com",
      }),
    ).not.toThrow();
  });

  it("blocks incomplete Typesense configuration", () => {
    expect(() =>
      assertLocalSearchAllowed({
        NODE_ENV: "production",
        TYPESENSE_API_KEY: undefined,
        TYPESENSE_HOST: "search.example.com",
      }),
    ).toThrow(/Typesense search configuration is incomplete/);

    expect(() =>
      assertLocalSearchAllowed({
        NODE_ENV: "development",
        TYPESENSE_API_KEY: "typesense-key",
        TYPESENSE_HOST: undefined,
      }),
    ).toThrow(/Typesense search configuration is incomplete/);
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
