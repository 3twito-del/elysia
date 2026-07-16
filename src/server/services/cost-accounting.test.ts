import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  aggregateProfitability,
  budgetVariance,
  computeCenterProfitability,
  normalizeCenterKind,
  normalizeEntryKind,
  resolveLineUnitCost,
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

describe("resolveLineUnitCost", () => {
  it("prefers the latest cost snapshot when present", () => {
    expect(
      resolveLineUnitCost({ latestSnapshotUnitCost: 120, unitPrice: 500 }),
    ).toBe(120);
  });

  it("falls back to 40% of unit price with no snapshot", () => {
    expect(
      resolveLineUnitCost({ latestSnapshotUnitCost: null, unitPrice: 500 }),
    ).toBe(200);
  });

  it("falls back when the snapshot cost is zero/invalid", () => {
    expect(
      resolveLineUnitCost({ latestSnapshotUnitCost: 0, unitPrice: 500 }),
    ).toBe(200);
  });
});

describe("aggregateProfitability", () => {
  it("computes revenue/COGS/margin per key and sorts by margin desc", () => {
    const rows = aggregateProfitability([
      {
        key: "product-a",
        label: "Product A",
        quantity: 10,
        refundedQuantity: 0,
        unitPrice: 100,
        unitCost: 40,
      },
      {
        key: "product-b",
        label: "Product B",
        quantity: 5,
        refundedQuantity: 0,
        unitPrice: 1000,
        unitCost: 900,
      },
    ]);

    expect(rows).toEqual([
      {
        key: "product-a",
        label: "Product A",
        unitsSold: 10,
        revenue: 1000,
        cogs: 400,
        margin: 600,
        marginPct: 60,
      },
      {
        key: "product-b",
        label: "Product B",
        unitsSold: 5,
        revenue: 5000,
        cogs: 4500,
        margin: 500,
        marginPct: 10,
      },
    ]);
  });

  it("nets out refunded quantity before computing revenue/COGS", () => {
    const rows = aggregateProfitability([
      {
        key: "product-a",
        label: "Product A",
        quantity: 10,
        refundedQuantity: 4,
        unitPrice: 100,
        unitCost: 40,
      },
    ]);

    expect(rows).toEqual([
      {
        key: "product-a",
        label: "Product A",
        unitsSold: 6,
        revenue: 600,
        cogs: 240,
        margin: 360,
        marginPct: 60,
      },
    ]);
  });

  it("drops a line entirely once its full quantity was refunded", () => {
    const rows = aggregateProfitability([
      {
        key: "product-a",
        label: "Product A",
        quantity: 3,
        refundedQuantity: 3,
        unitPrice: 100,
        unitCost: 40,
      },
    ]);

    expect(rows).toEqual([]);
  });

  it("sums multiple lines sharing the same key (e.g. two orders of the same product)", () => {
    const rows = aggregateProfitability([
      {
        key: "product-a",
        label: "Product A",
        quantity: 2,
        refundedQuantity: 0,
        unitPrice: 100,
        unitCost: 40,
      },
      {
        key: "product-a",
        label: "Product A",
        quantity: 3,
        refundedQuantity: 0,
        unitPrice: 100,
        unitCost: 40,
      },
    ]);

    expect(rows).toEqual([
      {
        key: "product-a",
        label: "Product A",
        unitsSold: 5,
        revenue: 500,
        cogs: 200,
        margin: 300,
        marginPct: 60,
      },
    ]);
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
