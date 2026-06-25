import { describe, expect, it } from "vitest";

import {
  currentPeriod,
  depreciationForPeriod,
  monthlyDepreciation,
} from "./fixed-assets";

describe("monthlyDepreciation", () => {
  it("spreads (cost − salvage) over the useful life", () => {
    expect(
      monthlyDepreciation({
        acquisitionCost: 12000,
        salvageValue: 0,
        usefulLifeMonths: 12,
      }),
    ).toBe(1000);
  });

  it("is zero with a non-positive life", () => {
    expect(
      monthlyDepreciation({
        acquisitionCost: 1000,
        salvageValue: 0,
        usefulLifeMonths: 0,
      }),
    ).toBe(0);
  });
});

describe("depreciationForPeriod", () => {
  const asset = {
    acquisitionCost: 12000,
    salvageValue: 0,
    usefulLifeMonths: 12,
  };

  it("charges the full monthly amount mid-life", () => {
    expect(
      depreciationForPeriod({ ...asset, accumulatedDepreciation: 3000 }),
    ).toBe(1000);
  });

  it("charges only the remaining base in the final stub period", () => {
    expect(
      depreciationForPeriod({ ...asset, accumulatedDepreciation: 11500 }),
    ).toBe(500);
  });

  it("is zero once fully depreciated", () => {
    expect(
      depreciationForPeriod({ ...asset, accumulatedDepreciation: 12000 }),
    ).toBe(0);
  });

  it("respects the salvage floor", () => {
    expect(
      depreciationForPeriod({
        acquisitionCost: 12000,
        salvageValue: 2000,
        usefulLifeMonths: 10,
        accumulatedDepreciation: 10000,
      }),
    ).toBe(0);
  });
});

describe("currentPeriod", () => {
  it("formats YYYY-MM in UTC", () => {
    expect(currentPeriod(new Date("2026-03-09T00:00:00.000Z"))).toBe("2026-03");
  });
});
