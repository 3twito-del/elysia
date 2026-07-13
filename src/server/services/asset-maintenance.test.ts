import { readFileSync } from "node:fs";
import path from "node:path";

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

describe("K-14 audit coverage", () => {
  it("maintenance mutations write an AuditLog row inside a transaction", () => {
    const source = readFileSync(
      path.join(process.cwd(), "src/server/services/asset-maintenance.ts"),
      "utf8",
    );

    for (const operation of [
      "createMaintenanceSchedule",
      "recordMaintenance",
      "setMaintenanceScheduleStatus",
    ]) {
      const start = source.indexOf(`export async function ${operation}`);
      const next = source.indexOf("\nexport async function ", start + 1);

      expect(start).toBeGreaterThanOrEqual(0);

      const body = source.slice(start, next === -1 ? source.length : next);

      expect(body).toContain("db.$transaction");
      expect(body).toContain("writeAdminAudit");
    }
  });
});
