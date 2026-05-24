import { describe, expect, it } from "vitest";

import {
  createProductSearchHref,
  createSearchHref,
  dedupeRecoveryCandidates,
  getActiveSearchRefinementCount,
  getPaginationPages,
  normalizeBudgetAwareQuery,
  normalizeSearchInput,
  normalizeSearchView,
} from "./search-state";

const categories = [
  {
    slug: "rings",
    name: "Rings",
    description: "Fine rings",
    image: "/brand/rings.avif",
    imageUrl: "/brand/rings.avif",
  },
];

const facets = {
  collections: ["atelier"],
  materials: ["gold"],
  stones: ["diamond"],
  priceRange: {
    min: 100,
    max: 3000,
  },
};

describe("search state helpers", () => {
  it("normalizes URL params into a bounded product search input", () => {
    expect(
      normalizeSearchInput(
        {
          q: "  gift under 700  ",
          category: "rings",
          material: "gold",
          stone: "unknown",
          collection: "atelier",
          maxPrice: "700",
          availableOnly: "1",
          mode: "classic",
          page: "2",
          sort: "price-asc",
        },
        { categories, facets },
      ),
    ).toEqual({
      query: undefined,
      category: "rings",
      material: "gold",
      stone: undefined,
      collection: "atelier",
      maxPrice: 700,
      availableOnly: true,
      mode: "classic",
      page: 2,
      perPage: 24,
      sort: "price-asc",
    });
  });

  it("keeps non-budget search intent after extracting a price ceiling", () => {
    expect(normalizeBudgetAwareQuery("diamond ring under 700", 700)).toBe(
      "diamond ring",
    );
  });

  it("creates canonical search and product hrefs", () => {
    expect(
      createSearchHref({
        query: "ring",
        category: "rings",
        maxPrice: 700,
        availableOnly: true,
        mode: "classic",
        sort: "price-desc",
        view: "list",
        page: 3,
      }),
    ).toBe(
      "/search?q=ring&category=rings&maxPrice=700&availableOnly=1&sort=price-desc&mode=classic&view=list&page=3",
    );
    expect(createProductSearchHref("venus-ring")).toBe("/product/venus-ring");
    expect(
      createProductSearchHref("venus-ring", {
        query: "ring",
        position: 4,
      }),
    ).toBe("/product/venus-ring?q=ring&position=4");
  });

  it("counts active refinements without counting the query itself", () => {
    expect(
      getActiveSearchRefinementCount({
        query: "ring",
        category: "rings",
        maxPrice: 700,
        availableOnly: true,
        sort: "relevance",
        mode: "semantic",
      }),
    ).toBe(3);
  });

  it("dedupes recovery links and creates compact pagination windows", () => {
    expect(
      dedupeRecoveryCandidates([
        { href: "/search?q=ring", label: "query" },
        { href: "/search?q=ring", label: "duplicate" },
        { href: "/search", label: "all" },
      ]),
    ).toEqual([
      { href: "/search?q=ring", label: "query" },
      { href: "/search", label: "all" },
    ]);
    expect(getPaginationPages(5, 9)).toEqual([
      1,
      "ellipsis",
      4,
      5,
      6,
      "ellipsis",
      9,
    ]);
    expect(normalizeSearchView("list")).toBe("list");
    expect(normalizeSearchView("grid")).toBe("grid");
  });
});
