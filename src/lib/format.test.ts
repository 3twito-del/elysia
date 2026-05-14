import { describe, expect, it } from "vitest";

import {
  formatHebrewDate,
  formatHebrewDateTime,
  formatOptionalHebrewDateTime,
  HEBREW_COMMERCE_TIME_ZONE,
  formatPrice,
} from "./format";

describe("formatPrice", () => {
  it("formats whole-shekel amounts for Hebrew commerce UI", () => {
    const formatted = formatPrice(1290);

    expect(formatted).toContain("1,290");
    expect(formatted).toContain("\u20aa");
    expect(formatted).not.toContain(".00");
  });
});

describe("Hebrew date formatting", () => {
  it("uses the commerce timezone explicitly for date-time output", () => {
    expect(HEBREW_COMMERCE_TIME_ZONE).toBe("Asia/Jerusalem");
    expect(formatHebrewDateTime(new Date("2026-05-14T09:30:00.000Z"))).toMatch(
      /12:30/,
    );
  });

  it("formats dates without time when only a date is needed", () => {
    expect(formatHebrewDate(new Date("2026-05-14T09:30:00.000Z"))).not.toMatch(
      /12:30/,
    );
  });

  it("keeps nullable admin timestamps readable", () => {
    expect(formatOptionalHebrewDateTime(null)).toBe("-");
    expect(formatOptionalHebrewDateTime(0)).not.toBe("-");
  });
});
