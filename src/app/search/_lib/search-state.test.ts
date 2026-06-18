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
  colors: ["אדום"],
  giftTags: ["מתאים למתנה"],
  materials: ["gold"],
  stones: ["diamond"],
  styles: ["modern"],
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
          style: "modern",
          gift: "מתאים למתנה",
          color: "אדום",
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
      style: "modern",
      gift: "מתאים למתנה",
      color: "אדום",
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
        material: "gold",
        style: "modern",
        gift: "מתאים למתנה",
        color: "אדום",
        maxPrice: 700,
        availableOnly: true,
        mode: "classic",
        sort: "price-desc",
        view: "list",
        page: 3,
      }),
    ).toBe(
      "/search?q=ring&category=rings&material=gold&style=modern&gift=%D7%9E%D7%AA%D7%90%D7%99%D7%9D+%D7%9C%D7%9E%D7%AA%D7%A0%D7%94&color=%D7%90%D7%93%D7%95%D7%9D&maxPrice=700&availableOnly=1&sort=price-desc&mode=classic&view=list&page=3",
    );
    expect(createProductSearchHref("venus-ring")).toBe("/product/venus-ring");
    expect(
      createProductSearchHref("venus-ring", {
        query: "ring",
        position: 4,
      }),
    ).toBe("/product/venus-ring?q=ring&position=4");
  });

  it("omits empty and default search parameters from canonical hrefs", () => {
    expect(
      normalizeSearchInput(
        {
          maxPrice: "-700",
          page: "0",
          sort: "unsupported",
        },
        { categories, facets },
      ),
    ).toMatchObject({
      maxPrice: undefined,
      page: undefined,
      sort: "relevance",
    });
    expect(
      createSearchHref({
        query: "",
        category: "",
        material: "",
        stone: "",
        collection: "",
        style: "",
        gift: "",
        color: "",
        sort: "relevance",
        mode: "semantic",
        page: 1,
      }),
    ).toBe("/search");
  });

  it("counts active refinements without counting the query itself", () => {
    expect(
      getActiveSearchRefinementCount({
        query: "ring",
        category: "rings",
        style: "modern",
        gift: "מתאים למתנה",
        color: "אדום",
        maxPrice: 700,
        availableOnly: true,
        sort: "relevance",
        mode: "semantic",
      }),
    ).toBe(6);
    expect(
      getActiveSearchRefinementCount({
        query: "ring",
        sort: "relevance",
        mode: "semantic",
      }),
    ).toBe(0);
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
