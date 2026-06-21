import { describe, expect, it } from "vitest";

import { getDisplayCatalogImages } from "./catalog-assets";

describe("catalog display assets", () => {
  it("replaces legacy Shopify category placeholders with product imagery", () => {
    const images = getDisplayCatalogImages({
      categorySlug: "rings",
      images: [
        "https://cdn.shopify.com/s/files/1/0711/0295/5690/files/category-rings.avif?v=1780175231",
      ],
      slug: "silver-halo-ring",
    });

    expect(images[0]).toMatch(/^\/brand\/product-catalog\/rings-\d{2}\.avif$/);
    expect(images[0]).not.toContain("category-rings.avif?v=");
  });

  it("replaces boutique category placeholders with product imagery", () => {
    const images = getDisplayCatalogImages({
      categorySlug: "rings",
      images: ["/brand/boutique/category-rings.avif"],
      slug: "venus-line-ring",
    });

    expect(images[0]).toMatch(/^\/brand\/product-catalog\/rings-\d{2}\.avif$/);
    expect(images[0]).not.toBe("/brand/boutique/category-rings.avif");
  });

  it("keeps product media stable but varied across slugs", () => {
    const firstImages = getDisplayCatalogImages({
      categorySlug: "rings",
      images: ["/brand/boutique/category-rings.avif"],
      slug: "silver-halo-ring",
    });
    const secondImages = getDisplayCatalogImages({
      categorySlug: "rings",
      images: ["/brand/boutique/category-rings.avif"],
      slug: "venus-line-ring",
    });

    expect(firstImages[0]).toMatch(
      /^\/brand\/product-catalog\/rings-\d{2}\.avif$/,
    );
    expect(secondImages[0]).toMatch(
      /^\/brand\/product-catalog\/rings-\d{2}\.avif$/,
    );
    expect(firstImages[0]).not.toBe(secondImages[0]);
  });

  it("keeps fallback gallery images inside the product category", () => {
    const images = getDisplayCatalogImages({
      categorySlug: "earrings",
      images: ["/brand/boutique/category-earrings.avif"],
      slug: "elysia-supplier-pearl-drop-earrings",
    });

    expect(images).toHaveLength(6);
    expect(images).toEqual(
      expect.arrayContaining([
        expect.stringMatching(
          /^\/brand\/product-catalog\/earrings-\d{2}\.avif$/,
        ),
      ]),
    );
    expect(
      images.every((image) =>
        /^\/brand\/product-catalog\/earrings-\d{2}\.avif$/.test(image),
      ),
    ).toBe(true);
    expect(images.join(" ")).not.toMatch(
      /category-(rings|bracelets|necklaces)/,
    );
  });
});
