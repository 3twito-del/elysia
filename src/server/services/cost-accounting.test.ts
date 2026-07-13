import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  budgetVariance,
  computeCenterProfitability,
  normalizeCenterKind,
  normalizeEntryKind,
} from "./cost-accounting";

describe("normalizeCenterKind / normalizeEntryKind", () => {
  it("normalizes with sensible defaults", () => {
    expect(normalizeCenterKind("profit")).toBe("PROFIT");
    expect(normalizeCenterKind("x")).toBe("COST");
    expect(normalizeEntryKind("revenue")).toBe("REVENUE");
    expect(normalizeEntryKind(undefined)).toBe("EXPENSE");
  });
});

describe("computeCenterProfitability", () => {
  it("sums revenue/expense and computes margin%", () => {
    const result = computeCenterProfitability([
      { kind: "REVENUE", amount: 1000 },
      { kind: "revenue", amount: 500 },
      { kind: "EXPENSE", amount: 900 },
    ]);
    expect(result).toEqual({
      revenue: 1500,
      expense: 900,
      margin: 600,
      marginPct: 40,
    });
  });

  it("is zero-margin% with no revenue", () => {
    const result = computeCenterProfitability([
      { kind: "EXPENSE", amount: 300 },
    ]);
    expect(result.margin).toBe(-300);
    expect(result.marginPct).toBe(0);
  });
});

describe("budgetVariance", () => {
  it("flags under and over budget", () => {
    expect(budgetVariance(1000, 800)).toEqual({
      variance: 200,
      variancePct: 20,
      over: false,
    });
    const over = budgetVariance(1000, 1200);
    expect(over.variance).toBe(-200);
    expect(over.over).toBe(true);
  });
});

describe("K-14 audit coverage", () => {
  it("createCostCenter, setCostCenterActive, and recordCostEntry write an AuditLog row", () => {
    const source = readFileSync(
      path.join(process.cwd(), "src/server/services/cost-accounting.ts"),
      "utf8",
    );

    for (const operation of [
      "createCostCenter",
      "setCostCenterActive",
      "recordCostEntry",
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
