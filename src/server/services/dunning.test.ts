import { describe, expect, it } from "vitest";

import { buildDunningWorklist, daysOverdue, dunningLevel } from "./dunning";

const asOf = new Date("2026-04-01T00:00:00Z");

describe("daysOverdue", () => {
  it("counts whole days past due, else 0", () => {
    expect(daysOverdue(new Date("2026-03-22"), asOf)).toBe(10);
    expect(daysOverdue(new Date("2026-05-01"), asOf)).toBe(0);
    expect(daysOverdue(null, asOf)).toBe(0);
  });
});

describe("dunningLevel", () => {
  it("escalates by overdue bucket", () => {
    expect(dunningLevel(0)).toBe(0);
    expect(dunningLevel(15)).toBe(1);
    expect(dunningLevel(45)).toBe(2);
    expect(dunningLevel(75)).toBe(3);
    expect(dunningLevel(120)).toBe(4);
  });
});

describe("buildDunningWorklist", () => {
  it("includes only overdue open invoices with a balance, most overdue first", () => {
    const worklist = buildDunningWorklist(
      [
        {
          id: "a",
          invoiceNumber: "INV-A",
          total: 100,
          paidTotal: 0,
          dueDate: new Date("2026-03-01"), // 31 days → level 2
          status: "ISSUED",
        },
        {
          id: "b",
          invoiceNumber: "INV-B",
          total: 50,
          paidTotal: 0,
          dueDate: new Date("2026-03-25"), // 7 days → level 1
          status: "PARTIALLY_PAID",
        },
        {
          id: "paid",
          invoiceNumber: "INV-P",
          total: 100,
          paidTotal: 100,
          dueDate: new Date("2026-01-01"),
          status: "PAID",
        },
        {
          id: "future",
          invoiceNumber: "INV-F",
          total: 20,
          paidTotal: 0,
          dueDate: new Date("2026-05-01"),
          status: "ISSUED",
        },
      ],
      asOf,
    );
    expect(worklist.map((entry) => entry.id)).toEqual(["a", "b"]);
    expect(worklist[0]!.level).toBe(2);
    expect(worklist[1]!.level).toBe(1);
  });
});
