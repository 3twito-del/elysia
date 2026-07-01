import { describe, expect, it } from "vitest";

import {
  computeNextRun,
  isScheduleDue,
  normalizeFrequency,
} from "./report-schedules";

describe("normalizeFrequency", () => {
  it("accepts known frequencies, defaults to WEEKLY", () => {
    expect(normalizeFrequency("daily")).toBe("DAILY");
    expect(normalizeFrequency("MONTHLY")).toBe("MONTHLY");
    expect(normalizeFrequency("yearly")).toBe("WEEKLY");
    expect(normalizeFrequency(undefined)).toBe("WEEKLY");
  });
});

describe("computeNextRun", () => {
  const from = new Date("2026-03-07T09:00:00.000Z");

  it("advances by the cadence", () => {
    expect(computeNextRun("DAILY", from).toISOString()).toBe(
      "2026-03-08T09:00:00.000Z",
    );
    expect(computeNextRun("WEEKLY", from).toISOString()).toBe(
      "2026-03-14T09:00:00.000Z",
    );
    expect(computeNextRun("MONTHLY", from).toISOString()).toBe(
      "2026-04-07T09:00:00.000Z",
    );
  });
});

describe("isScheduleDue", () => {
  it("is due when nextRunAt is at or before now", () => {
    const now = new Date("2026-03-07T12:00:00Z");
    expect(isScheduleDue(new Date("2026-03-07T11:00:00Z"), now)).toBe(true);
    expect(isScheduleDue(new Date("2026-03-07T12:00:00Z"), now)).toBe(true);
    expect(isScheduleDue(new Date("2026-03-07T13:00:00Z"), now)).toBe(false);
  });
});
