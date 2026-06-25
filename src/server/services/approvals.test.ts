import { describe, expect, it } from "vitest";

import { summarizeApprovals } from "./approvals";

describe("summarizeApprovals", () => {
  it("counts by status and totals only the pending amount", () => {
    const summary = summarizeApprovals([
      { status: "PENDING", amount: 1200 },
      { status: "PENDING", amount: 300 },
      { status: "APPROVED", amount: 5000 },
      { status: "REJECTED", amount: 999 },
      { status: "PENDING", amount: null },
    ]);

    expect(summary).toEqual({
      pending: 3,
      approved: 1,
      rejected: 1,
      pendingAmount: 1500,
    });
  });

  it("is all zero with no requests", () => {
    expect(summarizeApprovals([])).toEqual({
      pending: 0,
      approved: 0,
      rejected: 0,
      pendingAmount: 0,
    });
  });
});
