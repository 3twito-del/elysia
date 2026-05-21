import { describe, expect, it } from "vitest";

import type {
  CatalogCategory,
  CatalogProduct,
} from "~/server/services/catalog";
import { getCategoryRouteState } from "./category-filter-state";

describe("getCategoryRouteState", () => {
  it("keeps the selected sort option active on the current route", () => {
    const state = getCategoryRouteState({
      catalogProducts: [
        makeProduct({ categorySlug: "rings", price: 900, slug: "ring-a" }),
        makeProduct({ categorySlug: "rings", price: 1300, slug: "ring-b" }),
      ],
      categories: [makeCategory("rings")],
      facets: {
        collections: ["classic"],
        materials: ["gold"],
        priceRange: { max: 1300, min: 900 },
        stones: ["diamond"],
      },
      query: { sort: "price-desc" },
      slug: "rings",
    });
    const activeSortOptions = state.sections[0]?.options.filter(
      (option) => option.active,
    );

    expect(activeSortOptions).toHaveLength(1);
    expect(activeSortOptions?.[0]?.href).toBe(
      "/category/rings?sort=price-desc",
    );
    expect(state.activeFilters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          href: "/category/rings",
          key: "sort",
        }),
      ]),
    );
  });
});

function makeCategory(slug: string): CatalogCategory {
  return {
    description: "Description",
    image: "/category.png",
    imageUrl: "/category.png",
    name: slug,
    slug,
  };
}

function makeProduct(
  overrides: Pick<CatalogProduct, "categorySlug" | "price" | "slug">,
): CatalogProduct {
  return {
    availabilityMode: "READY_TO_ORDER",
    categoryName: overrides.categorySlug,
    categorySlug: overrides.categorySlug,
    collection: "classic",
    collections: ["classic"],
    commerceHighlights: [],
    createdAt: new Date("2026-01-01T00:00:00Z"),
    description: "Description",
    image: "/product.png",
    images: ["/product.png"],
    inventory: { online: 1 },
    material: "gold",
    metalColors: [],
    name: overrides.slug,
    popularityScore: 1,
    price: overrides.price,
    shortDescription: "Short description",
    sizes: [],
    sku: overrides.slug.toUpperCase(),
    slug: overrides.slug,
    stone: "diamond",
    tags: [],
    variants: [],
  };
}
