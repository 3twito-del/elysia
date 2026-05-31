import { describe, expect, it } from "vitest";

import {
  getVariantButtonLabel,
  getVariantStatusLabel,
  isVariantSelectableForCart,
} from "./product-purchase-utils";

const baseVariant = {
  availableBranchCount: 0,
  availableQuantity: 0,
  inventory: {},
  name: "Silver",
  price: 390,
  sku: "SHOPIFY-ELYSIA-HALO-RING-SILVER",
};

describe("product purchase utilities", () => {
  it("treats Shopify dropship variants with external mappings as selectable", () => {
    const variant = {
      ...baseVariant,
      externalVariantId: "gid://shopify/ProductVariant/10",
    };

    expect(
      isVariantSelectableForCart({
        availabilityMode: "READY_TO_ORDER",
        productSource: "DROPSHIP_SHOPIFY",
        variant,
      }),
    ).toBe(true);
    expect(
      getVariantStatusLabel({
        availabilityMode: "READY_TO_ORDER",
        productSource: "DROPSHIP_SHOPIFY",
        variant,
      }),
    ).toBe("זמין דרך Shopify");
    expect(
      getVariantButtonLabel(variant, "READY_TO_ORDER", "DROPSHIP_SHOPIFY"),
    ).toContain("זמין דרך Shopify");
  });

  it("keeps owned zero-stock variants on the service inquiry path", () => {
    expect(
      isVariantSelectableForCart({
        availabilityMode: "READY_TO_ORDER",
        productSource: "OWN",
        variant: baseVariant,
      }),
    ).toBe(false);
    expect(
      getVariantStatusLabel({
        availabilityMode: "READY_TO_ORDER",
        productSource: "OWN",
        variant: baseVariant,
      }),
    ).toBe("בירור התאמה");
  });
});
