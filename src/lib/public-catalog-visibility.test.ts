import { describe, expect, it } from "vitest";

import {
  filterPublicCatalogItems,
  isPublicCatalogCategory,
} from "~/lib/public-catalog-visibility";

describe("public catalog visibility", () => {
  it("hides set inventory from every public catalog consumer", () => {
    expect(isPublicCatalogCategory("sets")).toBe(false);
    expect(
      filterPublicCatalogItems([
        { categorySlug: "rings", slug: "ring" },
        { categorySlug: "sets", slug: "hidden-set" },
      ]),
    ).toEqual([{ categorySlug: "rings", slug: "ring" }]);
  });

  it("keeps ordinary products visible when they only have a historic gift tag", () => {
    expect(
      filterPublicCatalogItems([
        { categorySlug: "necklaces", slug: "giftable", tags: ["מתנה"] },
      ]),
    ).toHaveLength(1);
  });
});
