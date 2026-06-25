import { describe, expect, it } from "vitest";

import { summarizeExpenseClaims } from "./expense-management";

describe("summarizeExpenseClaims", () => {
  it("totals pending and approved claims by status", () => {
    const summary = summarizeExpenseClaims([
      { status: "SUBMITTED", amount: 120 },
      { status: "SUBMITTED", amount: 80 },
      { status: "APPROVED", amount: 200 },
      { status: "REJECTED", amount: 999 },
    ]);

    expect(summary).toEqual({
      pendingCount: 2,
      approvedCount: 1,
      pendingTotal: 200,
      approvedTotal: 200,
    });
  });

  it("is all zero with no claims", () => {
    expect(summarizeExpenseClaims([])).toEqual({
      pendingCount: 0,
      approvedCount: 0,
      pendingTotal: 0,
      approvedTotal: 0,
    });
  });
});
