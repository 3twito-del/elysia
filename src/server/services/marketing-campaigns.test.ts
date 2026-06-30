import { describe, expect, it } from "vitest";

import { computeCampaignMetrics, computeRoas } from "./marketing-campaigns";

describe("computeRoas", () => {
  it("divides revenue by spend", () => {
    expect(computeRoas(1000, 250)).toBe(4);
    expect(computeRoas(150, 100)).toBe(1.5);
  });

  it("guards a zero spend", () => {
    expect(computeRoas(500, 0)).toBe(0);
  });
});

describe("computeCampaignMetrics", () => {
  it("derives roas, profit and budget usage", () => {
    expect(
      computeCampaignMetrics({ budget: 1000, spend: 400, revenue: 1600 }),
    ).toEqual({ roas: 4, profit: 1200, budgetUsedPercent: 40 });
  });

  it("handles a zero budget", () => {
    expect(
      computeCampaignMetrics({ budget: 0, spend: 100, revenue: 50 }),
    ).toEqual({ roas: 0.5, profit: -50, budgetUsedPercent: 0 });
  });
});
