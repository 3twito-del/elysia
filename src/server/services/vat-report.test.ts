import { describe, expect, it } from "vitest";

import { ACCOUNT } from "./ledger-accounts";
import { summarizeVat } from "./vat-report";

describe("summarizeVat", () => {
  it("nets output VAT (sales) against input VAT (purchases)", () => {
    const summary = summarizeVat([
      { code: ACCOUNT.VAT_OUTPUT, debit: 0, credit: 180 },
      { code: ACCOUNT.VAT_INPUT, debit: 90, credit: 0 },
      { code: ACCOUNT.SALES_REVENUE, debit: 0, credit: 1000 },
    ]);

    expect(summary).toEqual({
      outputVat: 180,
      inputVat: 90,
      netVatDue: 90,
      salesBase: 1000,
    });
  });

  it("handles reversals (debits on the VAT accounts) and is zero when empty", () => {
    expect(summarizeVat([])).toEqual({
      outputVat: 0,
      inputVat: 0,
      netVatDue: 0,
      salesBase: 0,
    });

    const withReversal = summarizeVat([
      { code: ACCOUNT.VAT_OUTPUT, debit: 18, credit: 180 },
    ]);
    expect(withReversal.outputVat).toBe(162);
  });
});
