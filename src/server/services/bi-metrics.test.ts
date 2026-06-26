import { describe, expect, it } from "vitest";

import { buildExecutiveSummary } from "./bi-metrics";

const base = {
  netIncome: 600,
  assets: 1800,
  liabilities: 600,
  cashBalance: 1000,
  arOutstanding: 500,
  apOutstanding: 300,
  inventoryValue: 800,
  mrr: 1200,
  loyaltyMembers: 42,
  openApprovals: 3,
};

describe("buildExecutiveSummary", () => {
  it("derives working capital, current ratio and net receivable position", () => {
    const summary = buildExecutiveSummary(base);

    expect(summary.workingCapital).toBe(1200);
    expect(summary.currentRatio).toBe(3);
    expect(summary.netReceivablePosition).toBe(200);
  });

  it("returns a null current ratio when there are no liabilities", () => {
    const summary = buildExecutiveSummary({ ...base, liabilities: 0 });
    expect(summary.currentRatio).toBeNull();
  });
});
