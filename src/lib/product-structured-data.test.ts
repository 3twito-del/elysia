import { describe, expect, it } from "vitest";

import { buildProductStructuredData } from "./product-structured-data";

const base = {
  brandName: "Elysia",
  inStock: true,
  name: "טבעת אור",
  priceCurrency: "ILS",
};

describe("buildProductStructuredData", () => {
  it("emits a complete Product with an in-stock offer", () => {
    const data = buildProductStructuredData({
      ...base,
      category: "טבעות",
      description: "טבעת זהב עם יהלום.",
      image: "/media/ring.avif",
      material: "זהב צהוב 14K",
      price: 4200,
      sku: "OWN-1",
    });

    expect(data).toMatchObject({
      "@context": "https://schema.org",
      "@type": "Product",
      brand: { "@type": "Brand", name: "Elysia" },
      category: "טבעות",
      material: "זהב צהוב 14K",
      name: "טבעת אור",
      offers: {
        "@type": "Offer",
        availability: "https://schema.org/InStock",
        price: 4200,
        priceCurrency: "ILS",
      },
      sku: "OWN-1",
    });
  });

  it("omits empty and placeholder fields instead of emitting them", () => {
    const data = buildProductStructuredData({
      ...base,
      description: "   ",
      image: "",
      material: "[להשלמה]",
      sku: null,
      price: 500,
    });

    expect(data).not.toHaveProperty("description");
    expect(data).not.toHaveProperty("image");
    expect(data).not.toHaveProperty("material");
    expect(data).not.toHaveProperty("sku");
  });

  it("uses PreOrder availability when the product cannot be added to cart", () => {
    const data = buildProductStructuredData({
      ...base,
      inStock: false,
      price: 500,
    });

    expect(data.offers).toMatchObject({
      availability: "https://schema.org/PreOrder",
    });
  });

  it("omits the offer entirely when the price is not a positive amount", () => {
    for (const price of [0, -10, Number.NaN, undefined, null]) {
      const data = buildProductStructuredData({ ...base, price });

      expect(data).not.toHaveProperty("offers");
    }
  });
});
