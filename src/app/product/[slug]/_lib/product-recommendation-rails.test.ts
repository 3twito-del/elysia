import { describe, expect, it } from "vitest";

import { getProductRecommendationRails } from "./product-recommendation-rails";
import type { CatalogProduct } from "~/server/services/catalog";

describe("product recommendation rails", () => {
  it("builds catalog-only rails without duplicating products", () => {
    const current = createProduct({
      categoryName: "Rings",
      categorySlug: "rings",
      collection: "Sol",
      collections: ["Sol"],
      material: "Gold",
      slug: "current",
      stone: "Diamond",
    });
    const rails = getProductRecommendationRails({
      product: current,
      products: [
        current,
        createProduct({
          categorySlug: "necklaces",
          collection: "Sol",
          collections: ["Sol"],
          material: "Silver",
          popularityScore: 2,
          slug: "same-collection",
        }),
        createProduct({
          categorySlug: "rings",
          collection: "Aster",
          collections: ["Aster"],
          material: "Silver",
          popularityScore: 10,
          slug: "same-category",
        }),
        createProduct({
          categorySlug: "bracelets",
          collection: "Nova",
          collections: ["Nova"],
          material: "Gold",
          popularityScore: 1,
          slug: "same-material",
        }),
      ],
    });

    expect(rails.map((rail) => rail.id)).toEqual([
      "collection",
      "category",
      "material",
    ]);
    expect(
      rails.flatMap((rail) => rail.products.map((item) => item.slug)),
    ).toEqual(["same-collection", "same-category", "same-material"]);
  });

  it("falls back to popular catalog products when there are no direct matches", () => {
    const current = createProduct({
      categorySlug: "rings",
      collection: "Sol",
      collections: ["Sol"],
      material: "Gold",
      slug: "current",
    });
    const rails = getProductRecommendationRails({
      product: current,
      products: [
        current,
        createProduct({
          categorySlug: "earrings",
          collection: "Aster",
          collections: ["Aster"],
          material: "Silver",
          popularityScore: 20,
          slug: "popular",
        }),
      ],
    });

    expect(rails).toHaveLength(1);
    expect(rails[0]?.id).toBe("popular");
    expect(rails[0]?.products[0]?.slug).toBe("popular");
  });
});

function createProduct(overrides: Partial<CatalogProduct> & { slug: string }) {
  const { slug, ...rest } = overrides;

  return {
    availabilityMode: "READY_TO_ORDER",
    categoryName: "Category",
    categorySlug: "category",
    collection: "Collection",
    collections: ["Collection"],
    commerceHighlights: [],
    compareAt: undefined,
    createdAt: "2026-01-01T00:00:00.000Z",
    description: "Description",
    image: "/product.jpg",
    images: ["/product.jpg"],
    inventory: { telaviv: 2 },
    material: "Material",
    metalColors: ["Gold"],
    name: slug,
    popularityScore: 0,
    price: 100,
    shortDescription: "Short description",
    sizes: ["One size"],
    sku: slug,
    slug,
    stone: undefined,
    tags: [],
    variants: [
      {
        availableBranchCount: 1,
        availableQuantity: 2,
        inventory: { telaviv: 2 },
        name: "Default",
        price: 100,
        sku: `${slug}-default`,
      },
    ],
    ...rest,
    source: rest.source ?? "OWN",
  } satisfies CatalogProduct;
}
