import { describe, expect, it } from "vitest";

import {
  getPublicCategoryName,
  getPublicMaterialName,
  getPublicStoneName,
  getPublicVariantOptionName,
} from "./product-display";

describe("public product display labels", () => {
  it("keeps category and supplier-derived attributes brand-facing", () => {
    expect(getPublicCategoryName("rings", "Rings")).toBe("טבעות");
    expect(
      getPublicMaterialName("Supplier selection", "Silver Halo Ring"),
    ).toBe("כסף 925");
    expect(getPublicMaterialName("Shopify import")).toBeUndefined();
    expect(getPublicMaterialName("")).toBeUndefined();
    expect(getPublicStoneName("dropship zircon")).toBeUndefined();
    expect(getPublicVariantOptionName("Silver")).toBe("כסף");
    expect(getPublicVariantOptionName("Rose Gold")).toBe("רוז גולד");
  });
});
