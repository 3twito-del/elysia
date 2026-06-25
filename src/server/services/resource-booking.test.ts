import { describe, expect, it } from "vitest";

import { assertValidWindow, hasBookingConflict } from "./resource-booking";

const window = (start: string, end: string) => ({
  startsAt: new Date(start),
  endsAt: new Date(end),
});

describe("hasBookingConflict", () => {
  const existing = [window("2026-06-25T10:00:00Z", "2026-06-25T11:00:00Z")];

  it("detects an overlapping window", () => {
    expect(
      hasBookingConflict(existing, window("2026-06-25T10:30:00Z", "2026-06-25T11:30:00Z")),
    ).toBe(true);
  });

  it("treats adjacent (touching) windows as non-conflicting", () => {
    expect(
      hasBookingConflict(existing, window("2026-06-25T11:00:00Z", "2026-06-25T12:00:00Z")),
    ).toBe(false);
  });

  it("returns false when there is no overlap", () => {
    expect(
      hasBookingConflict(existing, window("2026-06-25T08:00:00Z", "2026-06-25T09:00:00Z")),
    ).toBe(false);
  });
});

describe("assertValidWindow", () => {
  it("rejects an end at or before the start", () => {
    expect(() =>
      assertValidWindow(window("2026-06-25T11:00:00Z", "2026-06-25T10:00:00Z")),
    ).toThrow(/אחרי/);
  });

  it("accepts a valid window", () => {
    expect(() =>
      assertValidWindow(window("2026-06-25T10:00:00Z", "2026-06-25T11:00:00Z")),
    ).not.toThrow();
  });
});
