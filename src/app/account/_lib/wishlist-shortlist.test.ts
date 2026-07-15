import { describe, expect, it } from "vitest";

import {
  getWishlistDecisionSupport,
  getWishlistItemPriceChange,
} from "./wishlist-shortlist";

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

describe("wishlist item price change", () => {
  it("returns null when there is no saved-price snapshot", () => {
    expect(
      getWishlistItemPriceChange({ currentPrice: 500, priceAtSave: null }),
    ).toBeNull();
  });

  it("returns null when the price has not moved", () => {
    expect(
      getWishlistItemPriceChange({ currentPrice: 500, priceAtSave: 500 }),
    ).toBeNull();
  });

  it("reports a drop when the current price is lower than the saved price", () => {
    const change = getWishlistItemPriceChange({
      currentPrice: 450,
      priceAtSave: 500,
    });

    expect(change).toEqual({
      currentPrice: 450,
      deltaAbs: 50,
      direction: "down",
      priceAtSave: 500,
    });
  });

  it("reports an increase when the current price is higher than the saved price", () => {
    const change = getWishlistItemPriceChange({
      currentPrice: 550,
      priceAtSave: 500,
    });

    expect(change).toEqual({
      currentPrice: 550,
      deltaAbs: 50,
      direction: "up",
      priceAtSave: 500,
    });
  });

  it("ignores sub-agora rounding noise", () => {
    expect(
      getWishlistItemPriceChange({
        currentPrice: 500.001,
        priceAtSave: 500,
      }),
    ).toBeNull();
  });
});
