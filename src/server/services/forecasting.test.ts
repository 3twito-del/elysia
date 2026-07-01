import { describe, expect, it } from "vitest";

import { forecastNext, linearTrend, movingAverage } from "./forecasting";

describe("movingAverage", () => {
  it("averages the last window values", () => {
    expect(movingAverage([2, 4, 6], 2)).toBe(5);
    expect(movingAverage([10], 7)).toBe(10);
  });

  it("is zero for empty input or non-positive window", () => {
    expect(movingAverage([], 3)).toBe(0);
    expect(movingAverage([1, 2], 0)).toBe(0);
  });
});

describe("linearTrend", () => {
  it("recovers slope and intercept of a straight line", () => {
    expect(linearTrend([1, 2, 3, 4])).toEqual({ slope: 1, intercept: 1 });
  });

  it("has zero slope for a single point or a flat line", () => {
    expect(linearTrend([5])).toEqual({ slope: 0, intercept: 5 });
    expect(linearTrend([3, 3, 3])).toEqual({ slope: 0, intercept: 3 });
  });
});

describe("forecastNext", () => {
  it("projects the trend forward, clamped and rounded", () => {
    expect(forecastNext([1, 2, 3, 4], 2)).toEqual([5, 6]);
  });

  it("never returns negatives from a declining trend", () => {
    expect(forecastNext([3, 2, 1], 5).every((v) => v >= 0)).toBe(true);
  });

  it("returns an empty array for a zero horizon", () => {
    expect(forecastNext([1, 2, 3], 0)).toEqual([]);
  });
});
