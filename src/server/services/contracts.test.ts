import { describe, expect, it } from "vitest";

import { isExpiringSoon, summarizeContracts } from "./contracts";

describe("isExpiringSoon", () => {
  const now = new Date("2026-06-26T00:00:00Z");

  it("is true within the window and not past", () => {
    expect(isExpiringSoon(new Date("2026-07-10T00:00:00Z"), now, 30)).toBe(true);
  });

  it("is false beyond the window or already expired", () => {
    expect(isExpiringSoon(new Date("2026-09-01T00:00:00Z"), now, 30)).toBe(false);
    expect(isExpiringSoon(new Date("2026-06-20T00:00:00Z"), now, 30)).toBe(false);
  });

  it("is false without an end date", () => {
    expect(isExpiringSoon(null, now)).toBe(false);
  });
});

describe("summarizeContracts", () => {
  const now = new Date("2026-06-26T00:00:00Z");

  it("aggregates active contracts, value and soon-to-expire", () => {
    const summary = summarizeContracts(
      [
        { status: "ACTIVE", value: 10000, endsAt: new Date("2026-07-10T00:00:00Z") },
        { status: "ACTIVE", value: 5000, endsAt: new Date("2027-01-01T00:00:00Z") },
        { status: "DRAFT", value: 9999, endsAt: null },
      ],
      now,
    );

    expect(summary).toEqual({
      active: 2,
      expiringSoon: 1,
      totalActiveValue: 15000,
    });
  });
});
