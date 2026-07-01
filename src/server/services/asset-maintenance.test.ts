import { describe, expect, it } from "vitest";

import { computeNextDue, maintenanceStatus } from "./asset-maintenance";

describe("computeNextDue", () => {
  it("adds the interval in days", () => {
    expect(
      computeNextDue(new Date("2026-03-01T00:00:00Z"), 30).toISOString(),
    ).toBe("2026-03-31T00:00:00.000Z");
  });

  it("clamps a non-positive interval to at least 1 day", () => {
    expect(
      computeNextDue(new Date("2026-03-01T00:00:00Z"), 0).toISOString(),
    ).toBe("2026-03-02T00:00:00.000Z");
  });
});

describe("maintenanceStatus", () => {
  const now = new Date("2026-03-10T00:00:00Z");

  it("classifies overdue / due-soon / ok", () => {
    expect(maintenanceStatus(new Date("2026-03-05"), now)).toBe("OVERDUE");
    expect(maintenanceStatus(new Date("2026-03-14"), now)).toBe("DUE_SOON");
    expect(maintenanceStatus(new Date("2026-05-01"), now)).toBe("OK");
  });
});
