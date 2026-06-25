import { describe, expect, it } from "vitest";

import { buildFinancialStatements } from "./financial-statements";

describe("buildFinancialStatements", () => {
  it("derives P&L and a balanced balance sheet from trial-balance rows", () => {
    // Sale: Dr AR 1180 / Cr Revenue 1000 / Cr VAT 180; COGS: Dr COGS 400 / Cr Inventory 400
    const rows = [
      { type: "ASSET", balance: 1180 }, // accounts receivable
      { type: "ASSET", balance: -400 }, // inventory relieved
      { type: "REVENUE", balance: 1000 },
      { type: "LIABILITY", balance: 180 }, // VAT output
      { type: "EXPENSE", balance: 400 }, // COGS
    ];

    const statements = buildFinancialStatements(rows);

    expect(statements.incomeStatement).toEqual({
      revenue: 1000,
      expenses: 400,
      netIncome: 600,
    });
    expect(statements.balanceSheet).toEqual({
      assets: 780,
      liabilities: 180,
      equity: 0,
      netIncome: 600,
      balanced: true,
    });
  });

  it("is all-zero and balanced with no activity", () => {
    const statements = buildFinancialStatements([]);
    expect(statements.incomeStatement.netIncome).toBe(0);
    expect(statements.balanceSheet.balanced).toBe(true);
  });
});
