import { describe, expect, it } from "vitest";

import {
  computeWithholding,
  effectiveWithholdingRate,
  requiresAllocationNumber,
  validateAllocationNumber,
} from "./israeli-tax";

describe("computeWithholding", () => {
  it("splits gross into withheld and net", () => {
    expect(computeWithholding({ amount: 1000, ratePercent: 30 })).toEqual({
      gross: 1000,
      withheld: 300,
      net: 700,
    });
  });

  it("clamps rate and floors amount", () => {
    expect(computeWithholding({ amount: -50, ratePercent: 150 }).withheld).toBe(0);
    expect(computeWithholding({ amount: 200, ratePercent: 0 }).net).toBe(200);
  });
});

describe("requiresAllocationNumber", () => {
  it("compares against the threshold", () => {
    expect(requiresAllocationNumber(25000, 20000)).toBe(true);
    expect(requiresAllocationNumber(19999, 20000)).toBe(false);
  });
});

describe("validateAllocationNumber", () => {
  it("accepts 9 digits only", () => {
    expect(validateAllocationNumber("123456789")).toBe(true);
    expect(validateAllocationNumber("12345")).toBe(false);
    expect(validateAllocationNumber("12345678a")).toBe(false);
  });
});

describe("effectiveWithholdingRate", () => {
  const rules = [
    { category: "services", ratePercent: 30, effectiveFrom: new Date("2025-01-01"), isActive: true },
    { category: "services", ratePercent: 25, effectiveFrom: new Date("2026-01-01"), isActive: true },
    { category: "rent", ratePercent: 35, effectiveFrom: new Date("2025-01-01"), isActive: true },
  ];

  it("picks the latest effective rule on or before the date", () => {
    expect(effectiveWithholdingRate(rules, "services", new Date("2026-06-01"))).toBe(25);
    expect(effectiveWithholdingRate(rules, "services", new Date("2025-06-01"))).toBe(30);
  });

  it("returns null when no rule applies", () => {
    expect(effectiveWithholdingRate(rules, "unknown")).toBeNull();
    expect(effectiveWithholdingRate(rules, "services", new Date("2024-01-01"))).toBeNull();
  });
});
