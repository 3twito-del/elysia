import { describe, expect, it } from "vitest";

import { resolveContractPrice } from "./price-lists";

describe("resolveContractPrice", () => {
  const items = [
    { variantId: "v1", price: 80 },
    { variantId: "v2", price: 120 },
  ];

  it("uses the listed price when present", () => {
    expect(resolveContractPrice(items, "v1", 100)).toBe(80);
    expect(resolveContractPrice(items, "v2", 100)).toBe(120);
  });

  it("falls back to the base price when not listed", () => {
    expect(resolveContractPrice(items, "v9", 100)).toBe(100);
    expect(resolveContractPrice([], "v1", 55.5)).toBe(55.5);
  });
});
