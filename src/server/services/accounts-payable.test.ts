import { describe, expect, it } from "vitest";

import {
  computeApAging,
  computeThreeWayMatch,
  computeVendorInvoiceTotals,
} from "./accounts-payable";

const dayMs = 24 * 60 * 60 * 1000;

describe("computeVendorInvoiceTotals", () => {
  it("computes subtotal, VAT and total", () => {
    const totals = computeVendorInvoiceTotals({
      lines: [{ quantity: 2, unitCost: 50 }],
      taxRate: 0.18,
    });
    expect(totals).toEqual({ subtotal: 100, taxTotal: 18, total: 118 });
  });

  it("honours an explicit tax amount", () => {
    const totals = computeVendorInvoiceTotals({
      lines: [{ quantity: 1, unitCost: 100 }],
      taxTotal: 0,
    });
    expect(totals).toEqual({ subtotal: 100, taxTotal: 0, total: 100 });
  });
});

describe("computeThreeWayMatch", () => {
  const poItems = [
    { id: "a", quantity: 10, unitCost: 5, receivedQuantity: 10 },
  ];

  it("matches when quantity and price agree within tolerance", () => {
    const result = computeThreeWayMatch({
      poItems,
      invoiceLines: [{ purchaseOrderItemId: "a", quantity: 10, unitCost: 5 }],
    });
    expect(result.status).toBe("MATCHED");
    expect(result.lines[0]?.issues).toEqual([]);
  });

  it("flags a price variance beyond tolerance", () => {
    const result = computeThreeWayMatch({
      poItems,
      invoiceLines: [{ purchaseOrderItemId: "a", quantity: 10, unitCost: 6 }],
    });
    expect(result.status).toBe("VARIANCE");
    expect(result.lines[0]?.issues).toContain("price_variance");
  });

  it("flags invoicing more than was received and ordered", () => {
    const result = computeThreeWayMatch({
      poItems,
      invoiceLines: [{ purchaseOrderItemId: "a", quantity: 12, unitCost: 5 }],
    });
    expect(result.status).toBe("VARIANCE");
    expect(result.lines[0]?.issues).toContain("invoiced_more_than_received");
    expect(result.lines[0]?.issues).toContain("invoiced_more_than_ordered");
  });

  it("flags invoice lines with no matching PO line", () => {
    const result = computeThreeWayMatch({
      poItems,
      invoiceLines: [{ purchaseOrderItemId: "ghost", quantity: 1, unitCost: 5 }],
    });
    expect(result.status).toBe("VARIANCE");
    expect(result.lines[0]?.issues).toContain("no_matching_po_line");
  });
});

describe("computeApAging", () => {
  it("buckets open invoices by days overdue and ignores paid/cancelled", () => {
    const asOf = new Date("2026-06-24T00:00:00.000Z");
    const due = (daysAgo: number) => new Date(asOf.getTime() - daysAgo * dayMs);

    const aging = computeApAging(
      [
        { total: 100, paidTotal: 0, dueDate: null, status: "APPROVED" },
        { total: 200, paidTotal: 50, dueDate: due(10), status: "PARTIALLY_PAID" },
        { total: 300, paidTotal: 0, dueDate: due(45), status: "APPROVED" },
        { total: 400, paidTotal: 0, dueDate: due(100), status: "APPROVED" },
        { total: 500, paidTotal: 500, dueDate: due(5), status: "PARTIALLY_PAID" },
        { total: 999, paidTotal: 0, dueDate: due(200), status: "PAID" },
      ],
      asOf,
    );

    expect(aging.notDue).toBe(100);
    expect(aging.days1to30).toBe(150);
    expect(aging.days31to60).toBe(300);
    expect(aging.days90plus).toBe(400);
    expect(aging.total).toBe(950);
  });
});
