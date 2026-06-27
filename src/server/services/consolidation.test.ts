import { describe, expect, it } from "vitest";

import {
  consolidateTrialBalances,
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
    fxRate: 1,
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
    fxRate: 3.5,
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
