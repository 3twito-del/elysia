import { describe, expect, it } from "vitest";

import { computeShiftVariance } from "./pos-register";

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
