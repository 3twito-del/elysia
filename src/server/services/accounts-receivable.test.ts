import { describe, expect, it } from "vitest";

import {
  computeArAging,
  computeCustomerInvoiceTotals,
} from "./accounts-receivable";

const dayMs = 24 * 60 * 60 * 1000;

describe("computeCustomerInvoiceTotals", () => {
  it("computes subtotal, VAT and total", () => {
    const totals = computeCustomerInvoiceTotals({
      lines: [
        { quantity: 1, unitPrice: 500 },
        { quantity: 2, unitPrice: 100 },
      ],
      taxRate: 0.18,
    });
    expect(totals).toEqual({ subtotal: 700, taxTotal: 126, total: 826 });
  });

  it("honours an explicit tax amount", () => {
    const totals = computeCustomerInvoiceTotals({
      lines: [{ quantity: 1, unitPrice: 200 }],
      taxTotal: 0,
    });
    expect(totals).toEqual({ subtotal: 200, taxTotal: 0, total: 200 });
  });
});

describe("computeArAging", () => {
  it("buckets open invoices by days overdue and ignores paid/cancelled", () => {
    const asOf = new Date("2026-06-24T00:00:00.000Z");
    const due = (daysAgo: number) => new Date(asOf.getTime() - daysAgo * dayMs);

    const aging = computeArAging(
      [
        { total: 100, paidTotal: 0, dueDate: null, status: "ISSUED" },
        { total: 200, paidTotal: 50, dueDate: due(10), status: "PARTIALLY_PAID" },
        { total: 300, paidTotal: 0, dueDate: due(75), status: "ISSUED" },
        { total: 400, paidTotal: 0, dueDate: due(120), status: "ISSUED" },
        { total: 500, paidTotal: 500, dueDate: due(5), status: "PARTIALLY_PAID" },
        { total: 999, paidTotal: 0, dueDate: due(200), status: "PAID" },
      ],
      asOf,
    );

    expect(aging.notDue).toBe(100);
    expect(aging.days1to30).toBe(150);
    expect(aging.days61to90).toBe(300);
    expect(aging.days90plus).toBe(400);
    expect(aging.total).toBe(950);
  });
});
