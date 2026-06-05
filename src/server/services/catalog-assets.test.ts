import { describe, expect, it } from "vitest";

import { getDisplayCatalogImages } from "./catalog-assets";

describe("catalog display assets", () => {
  it("replaces legacy Shopify category placeholders with boutique imagery", () => {
    const images = getDisplayCatalogImages({
      categorySlug: "rings",
      images: [
        "https://cdn.shopify.com/s/files/1/0711/0295/5690/files/category-rings.avif?v=1780175231",
      ],
      slug: "silver-halo-ring",
    });

    expect(images).toHaveLength(1);
    expect(images[0]).toBe("/brand/boutique/category-rings.avif");
    expect(images[0]).not.toContain("category-rings.avif?v=");
  });
});
