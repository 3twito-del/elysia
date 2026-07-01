import { describe, expect, it } from "vitest";

import {
  buildA100,
  buildC100,
  buildUniformStructure,
  buildZ900,
  padNum,
  padText,
  shaamAmount,
  shaamDate,
  type ShaamDocument,
  type ShaamMovement,
} from "./shaam-export";

describe("field encoders", () => {
  it("pads numbers right-aligned zero-filled", () => {
    expect(padNum(42, 6)).toBe("000042");
    expect(padNum("12-34", 4)).toBe("1234");
    expect(padNum(1234567, 4)).toBe("4567"); // keeps least-significant
  });

  it("pads text left-aligned space-filled and truncates", () => {
    expect(padText("AB", 5)).toBe("AB   ");
    expect(padText("ABCDEF", 3)).toBe("ABC");
  });

  it("encodes dates as YYYYMMDD", () => {
    expect(shaamDate(new Date("2026-03-07T00:00:00Z"))).toBe("20260307");
  });

  it("encodes signed amounts in agorot", () => {
    expect(shaamAmount(12.34)).toBe("+00000000001234");
    expect(shaamAmount(-5)).toBe("-00000000000500");
  });
});

describe("records", () => {
  it("builds an A100 opening record with the version constant", () => {
    const a100 = buildA100({
      business: { vatNumber: "123456789", name: "X", primaryKey: "202603" },
      recordNumber: 1,
    });
    expect(a100.startsWith("A100")).toBe(true);
    expect(a100).toContain("&OF1.31&");
    expect(a100.slice(4, 13)).toBe("000000001");
  });

  it("builds a Z900 closing record with the total count", () => {
    const z900 = buildZ900({ recordNumber: 5, vatNumber: "123456789", totalRecords: 5 });
    expect(z900.startsWith("Z900")).toBe(true);
    expect(z900).toContain("000000000000005");
  });
});

describe("buildUniformStructure", () => {
  const movements: ShaamMovement[] = [
    {
      transactionNumber: "JE-1",
      lineNumber: 1,
      batch: "1",
      type: "sale",
      reference: "JE-1",
      details: "sale",
      date: new Date("2026-03-01T00:00:00Z"),
      accountKey: "1100",
      side: "DEBIT",
      currency: "ILS",
      amount: 100,
    },
    {
      transactionNumber: "JE-1",
      lineNumber: 2,
      batch: "1",
      type: "sale",
      reference: "JE-1",
      details: "sale",
      date: new Date("2026-03-01T00:00:00Z"),
      accountKey: "4000",
      side: "CREDIT",
      currency: "ILS",
      amount: 100,
    },
  ];

  it("emits A100 + B100×n + Z900 with control totals", () => {
    const result = buildUniformStructure({
      business: { vatNumber: "123456789", name: "X", primaryKey: "202603" },
      movements,
    });
    const rows = result.bkmvdata.split("\r\n");
    expect(rows[0]?.startsWith("A100")).toBe(true);
    expect(rows[1]?.startsWith("B100")).toBe(true);
    expect(rows[2]?.startsWith("B100")).toBe(true);
    expect(rows.at(-1)?.startsWith("Z900")).toBe(true);
    expect(result.summary).toEqual({
      recordCount: 4,
      movementCount: 2,
      documentCount: 0,
      totalDebit: 100,
      totalCredit: 100,
    });
    expect(result.ini).toContain("B100" + "000000000000002");
  });

  it("emits C100 + D110 records for documents and counts them", () => {
    const documents: ShaamDocument[] = [
      {
        docType: "320",
        docNumber: "INV-1",
        date: new Date("2026-03-02T00:00:00Z"),
        total: 234,
        lines: [
          { description: "Ring", quantity: 1, unitPrice: 200, lineTotal: 200 },
          { description: "Gift wrap", quantity: 1, unitPrice: 34, lineTotal: 34 },
        ],
      },
    ];
    const result = buildUniformStructure({
      business: { vatNumber: "123456789", name: "X", primaryKey: "202603" },
      movements,
      documents,
    });
    const rows = result.bkmvdata.split("\r\n");
    expect(rows.some((r) => r.startsWith("C100"))).toBe(true);
    expect(rows.filter((r) => r.startsWith("D110"))).toHaveLength(2);
    // A100 + 2 B100 + C100 + 2 D110 + Z900 = 7
    expect(result.summary.recordCount).toBe(7);
    expect(result.summary.documentCount).toBe(1);
    expect(result.ini).toContain("C100" + "000000000000001");
    expect(result.ini).toContain("D110" + "000000000000002");
  });
});

describe("buildC100", () => {
  it("builds a document header with type and number", () => {
    const c100 = buildC100({
      document: {
        docType: "320",
        docNumber: "INV-9",
        date: new Date("2026-03-02T00:00:00Z"),
        total: 100,
        lines: [],
      },
      recordNumber: 3,
      vatNumber: "123456789",
    });
    expect(c100.startsWith("C100")).toBe(true);
    expect(c100).toContain("INV-9");
  });
});
