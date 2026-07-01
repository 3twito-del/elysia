import { describe, expect, it } from "vitest";

import { chooseWinner, conversionRate, pickVariant } from "./ab-testing";

describe("pickVariant", () => {
  const variants = [
    { key: "A", weight: 70 },
    { key: "B", weight: 30 },
  ];
  it("assigns by weight deterministically", () => {
    expect(pickVariant(variants, 0)).toBe("A");
    expect(pickVariant(variants, 0.5)).toBe("A"); // 0.5*100=50 < 70
    expect(pickVariant(variants, 0.8)).toBe("B"); // 80 > 70
  });
  it("ignores zero-weight and empty", () => {
    expect(pickVariant([{ key: "A", weight: 0 }], 0.5)).toBeNull();
  });
});

describe("conversionRate", () => {
  it("computes a percentage", () => {
    expect(conversionRate(200, 10)).toBe(5);
    expect(conversionRate(0, 0)).toBe(0);
  });
});

describe("chooseWinner", () => {
  it("picks the best rate once both variants are powered", () => {
    expect(
      chooseWinner([
        { key: "A", impressions: 200, conversions: 10 }, // 5%
        { key: "B", impressions: 200, conversions: 24 }, // 12%
      ]),
    ).toBe("B");
  });
  it("returns null when under-powered", () => {
    expect(
      chooseWinner([
        { key: "A", impressions: 20, conversions: 5 },
        { key: "B", impressions: 200, conversions: 24 },
      ]),
    ).toBeNull();
  });
});
