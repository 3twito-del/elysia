import { describe, expect, it } from "vitest";

import {
  computeBudgetUsage,
  projectHealth,
  summarizeMilestones,
  timeEntriesCost,
  unbilledBillableAmount,
} from "./projects";

describe("computeBudgetUsage", () => {
  it("computes remaining and utilization", () => {
    expect(computeBudgetUsage({ budget: 1000, spent: 250 })).toEqual({
      budget: 1000,
      spent: 250,
      remaining: 750,
      utilization: 25,
    });
  });

  it("guards a zero budget against divide-by-zero", () => {
    expect(computeBudgetUsage({ budget: 0, spent: 100 })).toEqual({
      budget: 0,
      spent: 100,
      remaining: -100,
      utilization: 0,
    });
  });
});

describe("timeEntriesCost", () => {
  it("sums hours times rate", () => {
    expect(
      timeEntriesCost([
        { hours: 2, ratePerHour: 100 },
        { hours: 1.5, ratePerHour: 200 },
      ]),
    ).toBe(500);
  });
});

describe("unbilledBillableAmount", () => {
  it("counts only billable, not-yet-invoiced entries", () => {
    expect(
      unbilledBillableAmount([
        { hours: 2, ratePerHour: 100, billable: true, status: "UNBILLED" },
        { hours: 5, ratePerHour: 100, billable: false, status: "UNBILLED" },
        { hours: 3, ratePerHour: 100, billable: true, status: "INVOICED" },
      ]),
    ).toBe(200);
  });
});

describe("summarizeMilestones", () => {
  it("splits invoiced from remaining and counts by status", () => {
    expect(
      summarizeMilestones([
        { amount: 1000, status: "INVOICED" },
        { amount: 500, status: "COMPLETED" },
        { amount: 250, status: "PENDING" },
      ]),
    ).toEqual({
      counts: { INVOICED: 1, COMPLETED: 1, PENDING: 1 },
      total: 1750,
      invoiced: 1000,
      remaining: 750,
    });
  });
});

describe("projectHealth", () => {
  it("flags over-budget and at-risk", () => {
    expect(projectHealth({ status: "ACTIVE", utilization: 120 })).toBe(
      "OVER_BUDGET",
    );
    expect(projectHealth({ status: "ACTIVE", utilization: 90 })).toBe(
      "AT_RISK",
    );
    expect(projectHealth({ status: "ACTIVE", utilization: 40 })).toBe(
      "ON_TRACK",
    );
  });

  it("reports closed projects regardless of utilization", () => {
    expect(projectHealth({ status: "COMPLETED", utilization: 200 })).toBe(
      "CLOSED",
    );
    expect(projectHealth({ status: "CANCELLED", utilization: 10 })).toBe(
      "CLOSED",
    );
  });
});
