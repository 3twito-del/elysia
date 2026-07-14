import { describe, expect, it } from "vitest";

import { getProductRecommendationRails } from "./product-recommendation-rails";
import type { CatalogProduct } from "~/server/services/catalog";

describe("product recommendation rails", () => {
  it("builds catalog-only rails without duplicating products, capped at 2 rails", () => {
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

    expect(rails.map((rail) => rail.id)).toEqual(["complements", "category"]);
    expect(
      rails.flatMap((rail) => rail.products.map((item) => item.slug)),
    ).toEqual(["same-collection", "same-category"]);
    expect(rails.map((rail) => rail.cardContextLabel)).toEqual([
      "משלים מאותה קולקציה",
      "אותה קטגוריה",
    ]);
    expect(rails.map((rail) => rail.continuationHref)).toEqual([
      "/search?collection=Sol",
      "/category/rings",
    ]);
    expect(rails.every((rail) => rail.reason.length > 0)).toBe(true);
  });

  it("distinguishes sets (same collection + category) from complements (same collection, different category) (C-06)", () => {
    const current = createProduct({
      categoryName: "Rings",
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
          categorySlug: "rings",
          collection: "Sol",
          collections: ["Sol"],
          material: "Silver",
          popularityScore: 5,
          slug: "matching-set",
        }),
        createProduct({
          categorySlug: "earrings",
          collection: "Sol",
          collections: ["Sol"],
          material: "Silver",
          popularityScore: 5,
          slug: "companion-piece",
        }),
      ],
    });

    expect(rails.map((rail) => rail.id)).toEqual(["sets", "complements"]);
    expect(rails[0]?.products.map((item) => item.slug)).toEqual([
      "matching-set",
    ]);
    expect(rails[1]?.products.map((item) => item.slug)).toEqual([
      "companion-piece",
    ]);
  });

  it("falls back to the material rail when fewer than 2 rails were produced", () => {
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
          categorySlug: "bracelets",
          collection: "Nova",
          collections: ["Nova"],
          material: "Gold",
          popularityScore: 1,
          slug: "same-material",
        }),
      ],
    });

    expect(rails.map((rail) => rail.id)).toEqual(["complements", "material"]);
    expect(
      rails.flatMap((rail) => rail.products.map((item) => item.slug)),
    ).toEqual(["same-collection", "same-material"]);
  });

  it("caps each rail's products at 3", () => {
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
        ...Array.from({ length: 5 }, (_, index) =>
          createProduct({
            categorySlug: "earrings",
            collection: "Sol",
            collections: ["Sol"],
            material: "Silver",
            popularityScore: index,
            slug: `same-collection-${index}`,
          }),
        ),
      ],
    });

    expect(rails).toHaveLength(1);
    expect(rails[0]?.products).toHaveLength(3);
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
    expect(rails[0]?.continuationHref).toBe("/search");
    expect(rails[0]?.cardContextLabel).toBe("מומלץ עכשיו");
  });

  it("keeps rail labels source-based instead of implying personalization", () => {
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
          categoryName: "Rings",
          categorySlug: "rings",
          collection: "Aster",
          collections: ["Aster"],
          material: "Gold",
          slug: "same-material",
          stone: "Emerald",
        }),
      ],
    });
    const railCopy = rails
      .flatMap((rail) => [
        rail.cardContextLabel,
        rail.continuationLabel,
        rail.reason,
        rail.title,
      ])
      .join(" ");

    expect(railCopy).not.toMatch(/אישי|בשבילך|המלצה אישית|מותאם לך/u);
    expect(rails.every((rail) => rail.continuationHref.startsWith("/"))).toBe(
      true,
    );
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
    requiresSeparateCheckout: rest.requiresSeparateCheckout ?? false,
  } satisfies CatalogProduct;
}
