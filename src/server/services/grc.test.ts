import { describe, expect, it } from "vitest";

import { isOverdue, summarizeCompliance } from "./grc";

describe("isOverdue", () => {
  const now = new Date("2026-06-26T12:00:00Z");

  it("is overdue when past due and still open", () => {
    expect(isOverdue(new Date("2026-06-25T00:00:00Z"), "OPEN", now)).toBe(true);
  });

  it("is not overdue once resolved", () => {
    expect(isOverdue(new Date("2026-06-25T00:00:00Z"), "RESOLVED", now)).toBe(
      false,
    );
  });

  it("is not overdue without a due date or in the future", () => {
    expect(isOverdue(null, "OPEN", now)).toBe(false);
    expect(isOverdue(new Date("2026-07-01T00:00:00Z"), "OPEN", now)).toBe(false);
  });
});

describe("summarizeCompliance", () => {
  it("counts open vs resolved and open high/critical exposure", () => {
    const summary = summarizeCompliance([
      { status: "OPEN", severity: "CRITICAL" },
      { status: "IN_PROGRESS", severity: "HIGH" },
      { status: "OPEN", severity: "LOW" },
      { status: "RESOLVED", severity: "HIGH" },
      { status: "ACCEPTED", severity: "MEDIUM" },
    ]);

    expect(summary).toEqual({ open: 3, resolved: 2, openHighOrCritical: 2 });
  });
});
