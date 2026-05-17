import { describe, expect, it } from "vitest";

import type { CatalogProduct } from "~/server/services/catalog";
import { getCategoryFilterCounts } from "./category-filter-utils";

describe("getCategoryFilterCounts", () => {
  it("counts each filter dimension against the other active selections", () => {
    const counts = getCategoryFilterCounts(
      [
        makeProduct({
          inventory: { "tel-aviv": 2, jerusalem: 0 },
          material: "gold",
          price: 700,
          stone: "diamond",
        }),
        makeProduct({
          inventory: { "tel-aviv": 0, jerusalem: 3 },
          material: "silver",
          price: 1200,
          stone: "pearl",
        }),
        makeProduct({
          inventory: { "tel-aviv": 1, jerusalem: 1 },
          material: "gold",
          price: 1600,
          stone: "pearl",
        }),
      ],
      { material: "gold" },
      [750, 1500, 2000],
    );

    expect(counts.materials.get("gold")).toBe(2);
    expect(counts.materials.get("silver")).toBe(1);
    expect(counts.stones.get("diamond")).toBe(1);
    expect(counts.stones.get("pearl")).toBe(1);
    expect(counts.maxPrices.get(750)).toBe(1);
    expect(counts.maxPrices.get(1500)).toBe(1);
    expect(counts.maxPrices.get(2000)).toBe(2);
  });

  it("keeps selected dimensions countable even when the full combination is empty", () => {
    const counts = getCategoryFilterCounts(
      [
        makeProduct({
          inventory: { "tel-aviv": 2, jerusalem: 0 },
          material: "gold",
          price: 700,
          stone: "diamond",
        }),
        makeProduct({
          inventory: { "tel-aviv": 0, jerusalem: 3 },
          material: "silver",
          price: 1200,
          stone: "pearl",
        }),
      ],
      { material: "silver", stone: "diamond" },
      [1500],
    );

    expect(counts.materials.get("gold")).toBe(1);
    expect(counts.materials.get("silver")).toBeUndefined();
    expect(counts.stones.get("diamond")).toBeUndefined();
    expect(counts.stones.get("pearl")).toBe(1);
  });
});

function makeProduct(
  overrides: Pick<CatalogProduct, "inventory" | "material" | "price"> &
    Partial<Pick<CatalogProduct, "stone">>,
): CatalogProduct {
  return {
    categoryName: "Category",
    categorySlug: "category",
    collection: "classic",
    collections: ["classic"],
    createdAt: new Date("2026-01-01T00:00:00Z"),
    description: "Description",
    image: "/product.png",
    images: ["/product.png"],
    inventory: overrides.inventory,
    material: overrides.material,
    metalColors: [],
    name: "Product",
    popularityScore: 1,
    price: overrides.price,
    shortDescription: "Short description",
    sizes: [],
    sku: "SKU",
    slug: `${overrides.material}-${overrides.price}`,
    stone: overrides.stone,
    tags: [],
    variants: [],
  };
}
