import { describe, expect, it } from "vitest";

import { computeShiftVariance, posLineTotal } from "./pos-register";

describe("posLineTotal", () => {
  it("multiplies unit price by quantity, rounded to two places", () => {
    expect(posLineTotal(199.9, 3)).toBe(599.7);
    expect(posLineTotal(33.333, 3)).toBe(100);
  });

  it("is zero for a zero quantity", () => {
    expect(posLineTotal(150, 0)).toBe(0);
  });
});

describe("computeShiftVariance", () => {
  it("expects float + cash sales and reports a positive overage", () => {
    expect(
      computeShiftVariance({
        openingFloat: 500,
        cashSales: 1200,
        countedCash: 1710,
      }),
    ).toEqual({ expectedCash: 1700, variance: 10 });
  });

  it("reports a shortfall as a negative variance", () => {
    expect(
      computeShiftVariance({
        openingFloat: 500,
        cashSales: 1200,
        countedCash: 1680,
      }),
    ).toEqual({ expectedCash: 1700, variance: -20 });
  });
});
