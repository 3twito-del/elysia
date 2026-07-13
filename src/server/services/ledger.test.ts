import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  ACCOUNT,
  assertBalanced,
  buildCustomerReceiptJournalLines,
  buildLandedCostJournalLines,
  buildPurchaseReceiptJournalLines,
  buildSaleJournalLines,
  buildSalesReturnJournalLines,
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

describe("buildSalesReturnJournalLines", () => {
  it("mirrors the sale: credits AR, reverses revenue/VAT, restores inventory", () => {
    const lines = buildSalesReturnJournalLines({
      grossTotal: 236,
      vatRate: 0.18,
      cogs: 80,
    });
    const summary = assertBalanced(lines);
    expect(summary.totalDebit).toBe(316); // gross 236 + cogs 80 on each side

    expect(
      lines.find((line) => line.accountCode === ACCOUNT.ACCOUNTS_RECEIVABLE)
        ?.credit,
    ).toBe(236);
    expect(
      lines.find((line) => line.accountCode === ACCOUNT.SALES_REVENUE)?.debit,
    ).toBe(200);
    expect(
      lines.find((line) => line.accountCode === ACCOUNT.VAT_OUTPUT)?.debit,
    ).toBe(36);
    expect(
      lines.find((line) => line.accountCode === ACCOUNT.INVENTORY)?.debit,
    ).toBe(80);
    expect(
      lines.find((line) => line.accountCode === ACCOUNT.COGS)?.credit,
    ).toBe(80);
  });

  it("omits VAT and COGS lines when they are zero", () => {
    const lines = buildSalesReturnJournalLines({ grossTotal: 100, vatRate: 0 });
    expect(lines.some((line) => line.accountCode === ACCOUNT.VAT_OUTPUT)).toBe(
      false,
    );
    expect(lines.some((line) => line.accountCode === ACCOUNT.COGS)).toBe(false);
    assertBalanced(lines);
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

describe("buildLandedCostJournalLines", () => {
  it("debits inventory and credits the clearing account, balanced", () => {
    const lines = buildLandedCostJournalLines({ amount: 400 });
    assertBalanced(lines);

    expect(
      lines.find((line) => line.accountCode === ACCOUNT.INVENTORY)?.debit,
    ).toBe(400);
    expect(
      lines.find(
        (line) => line.accountCode === ACCOUNT.LANDED_COST_CLEARING,
      )?.credit,
    ).toBe(400);
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

describe("K-14 audit coverage", () => {
  it("seedChartOfAccounts writes an AuditLog row", () => {
    const source = readFileSync(
      path.join(process.cwd(), "src/server/services/ledger.ts"),
      "utf8",
    );
    const start = source.indexOf("export async function seedChartOfAccounts(");
    const next = source.indexOf("\nexport async function ", start + 1);

    expect(start).toBeGreaterThanOrEqual(0);

    const body = source.slice(start, next === -1 ? source.length : next);

    expect(body).toContain("writeAdminAudit");
  });
});
