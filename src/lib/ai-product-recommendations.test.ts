import { describe, expect, it } from "vitest";

import { normalizeAiRecommendedProducts } from "./ai-product-recommendations";

describe("AI product recommendations", () => {
  it("deduplicates, limits, and creates analytics hrefs", () => {
    const products = normalizeAiRecommendedProducts(
      [
        { slug: "alpha", name: "Alpha", price: 100 },
        { slug: "beta", name: "Beta", price: 200 },
        { slug: "alpha", name: "Duplicate Alpha", price: 300 },
        { slug: "gamma", name: "Gamma", price: 400 },
        { slug: "delta", name: "Delta", price: 500 },
        { slug: "epsilon", name: "Epsilon", price: 600 },
      ],
      "gift",
    );

    expect(products).toHaveLength(4);
    expect(products.map((product) => product.slug)).toEqual([
      "alpha",
      "beta",
      "gamma",
      "delta",
    ]);
    expect(products[0]?.href).toBe("/product/alpha?q=ai%3Agift&position=0");
    expect(products[3]?.href).toBe("/product/delta?q=ai%3Agift&position=3");
  });
});
