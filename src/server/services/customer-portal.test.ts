import { describe, expect, it } from "vitest";

import { summarizeCustomerInvoices } from "./customer-portal";

describe("summarizeCustomerInvoices", () => {
  it("sums paid and only counts open invoices toward outstanding", () => {
    expect(
      summarizeCustomerInvoices([
        { status: "PAID", total: 1000, paidTotal: 1000 },
        { status: "PARTIALLY_PAID", total: 500, paidTotal: 200 },
        { status: "ISSUED", total: 300, paidTotal: 0 },
        { status: "CANCELLED", total: 999, paidTotal: 0 },
      ]),
    ).toEqual({ count: 4, outstanding: 600, paid: 1200 });
  });

  it("handles an empty list", () => {
    expect(summarizeCustomerInvoices([])).toEqual({
      count: 0,
      outstanding: 0,
      paid: 0,
    });
  });
});
