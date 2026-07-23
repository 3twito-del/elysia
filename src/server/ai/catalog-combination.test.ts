import { describe, expect, it } from "vitest";

import {
  planCatalogSearches,
  selectCatalogCombination,
  selectDiverseCatalogProducts,
} from "~/server/ai/catalog-combination";

const products = {
  ring: { slug: "ring", categorySlug: "rings", price: 420 },
  ringDuplicate: { slug: "ring", categorySlug: "rings", price: 420 },
  earrings: { slug: "earrings", categorySlug: "earrings", price: 360 },
  necklace: { slug: "necklace", categorySlug: "necklaces", price: 790 },
  bracelet: { slug: "bracelet", categorySlug: "bracelets", price: 510 },
  affordableRing: {
    slug: "affordable-ring",
    categorySlug: "rings",
    price: 400,
  },
  hiddenSet: { slug: "hidden-set", categorySlug: "sets", price: 200 },
  secondRing: { slug: "second-ring", categorySlug: "rings", price: 460 },
};

describe("AI catalog combinations", () => {
  it("plans one parallel search per distinct public category", () => {
    expect(
      planCatalogSearches({
        categories: ["rings", "earrings", "rings", "sets"],
        mode: "combination",
      }),
    ).toEqual(["rings", "earrings"]);
  });

  it("plans exactly three distinct categories when a combination is open-ended", () => {
    expect(planCatalogSearches({ mode: "combination" })).toEqual([
      "rings",
      "earrings",
      "necklaces",
    ]);
  });

  it("selects one item per category, removes duplicates and respects total budget", () => {
    expect(
      selectCatalogCombination(
        [
          [products.ring, products.ringDuplicate],
          [products.earrings],
          [products.hiddenSet],
        ],
        { maxPrice: 800, limit: 4 },
      ).map((product) => product.slug),
    ).toEqual(["ring", "earrings"]);
  });

  it("falls back to affordable individual alternatives when a pair does not fit", () => {
    expect(
      selectCatalogCombination(
        [[products.necklace], [products.bracelet], [products.earrings]],
        { maxPrice: 700, limit: 4 },
      ).map((product) => product.slug),
    ).toEqual(["bracelet", "earrings"]);
  });

  it("keeps individual fallbacks diverse even when a category has several items", () => {
    expect(
      selectCatalogCombination(
        [[products.ring, products.affordableRing], [products.earrings]],
        { maxPrice: 700, limit: 4 },
      ).map((product) => product.slug),
    ).toEqual(["affordable-ring", "earrings"]);
  });

  it("diversifies ordinary multi-category results before filling extra slots", () => {
    expect(
      selectDiverseCatalogProducts(
        [
          [products.ring, products.secondRing],
          [products.earrings],
          [products.hiddenSet],
        ],
        4,
      ).map((product) => product.slug),
    ).toEqual(["ring", "earrings", "second-ring"]);
  });
});
