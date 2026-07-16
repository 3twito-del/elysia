import { describe, expect, it } from "vitest";

import {
  consolidateTrialBalances,
  rateForAccountType,
  splitConsolidatedStatements,
  summarizeIntercompany,
  translateAmount,
  type EntityTrialBalance,
} from "./consolidation";

describe("translateAmount", () => {
  it("applies the FX rate and rounds", () => {
    expect(translateAmount(100, 3.7)).toBe(370);
    expect(translateAmount(33.333, 1)).toBe(33.33);
  });
});

describe("consolidateTrialBalances", () => {
  const base: EntityTrialBalance = {
    entityId: "e1",
    entityCode: "IL",
    entityName: "Elysia IL",
    currency: "ILS",
    closingRate: 1,
    averageRate: 1,
    rows: [
      { accountCode: "1000", accountName: "Cash", accountType: "ASSET", normalSide: "DEBIT", debit: 1000, credit: 0 },
      { accountCode: "4000", accountName: "Revenue", accountType: "REVENUE", normalSide: "CREDIT", debit: 0, credit: 1000 },
    ],
  };

  const foreign: EntityTrialBalance = {
    entityId: "e2",
    entityCode: "US",
    entityName: "Elysia US",
    currency: "USD",
    closingRate: 3.5,
    averageRate: 3.5,
    rows: [
      { accountCode: "1000", accountName: "Cash", accountType: "ASSET", normalSide: "DEBIT", debit: 100, credit: 0 },
      { accountCode: "4000", accountName: "Revenue", accountType: "REVENUE", normalSide: "CREDIT", debit: 0, credit: 100 },
    ],
  };

  it("translates and merges by account, staying balanced", () => {
    const result = consolidateTrialBalances([base, foreign]);

    const cash = result.rows.find((row) => row.accountCode === "1000");
    expect(cash?.debit).toBe(1350); // 1000 + 100*3.5
    expect(cash?.balance).toBe(1350);

    const revenue = result.rows.find((row) => row.accountCode === "4000");
    expect(revenue?.credit).toBe(1350);
    expect(revenue?.balance).toBe(1350); // credit-normal

    expect(result.totalDebit).toBe(1350);
    expect(result.totalCredit).toBe(1350);
    expect(result.balanced).toBe(true);
  });
});

describe("rateForAccountType", () => {
  const rates = { closingRate: 3.6, averageRate: 3.4 };

  it("uses the average rate for revenue/expense (P&L)", () => {
    expect(rateForAccountType("REVENUE", rates)).toBe(3.4);
    expect(rateForAccountType("EXPENSE", rates)).toBe(3.4);
  });

  it("uses the closing rate for asset/liability/equity (balance sheet)", () => {
    expect(rateForAccountType("ASSET", rates)).toBe(3.6);
    expect(rateForAccountType("LIABILITY", rates)).toBe(3.6);
    expect(rateForAccountType("EQUITY", rates)).toBe(3.6);
  });
});

describe("consolidateTrialBalances with dual rates", () => {
  it("translates P&L accounts at the average rate and BS accounts at the closing rate", () => {
    const entity: EntityTrialBalance = {
      entityId: "e1",
      entityCode: "US",
      entityName: "Elysia US",
      currency: "USD",
      closingRate: 4,
      averageRate: 3.5,
      rows: [
        { accountCode: "1000", accountName: "Cash", accountType: "ASSET", normalSide: "DEBIT", debit: 100, credit: 0 },
        { accountCode: "4000", accountName: "Revenue", accountType: "REVENUE", normalSide: "CREDIT", debit: 0, credit: 100 },
      ],
    };

    const result = consolidateTrialBalances([entity]);
    const cash = result.rows.find((row) => row.accountCode === "1000");
    const revenue = result.rows.find((row) => row.accountCode === "4000");

    expect(cash?.debit).toBe(400); // 100 * closingRate(4)
    expect(revenue?.credit).toBe(350); // 100 * averageRate(3.5)
    // The raw trial balance no longer mechanically balances once P&L and BS
    // use different rates -- that's expected; splitConsolidatedStatements
    // surfaces the reconciling CTA instead of silently forcing a balance.
    expect(result.balanced).toBe(false);
  });
});

describe("splitConsolidatedStatements", () => {
  it("matches buildFinancialStatements' identity when rates are equal (no CTA)", () => {
    const statements = splitConsolidatedStatements([
      { accountCode: "1000", accountName: "Cash", accountType: "ASSET", debit: 1000, credit: 0, balance: 1000 },
      { accountCode: "2000", accountName: "AP", accountType: "LIABILITY", debit: 0, credit: 200, balance: 200 },
      { accountCode: "3000", accountName: "Equity", accountType: "EQUITY", debit: 0, credit: 300, balance: 300 },
      { accountCode: "4000", accountName: "Revenue", accountType: "REVENUE", debit: 0, credit: 700, balance: 700 },
      { accountCode: "5000", accountName: "COGS", accountType: "EXPENSE", debit: 200, credit: 0, balance: 200 },
    ]);

    expect(statements.incomeStatement.revenue).toBe(700);
    expect(statements.incomeStatement.expenses).toBe(200);
    expect(statements.incomeStatement.netIncome).toBe(500);
    expect(
      statements.incomeStatement.rows.map((row) => row.accountCode).sort(),
    ).toEqual(["4000", "5000"]);
    expect(statements.balanceSheet.cumulativeTranslationAdjustment).toBe(0);
    expect(statements.balanceSheet.balanced).toBe(true);
    // Assets(1000) = Liabilities(200) + Equity(300) + NetIncome(500)
    expect(statements.balanceSheet.assets).toBe(1000);
  });

  it("surfaces a nonzero CTA when the underlying rates diverged, keeping the identity balanced", () => {
    const entity: EntityTrialBalance = {
      entityId: "e1",
      entityCode: "US",
      entityName: "Elysia US",
      currency: "USD",
      closingRate: 4,
      averageRate: 3.5,
      rows: [
        { accountCode: "1000", accountName: "Cash", accountType: "ASSET", normalSide: "DEBIT", debit: 100, credit: 0 },
        { accountCode: "3000", accountName: "Equity", accountType: "EQUITY", normalSide: "CREDIT", debit: 0, credit: 20 },
        { accountCode: "4000", accountName: "Revenue", accountType: "REVENUE", normalSide: "CREDIT", debit: 0, credit: 100 },
        { accountCode: "5000", accountName: "Expense", accountType: "EXPENSE", normalSide: "DEBIT", debit: 80, credit: 0 },
      ],
    };

    const consolidated = consolidateTrialBalances([entity]);
    const statements = splitConsolidatedStatements(consolidated.rows);

    // Assets = 100*4 = 400; Equity = 20*4 = 80; NetIncome = (100-80)*3.5 = 70.
    // CTA = 400 - 0 - 80 - 70 = 250.
    expect(statements.balanceSheet.assets).toBe(400);
    expect(statements.balanceSheet.equity).toBe(80);
    expect(statements.incomeStatement.netIncome).toBe(70);
    expect(statements.balanceSheet.cumulativeTranslationAdjustment).toBe(250);
    expect(statements.balanceSheet.balanced).toBe(true);
  });
});

describe("summarizeIntercompany", () => {
  it("splits open from eliminated", () => {
    expect(
      summarizeIntercompany([
        { status: "OPEN", amount: 500 },
        { status: "OPEN", amount: 250 },
        { status: "ELIMINATED", amount: 1000 },
      ]),
    ).toEqual({
      open: 2,
      openAmount: 750,
      eliminated: 1,
      eliminatedAmount: 1000,
      total: 3,
    });
  });
});
