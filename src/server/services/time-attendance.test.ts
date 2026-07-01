import { describe, expect, it } from "vitest";

import {
  computeLeaveDays,
  computeWorkedHours,
  normalizeLeaveType,
} from "./time-attendance";

describe("computeWorkedHours", () => {
  it("subtracts the break and rounds to 2dp", () => {
    const inTime = new Date("2026-03-07T09:00:00Z");
    const outTime = new Date("2026-03-07T17:30:00Z");
    expect(computeWorkedHours(inTime, outTime, 30)).toBe(8);
  });

  it("returns 0 for an open shift or negative net", () => {
    const inTime = new Date("2026-03-07T09:00:00Z");
    expect(computeWorkedHours(inTime, null, 0)).toBe(0);
    expect(
      computeWorkedHours(inTime, new Date("2026-03-07T09:10:00Z"), 60),
    ).toBe(0);
  });
});

describe("computeLeaveDays", () => {
  it("is inclusive of both endpoints", () => {
    expect(
      computeLeaveDays(new Date("2026-03-01"), new Date("2026-03-01")),
    ).toBe(1);
    expect(
      computeLeaveDays(new Date("2026-03-01"), new Date("2026-03-05")),
    ).toBe(5);
  });

  it("is 0 for a reversed range", () => {
    expect(
      computeLeaveDays(new Date("2026-03-05"), new Date("2026-03-01")),
    ).toBe(0);
  });
});

describe("normalizeLeaveType", () => {
  it("accepts known types, defaults to VACATION", () => {
    expect(normalizeLeaveType("sick")).toBe("SICK");
    expect(normalizeLeaveType("unpaid")).toBe("UNPAID");
    expect(normalizeLeaveType("sabbatical")).toBe("VACATION");
  });
});
