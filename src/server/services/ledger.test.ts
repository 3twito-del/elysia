import { describe, expect, it } from "vitest";

import {
  ACCOUNT,
  assertBalanced,
  buildCustomerReceiptJournalLines,
  buildPurchaseReceiptJournalLines,
  buildSaleJournalLines,
  buildVendorInvoiceJournalLines,
  buildVendorPaymentJournalLines,
  summarizeJournalLines,
} from "./ledger";

describe("summarizeJournalLines / assertBalanced", () => {
  it("detects balanced and unbalanced sets", () => {
    expect(
      summarizeJournalLines([
        { debit: 100, credit: 0 },
        { debit: 0, credit: 100 },
      ]).balanced,
    ).toBe(true);

    expect(
      summarizeJournalLines([
        { debit: 100, credit: 0 },
        { debit: 0, credit: 90 },
      ]).balanced,
    ).toBe(false);
  });

  it("throws on an unbalanced entry", () => {
    expect(() =>
      assertBalanced([
        { debit: 50, credit: 0 },
        { debit: 0, credit: 49 },
      ]),
    ).toThrow(/not balanced/);
  });
});

describe("buildSaleJournalLines", () => {
  it("extracts VAT from a VAT-inclusive gross total and balances", () => {
    const lines = buildSaleJournalLines({ grossTotal: 118, vatRate: 0.18 });
    const summary = assertBalanced(lines);
    expect(summary.totalDebit).toBe(118);

    expect(
      lines.find((line) => line.accountCode === ACCOUNT.ACCOUNTS_RECEIVABLE)
        ?.debit,
    ).toBe(118);
    expect(
      lines.find((line) => line.accountCode === ACCOUNT.SALES_REVENUE)?.credit,
    ).toBe(100);
    expect(
      lines.find((line) => line.accountCode === ACCOUNT.VAT_OUTPUT)?.credit,
    ).toBe(18);
  });

  it("omits a VAT line when there is no VAT", () => {
    const lines = buildSaleJournalLines({ grossTotal: 100, vatRate: 0 });
    expect(
      lines.some((line) => line.accountCode === ACCOUNT.VAT_OUTPUT),
    ).toBe(false);
    assertBalanced(lines);
  });

  it("relieves inventory into COGS and still balances", () => {
    const lines = buildSaleJournalLines({
      grossTotal: 236,
      vatRate: 0.18,
      cogs: 80,
    });
    const summary = assertBalanced(lines);
    expect(summary.totalDebit).toBe(316); // gross 236 + cogs 80 on each side

    expect(
      lines.find((line) => line.accountCode === ACCOUNT.COGS)?.debit,
    ).toBe(80);
    expect(
      lines.find((line) => line.accountCode === ACCOUNT.INVENTORY)?.credit,
    ).toBe(80);
  });
});

describe("buildPurchaseReceiptJournalLines", () => {
  it("debits inventory and credits GRNI for the cost", () => {
    const lines = buildPurchaseReceiptJournalLines({ cost: 250 });
    assertBalanced(lines);

    expect(
      lines.find((line) => line.accountCode === ACCOUNT.INVENTORY)?.debit,
    ).toBe(250);
    expect(
      lines.find((line) => line.accountCode === ACCOUNT.GRNI)?.credit,
    ).toBe(250);
  });
});

describe("buildVendorInvoiceJournalLines", () => {
  it("clears GRNI + VAT input into AP and balances", () => {
    const lines = buildVendorInvoiceJournalLines({
      goodsValue: 250,
      taxTotal: 45,
    });
    const summary = assertBalanced(lines);
    expect(summary.totalDebit).toBe(295);

    expect(lines.find((line) => line.accountCode === ACCOUNT.GRNI)?.debit).toBe(
      250,
    );
    expect(
      lines.find((line) => line.accountCode === ACCOUNT.VAT_INPUT)?.debit,
    ).toBe(45);
    expect(
      lines.find((line) => line.accountCode === ACCOUNT.ACCOUNTS_PAYABLE)
        ?.credit,
    ).toBe(295);
  });

  it("omits the VAT line when there is no tax", () => {
    const lines = buildVendorInvoiceJournalLines({ goodsValue: 100 });
    expect(
      lines.some((line) => line.accountCode === ACCOUNT.VAT_INPUT),
    ).toBe(false);
    assertBalanced(lines);
  });
});

describe("buildVendorPaymentJournalLines", () => {
  it("debits AP and credits cash", () => {
    const lines = buildVendorPaymentJournalLines({ amount: 295 });
    assertBalanced(lines);

    expect(
      lines.find((line) => line.accountCode === ACCOUNT.ACCOUNTS_PAYABLE)
        ?.debit,
    ).toBe(295);
    expect(lines.find((line) => line.accountCode === ACCOUNT.CASH)?.credit).toBe(
      295,
    );
  });
});

describe("buildCustomerReceiptJournalLines", () => {
  it("debits cash and credits AR", () => {
    const lines = buildCustomerReceiptJournalLines({ amount: 826 });
    assertBalanced(lines);

    expect(lines.find((line) => line.accountCode === ACCOUNT.CASH)?.debit).toBe(
      826,
    );
    expect(
      lines.find((line) => line.accountCode === ACCOUNT.ACCOUNTS_RECEIVABLE)
        ?.credit,
    ).toBe(826);
  });
});
