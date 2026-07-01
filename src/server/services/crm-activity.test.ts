import { describe, expect, it } from "vitest";

import {
  normalizeActivityType,
  summarizeActivityTimeline,
} from "./crm-activity";

describe("normalizeActivityType", () => {
  it("accepts known types case-insensitively", () => {
    expect(normalizeActivityType("call")).toBe("CALL");
    expect(normalizeActivityType("MEETING")).toBe("MEETING");
  });

  it("falls back to NOTE for unknown/empty", () => {
    expect(normalizeActivityType("chat")).toBe("NOTE");
    expect(normalizeActivityType(undefined)).toBe("NOTE");
  });
});

describe("summarizeActivityTimeline", () => {
  it("counts per type and finds the latest occurredAt", () => {
    const summary = summarizeActivityTimeline([
      { type: "CALL", occurredAt: new Date("2026-01-01") },
      { type: "call", occurredAt: new Date("2026-03-01") },
      { type: "EMAIL", occurredAt: new Date("2026-02-01") },
      { type: "unknown", occurredAt: new Date("2026-01-15") },
    ]);
    expect(summary.total).toBe(4);
    expect(summary.byType.CALL).toBe(2);
    expect(summary.byType.EMAIL).toBe(1);
    expect(summary.byType.NOTE).toBe(1); // unknown → NOTE
    expect(summary.lastActivityAt).toEqual(new Date("2026-03-01"));
  });

  it("handles an empty timeline", () => {
    const summary = summarizeActivityTimeline([]);
    expect(summary.total).toBe(0);
    expect(summary.lastActivityAt).toBeNull();
    expect(summary.byType.MEETING).toBe(0);
  });
});
