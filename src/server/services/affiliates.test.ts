import { describe, expect, it } from "vitest";

import { computeCommission, summarizeReferrals } from "./affiliates";

describe("computeCommission", () => {
  it("applies the percent rate", () => {
    expect(computeCommission(1000, 10)).toBe(100);
    expect(computeCommission(250, 7.5)).toBe(18.75);
  });

  it("clamps rate and floors amount", () => {
    expect(computeCommission(-100, 10)).toBe(0);
    expect(computeCommission(100, 150)).toBe(100);
  });
});

describe("summarizeReferrals", () => {
  it("splits pending / approved (payable) / paid commissions", () => {
    expect(
      summarizeReferrals([
        { status: "PENDING", commission: 50 },
        { status: "PENDING", commission: 25 },
        { status: "APPROVED", commission: 100 },
        { status: "PAID", commission: 200 },
      ]),
    ).toEqual({
      pending: 2,
      approved: 1,
      paid: 1,
      pendingCommission: 75,
      payableCommission: 100,
    });
  });
});
