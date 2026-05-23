import { describe, expect, it } from "vitest";

import {
  findBestVariantForSavedSize,
  formatSavedSize,
  getSizeKindForCategory,
  normalizeSavedSize,
  savedSizeInputSchema,
  type SizeFitVariant,
} from "./size-fit";

describe("size fit", () => {
  it("normalizes supported sizes for all catalog kinds", () => {
    expect(normalizeSavedSize("ring", "מידה 54")).toBe("54");
    expect(normalizeSavedSize("bracelet", " m ")).toBe("M");
    expect(normalizeSavedSize("bracelet", "18 ס״מ")).toBe("18");
    expect(normalizeSavedSize("necklace", "45cm")).toBe("45");
    expect(normalizeSavedSize("earring", "קלאסי")).toBe("classic");
  });

  it("rejects unsupported size values", () => {
    expect(normalizeSavedSize("ring", "22")).toBeNull();
    expect(normalizeSavedSize("bracelet", "XXL")).toBeNull();
    expect(normalizeSavedSize("necklace", "120")).toBeNull();
    expect(normalizeSavedSize("earring", "oversized")).toBeNull();
  });

  it("returns normalized parsed saved-size input", () => {
    expect(
      savedSizeInputSchema.parse({ kind: "bracelet", value: "s" }),
    ).toEqual({
      kind: "bracelet",
      value: "S",
    });
  });

  it("maps catalog category slugs to size kinds", () => {
    expect(getSizeKindForCategory("rings")).toBe("ring");
    expect(getSizeKindForCategory("bracelets")).toBe("bracelet");
    expect(getSizeKindForCategory("necklaces")).toBe("necklace");
    expect(getSizeKindForCategory("earrings")).toBe("earring");
    expect(getSizeKindForCategory("gifts")).toBeNull();
  });

  it("matches exact saved variants even when unavailable", () => {
    const match = findBestVariantForSavedSize(makeRingVariants(), "ring", "54");

    expect(match?.variant.sku).toBe("ring-54");
    expect(match?.exact).toBe(true);
    expect(match?.available).toBe(false);
  });

  it("falls back to the closest available numeric variant", () => {
    const match = findBestVariantForSavedSize(makeRingVariants(), "ring", "55");

    expect(match?.variant.sku).toBe("ring-56");
    expect(match?.exact).toBe(false);
    expect(match?.available).toBe(true);
  });

  it("matches earring preferences against localized variant sizes", () => {
    const match = findBestVariantForSavedSize(
      [
        { sku: "earring-mini", size: "מיני", availableQuantity: 0 },
        { sku: "earring-classic", size: "קלאסי", availableQuantity: 3 },
      ],
      "earring",
      "classic",
    );

    expect(match?.variant.sku).toBe("earring-classic");
    expect(formatSavedSize("earring", "classic")).toBe("עגילים קלאסיים");
  });
});

function makeRingVariants(): SizeFitVariant[] {
  return [
    { sku: "ring-52", size: "52", availableQuantity: 1 },
    { sku: "ring-54", size: "54", availableQuantity: 0 },
    { sku: "ring-56", size: "56", availableQuantity: 2 },
  ];
}
