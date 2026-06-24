import { describe, expect, it } from "vitest";

import {
  computeSlaDeadlines,
  isFirstResponseBreached,
  isResolutionBreached,
  slaStatus,
} from "./service-sla";

const base = new Date("2026-06-24T00:00:00.000Z");
const at = (hours: number) => new Date(base.getTime() + hours * 60 * 60 * 1000);

describe("computeSlaDeadlines", () => {
  it("derives response/resolution deadlines from priority (NORMAL = 8h/72h)", () => {
    const deadlines = computeSlaDeadlines(base, "NORMAL");
    expect(deadlines.firstResponseDueAt).toEqual(at(8));
    expect(deadlines.resolutionDueAt).toEqual(at(72));
  });

  it("uses tighter targets for URGENT (1h/8h)", () => {
    const deadlines = computeSlaDeadlines(base, "URGENT");
    expect(deadlines.firstResponseDueAt).toEqual(at(1));
    expect(deadlines.resolutionDueAt).toEqual(at(8));
  });
});

describe("isFirstResponseBreached", () => {
  const open = {
    createdAt: base,
    priority: "NORMAL",
    status: "NEW",
    firstRespondedAt: null,
    resolvedAt: null,
  };

  it("breaches when unanswered past the response target", () => {
    expect(isFirstResponseBreached(open, at(9))).toBe(true);
  });

  it("does not breach before the target or once answered", () => {
    expect(isFirstResponseBreached(open, at(1))).toBe(false);
    expect(
      isFirstResponseBreached({ ...open, firstRespondedAt: at(2) }, at(9)),
    ).toBe(false);
  });
});

describe("isResolutionBreached", () => {
  const open = {
    createdAt: base,
    priority: "NORMAL",
    status: "IN_REVIEW",
    firstRespondedAt: at(1),
    resolvedAt: null,
  };

  it("breaches when open past the resolution target", () => {
    expect(isResolutionBreached(open, at(80))).toBe(true);
  });

  it("does not breach when resolved within target", () => {
    expect(isResolutionBreached({ ...open, resolvedAt: at(50) })).toBe(false);
  });

  it("breaches when resolved after target", () => {
    expect(isResolutionBreached({ ...open, resolvedAt: at(80) })).toBe(true);
  });
});

describe("slaStatus", () => {
  const open = {
    createdAt: base,
    priority: "NORMAL",
    status: "IN_REVIEW",
    firstRespondedAt: at(1),
    resolvedAt: null,
  };

  it("is ON_TRACK early in the window", () => {
    expect(slaStatus(open, at(1))).toBe("ON_TRACK");
  });

  it("is AT_RISK within the final 25% of the window", () => {
    expect(slaStatus(open, at(60))).toBe("AT_RISK");
  });

  it("is BREACHED when the first response is overdue", () => {
    expect(
      slaStatus({ ...open, firstRespondedAt: null, status: "NEW" }, at(9)),
    ).toBe("BREACHED");
  });

  it("is MET when resolved within target", () => {
    expect(
      slaStatus({ ...open, status: "RESOLVED", resolvedAt: at(50) }, at(73)),
    ).toBe("MET");
  });
});
