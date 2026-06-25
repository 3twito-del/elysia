import { describe, expect, it } from "vitest";

import { buildClosingEntryLines, periodBounds } from "./period-close";

function sums(lines: Array<{ debit: number; credit: number }>) {
  const debit = lines.reduce((sum, line) => sum + line.debit, 0);
  const credit = lines.reduce((sum, line) => sum + line.credit, 0);
  return { debit, credit };
}

describe("buildClosingEntryLines", () => {
  it("closes a profitable period to retained earnings and balances", () => {
    const lines = buildClosingEntryLines([
      { code: "1100", type: "ASSET", balance: 1180 }, // ignored
      { code: "2100", type: "LIABILITY", balance: 180 }, // ignored
      { code: "4000", type: "REVENUE", balance: 1000 },
      { code: "5000", type: "EXPENSE", balance: 400 },
    ]);

    // Dr Revenue 1000, Cr Expense 400, Cr Retained Earnings 600 (net income).
    expect(lines).toContainEqual({
      accountCode: "4000",
      debit: 1000,
      credit: 0,
      memo: "סגירת הכנסות",
    });
    expect(lines).toContainEqual({
      accountCode: "5000",
      debit: 0,
      credit: 400,
      memo: "סגירת הוצאות",
    });
    expect(lines).toContainEqual({
      accountCode: "3100",
      debit: 0,
      credit: 600,
      memo: "רווח נקי לתקופה",
    });

    const { debit, credit } = sums(lines);
    expect(debit).toBe(credit);
  });

  it("closes a loss period by debiting retained earnings", () => {
    const lines = buildClosingEntryLines([
      { code: "4000", type: "REVENUE", balance: 100 },
      { code: "5000", type: "EXPENSE", balance: 400 },
    ]);

    expect(lines).toContainEqual({
      accountCode: "3100",
      debit: 300,
      credit: 0,
      memo: "הפסד לתקופה",
    });
    const { debit, credit } = sums(lines);
    expect(debit).toBe(credit);
  });

  it("returns no lines when there is no P&L activity", () => {
    expect(
      buildClosingEntryLines([{ code: "1000", type: "ASSET", balance: 500 }]),
    ).toEqual([]);
  });
});

describe("periodBounds", () => {
  it("spans the calendar month in UTC", () => {
    const { start, endExclusive, lastDay } = periodBounds(2026, 2);
    expect(start.toISOString()).toBe("2026-02-01T00:00:00.000Z");
    expect(endExclusive.toISOString()).toBe("2026-03-01T00:00:00.000Z");
    expect(lastDay.toISOString()).toBe("2026-02-28T00:00:00.000Z");
  });
});
