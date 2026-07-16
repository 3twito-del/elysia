import { describe, expect, it } from "vitest";

import {
  computePausedMs,
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

  it("shifts both deadlines forward by the paused duration", () => {
    const pausedMs = 5 * 60 * 60 * 1000; // 5h
    const deadlines = computeSlaDeadlines(base, "NORMAL", pausedMs);
    expect(deadlines.firstResponseDueAt).toEqual(at(13));
    expect(deadlines.resolutionDueAt).toEqual(at(77));
  });
});

describe("computePausedMs", () => {
  const request = { createdAt: base };

  it("is zero with no status-change events", () => {
    expect(computePausedMs(request, [], at(10))).toBe(0);
  });

  it("counts time spent in WAITING_FOR_CUSTOMER between two events", () => {
    const events = [
      { status: "WAITING_FOR_CUSTOMER", createdAt: at(2) },
      { status: "IN_REVIEW", createdAt: at(5) },
    ];
    expect(computePausedMs(request, events, at(10))).toBe(3 * 60 * 60 * 1000);
  });

  it("counts an still-open WAITING_FOR_CUSTOMER segment up to asOf", () => {
    const events = [{ status: "WAITING_FOR_CUSTOMER", createdAt: at(2) }];
    expect(computePausedMs(request, events, at(6))).toBe(4 * 60 * 60 * 1000);
  });

  it("ignores non-WAITING_FOR_CUSTOMER segments and null-status events", () => {
    const events = [
      { status: null, createdAt: at(1) }, // e.g. RECEIVED
      { status: "IN_REVIEW", createdAt: at(2) },
      { status: "WAITING_FOR_CUSTOMER", createdAt: at(4) },
      { status: "RESOLVED", createdAt: at(7) },
    ];
    expect(computePausedMs(request, events, at(10))).toBe(3 * 60 * 60 * 1000);
  });

  it("sums multiple separate paused segments", () => {
    const events = [
      { status: "WAITING_FOR_CUSTOMER", createdAt: at(1) },
      { status: "IN_REVIEW", createdAt: at(2) }, // 1h paused
      { status: "WAITING_FOR_CUSTOMER", createdAt: at(5) },
      { status: "IN_REVIEW", createdAt: at(8) }, // 3h paused
    ];
    expect(computePausedMs(request, events, at(20))).toBe(4 * 60 * 60 * 1000);
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

  it("a paused case is not BREACHED past the un-paused deadline", () => {
    // Without the 48h pause this would be past the 72h NORMAL resolution
    // target (and BREACHED); with it, the effective deadline is 120h and
    // there's still comfortably more than 25% of the window left.
    expect(slaStatus(open, at(75))).toBe("BREACHED");
    expect(slaStatus(open, at(75), 48 * 60 * 60 * 1000)).toBe("ON_TRACK");
  });
});
