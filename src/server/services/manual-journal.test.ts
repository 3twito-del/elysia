import { describe, expect, it } from "vitest";

import { parseJournalLines } from "./manual-journal";

describe("parseJournalLines", () => {
  it("parses a balanced two-sided entry", () => {
    const lines = parseJournalLines("1000 | 500 | 0\n3000 | 0 | 500");
    expect(lines).toEqual([
      { accountCode: "1000", debit: 500, credit: 0 },
      { accountCode: "3000", debit: 0, credit: 500 },
    ]);
  });

  it("skips blank lines and trims whitespace", () => {
    const lines = parseJournalLines("\n  5000|100|0  \n\n1000|0|100\n");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toEqual({ accountCode: "5000", debit: 100, credit: 0 });
  });

  it("rejects a line with both debit and credit", () => {
    expect(() => parseJournalLines("1000|50|50")).toThrow(/חובה וגם זכות/);
  });

  it("rejects a line with no amount", () => {
    expect(() => parseJournalLines("1000|0|0")).toThrow(/ללא סכום/);
  });

  it("rejects a line with no account code", () => {
    expect(() => parseJournalLines("|100|0")).toThrow(/ללא קוד חשבון/);
  });

  it("rejects negative amounts", () => {
    expect(() => parseJournalLines("1000|-5|0")).toThrow(/שליליים/);
  });
});
