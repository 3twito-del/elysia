import { describe, expect, it } from "vitest";

import { averageRating, summarizeGoals } from "./hr-performance";

describe("summarizeGoals", () => {
  it("counts by status and averages progress", () => {
    expect(
      summarizeGoals([
        { status: "DONE", progress: 100 },
        { status: "IN_PROGRESS", progress: 50 },
        { status: "OPEN", progress: 0 },
      ]),
    ).toEqual({ total: 3, open: 1, inProgress: 1, done: 1, avgProgress: 50 });
  });

  it("handles no goals", () => {
    expect(summarizeGoals([])).toEqual({
      total: 0,
      open: 0,
      inProgress: 0,
      done: 0,
      avgProgress: 0,
    });
  });
});

describe("averageRating", () => {
  it("averages to one decimal", () => {
    expect(averageRating([{ rating: 4 }, { rating: 5 }, { rating: 4 }])).toBe(4.3);
    expect(averageRating([])).toBe(0);
  });
});
