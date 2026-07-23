import { beforeEach, describe, expect, it, vi } from "vitest";

const { searchProducts } = vi.hoisted(() => ({
  searchProducts: vi.fn(
    async (input: { category?: string; maxPrice?: number }) => {
      const price = input.category === "rings" ? 420 : 360;
      const slug = `${input.category ?? "unknown"}-choice`;
      const product = {
        categoryName: input.category ?? "תכשיטים",
        categorySlug: input.category ?? "unknown",
        image: "/product.jpg",
        inventory: { online: 2 },
        material: "כסף 925",
        name: slug,
        price,
        shortDescription: "בחירה זמינה",
        slug,
        stone: undefined,
      };

      return {
        hitMetaBySlug: {
          [slug]: { matchReason: `התאמה ל-${input.category}` },
        },
        hits: [product],
      };
    },
  ),
}));

vi.mock("~/server/adapters/search", () => ({
  searchProvider: { searchProducts },
}));

vi.mock("~/server/adapters/try-on", () => ({
  tryOnProvider: { createSession: vi.fn() },
}));

vi.mock("~/server/db", () => ({ db: {} }));

import { executeSearchCatalog } from "~/server/ai/commerce-actions";

describe("executeSearchCatalog combinations", () => {
  beforeEach(() => {
    searchProducts.mockClear();
  });

  it("fans out category searches and returns one affordable item from each", async () => {
    const results = await executeSearchCatalog({
      categories: ["rings", "earrings"],
      mode: "combination",
      maxPrice: 900,
      query: "שילוב עדין",
    });

    expect(searchProducts).toHaveBeenCalledTimes(2);
    expect(searchProducts.mock.calls.map(([input]) => input.category)).toEqual([
      "rings",
      "earrings",
    ]);
    expect(results.map((product) => product.slug)).toEqual([
      "rings-choice",
      "earrings-choice",
    ]);
    expect(results.reduce((total, product) => total + product.price, 0)).toBe(
      780,
    );
  });

  it("searches three distinct categories for an open-ended combination", async () => {
    await executeSearchCatalog({
      mode: "combination",
      maxPrice: 2_000,
      query: "בני לי שילוב",
    });

    expect(searchProducts.mock.calls.map(([input]) => input.category)).toEqual([
      "rings",
      "earrings",
      "necklaces",
    ]);
  });

  it("keeps ordinary multi-category results diversified", async () => {
    const results = await executeSearchCatalog({
      categories: ["rings", "earrings"],
      query: "טבעות ועגילים",
    });

    expect(results.map((product) => product.slug)).toEqual([
      "rings-choice",
      "earrings-choice",
    ]);
  });
});
