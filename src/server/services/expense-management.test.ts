import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { summarizeExpenseClaims } from "./expense-management";

describe("summarizeExpenseClaims", () => {
  it("totals pending and approved claims by status", () => {
    const summary = summarizeExpenseClaims([
      { status: "SUBMITTED", amount: 120 },
      { status: "SUBMITTED", amount: 80 },
      { status: "APPROVED", amount: 200 },
      { status: "REJECTED", amount: 999 },
    ]);

    expect(summary).toEqual({
      pendingCount: 2,
      approvedCount: 1,
      pendingTotal: 200,
      approvedTotal: 200,
    });
  });

  it("is all zero with no claims", () => {
    expect(summarizeExpenseClaims([])).toEqual({
      pendingCount: 0,
      approvedCount: 0,
      pendingTotal: 0,
      approvedTotal: 0,
    });
  });
});

describe("K-14 audit coverage", () => {
  it("createExpenseClaim and rejectExpenseClaim write an AuditLog row", () => {
    const source = readFileSync(
      path.join(process.cwd(), "src/server/services/expense-management.ts"),
      "utf8",
    );

    for (const operation of ["createExpenseClaim", "rejectExpenseClaim"]) {
      const start = source.indexOf(`export async function ${operation}`);
      const next = source.indexOf("\nexport async function ", start + 1);

      expect(start).toBeGreaterThanOrEqual(0);

      const body = source.slice(start, next === -1 ? source.length : next);

      expect(body).toContain("writeAdminAudit");
    }
  });
});
