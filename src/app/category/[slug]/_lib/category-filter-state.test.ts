import { describe, expect, it } from "vitest";

import type {
  CatalogCategory,
  CatalogProduct,
} from "~/server/services/catalog";
import {
  createCategoryFilterQueryString,
  getCategoryRouteState,
  toCategoryFilterPayload,
} from "./category-filter-state";

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

  it("keeps desktop and mobile filter payload state equivalent", () => {
    const state = getCategoryRouteState({
      catalogProducts: [
        makeProduct({
          categorySlug: "rings",
          material: "gold",
          price: 900,
          slug: "ring-a",
        }),
        makeProduct({
          categorySlug: "rings",
          material: "silver",
          price: 1300,
          slug: "ring-b",
        }),
      ],
      categories: [makeCategory("rings")],
      facets: {
        collections: ["classic"],
        materials: ["gold", "silver"],
        priceRange: { max: 1300, min: 900 },
        stones: ["diamond"],
      },
      query: {
        material: "gold",
        maxPrice: "1000",
        sort: "price-asc",
      },
      slug: "rings",
    });
    const mobilePayload = toCategoryFilterPayload(state);
    const activeSort = state.sections[0]?.options.find(
      (option) => option.active,
    );

    expect(mobilePayload.activeFilterCount).toBe(state.activeFilterCount);
    expect(mobilePayload.activeFilters).toEqual(state.activeFilters);
    expect(mobilePayload.resetHref).toBe(state.resetHref);
    expect(mobilePayload.sections).toEqual(state.sections);
    expect(state.resetHref).toBe("/category/rings");
    expect(state.currentSortLabel).toBe(activeSort?.label);
    expect(state.activeFilters.map((filter) => filter.key)).toEqual([
      "material",
      "maxPrice",
      "sort",
    ]);
  });

  it("normalizes invalid price and tracking params out of reset-safe filter state", () => {
    const state = getCategoryRouteState({
      catalogProducts: [
        makeProduct({
          categorySlug: "rings",
          material: "gold",
          price: 900,
          slug: "ring-a",
        }),
      ],
      categories: [makeCategory("rings")],
      facets: {
        collections: ["classic"],
        materials: ["gold"],
        priceRange: { max: 900, min: 900 },
        stones: ["diamond"],
      },
      query: {
        material: "gold",
        maxPrice: "-1000",
        page: "3",
        sort: "unsupported",
      },
      slug: "rings",
    });

    expect(state.filters.maxPrice).toBeUndefined();
    expect(state.filters.sort).toBe("popular");
    expect(state.resetHref).toBe("/category/rings");
    expect(
      createCategoryFilterQueryString({ material: "gold", page: "3" }),
    ).toBe("material=gold");
  });

  it("builds route-backed no-result recovery actions for adjacent categories", () => {
    const state = getCategoryRouteState({
      catalogProducts: [
        makeProduct({
          categorySlug: "rings",
          material: "gold",
          price: 900,
          slug: "ring-a",
        }),
        makeProduct({
          categorySlug: "earrings",
          material: "silver",
          price: 1300,
          slug: "earring-a",
        }),
        makeProduct({
          categorySlug: "bracelets",
          material: "gold",
          price: 1100,
          slug: "bracelet-a",
        }),
      ],
      categories: [
        makeCategory("rings"),
        makeCategory("earrings"),
        makeCategory("bracelets"),
      ],
      facets: {
        collections: ["classic"],
        materials: ["gold", "silver"],
        priceRange: { max: 1300, min: 900 },
        stones: ["diamond"],
      },
      query: { material: "silver" },
      slug: "rings",
    });

    expect(state.filteredProducts).toHaveLength(0);
    expect(state.noResultRecoveryActions).toEqual([
      expect.objectContaining({
        href: "/category/earrings?material=silver",
        label: "earrings",
        total: 1,
      }),
    ]);
    expect(state.searchRecoveryHref).toBe("/search?material=silver");
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
  overrides: Pick<CatalogProduct, "categorySlug" | "price" | "slug"> &
    Partial<CatalogProduct>,
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
    material: overrides.material ?? "gold",
    metalColors: [],
    name: overrides.slug,
    popularityScore: 1,
    price: overrides.price,
    shortDescription: "Short description",
    sizes: [],
    sku: overrides.slug.toUpperCase(),
    slug: overrides.slug,
    source: "OWN",
    stone: "diamond",
    tags: [],
    variants: [],
  };
}
