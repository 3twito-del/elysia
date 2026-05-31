import { describe, expect, it } from "vitest";

import { getWishlistDecisionSupport } from "./wishlist-shortlist";

describe("wishlist shortlist decision support", () => {
  it("returns compact cues and category/service next steps", () => {
    const support = getWishlistDecisionSupport([
      {
        categoryName: "Rings",
        categorySlug: "rings",
        materialName: "Yellow gold",
        productName: "Sol Ring",
        productSlug: "sol-ring",
        stoneName: "Diamond",
        variantName: "Size 7",
      },
      {
        categoryName: "Rings",
        categorySlug: "rings",
        materialName: "Yellow gold",
        productName: "Luna Ring",
        productSlug: "luna-ring",
        stoneName: "Diamond",
        variantName: "Size 8",
      },
    ]);

    expect(support).not.toBeNull();
    expect(support?.categoryHref).toBe("/category/rings");
    expect(support?.serviceHref).toContain("/service?");
    expect(support?.serviceHref).toContain("topic=sizing");
    expect(support?.serviceHref).toContain("productReference=");
    expect(support?.serviceHref).not.toContain("/checkout");
    expect(support?.cues).toHaveLength(3);
    expect(support?.cues.map((cue) => cue.id)).toEqual([
      "category",
      "material",
      "variant",
    ]);
  });

  it("falls back to search when category data is not available", () => {
    const support = getWishlistDecisionSupport([
      {
        productName: "Pearl Pendant",
        productSlug: "pearl-pendant",
      },
    ]);

    expect(support?.categoryHref).toBe("/search");
    expect(support?.summary).toContain("1");
  });

  it("does not create support for an empty wishlist", () => {
    expect(getWishlistDecisionSupport([])).toBeNull();
  });
});
