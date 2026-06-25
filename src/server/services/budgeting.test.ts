import { describe, expect, it } from "vitest";

import { computeBudgetVariance } from "./budgeting";

describe("computeBudgetVariance", () => {
  it("computes per-row variance and percentage plus totals", () => {
    const result = computeBudgetVariance([
      { accountCode: "5000", accountName: "COGS", budget: 1000, actual: 1200 },
      { accountCode: "5200", accountName: "Salary", budget: 8000, actual: 7600 },
    ]);

    expect(result.lines[0]).toMatchObject({ variance: 200, variancePct: 20 });
    expect(result.lines[1]).toMatchObject({ variance: -400, variancePct: -5 });
    expect(result.budgetTotal).toBe(9000);
    expect(result.actualTotal).toBe(8800);
    expect(result.varianceTotal).toBe(-200);
  });

  it("returns null percentage when the budget is zero", () => {
    const result = computeBudgetVariance([
      { accountCode: "5300", accountName: "Other", budget: 0, actual: 50 },
    ]);

    expect(result.lines[0]?.variancePct).toBeNull();
    expect(result.lines[0]?.variance).toBe(50);
  });
});
