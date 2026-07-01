import { describe, expect, it } from "vitest";

import {
  convertToBase,
  resolveRate,
  revaluationGainLoss,
} from "./currency-fx";

const rates = [
  { effectiveDate: new Date("2026-01-01"), rateToBase: 3.6 },
  { effectiveDate: new Date("2026-03-01"), rateToBase: 3.75 },
];

describe("resolveRate", () => {
  it("returns 1 for the base currency", () => {
    expect(resolveRate("ILS", [], new Date("2026-04-01"))).toBe(1);
  });

  it("picks the latest rate on or before the date", () => {
    expect(resolveRate("USD", rates, new Date("2026-02-15"))).toBe(3.6);
    expect(resolveRate("USD", rates, new Date("2026-03-10"))).toBe(3.75);
  });

  it("returns null when no rate is available yet", () => {
    expect(resolveRate("USD", rates, new Date("2025-12-01"))).toBeNull();
  });
});

describe("convertToBase", () => {
  it("multiplies the foreign amount by the rate", () => {
    expect(convertToBase(100, 3.75)).toBe(375);
  });
});

describe("revaluationGainLoss", () => {
  it("is the foreign amount times the rate delta", () => {
    expect(revaluationGainLoss(100, 3.6, 3.75)).toBe(15);
    expect(revaluationGainLoss(100, 3.75, 3.6)).toBe(-15);
  });
});
