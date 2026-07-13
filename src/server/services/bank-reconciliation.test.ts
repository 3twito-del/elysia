import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  matchStatementLines,
  parseBankStatementCsv,
  summarizeReconciliation,
} from "./bank-reconciliation";

describe("parseBankStatementCsv", () => {
  it("parses signed rows and skips the header", () => {
    const lines = parseBankStatementCsv(
      "date,description,amount,reference\n2026-06-01,תקבול לקוח,1180,REF1\n2026-06-03,תשלום ספק,-400",
    );

    expect(lines).toHaveLength(2);
    expect(lines[0]).toMatchObject({
      description: "תקבול לקוח",
      amount: 1180,
      reference: "REF1",
    });
    expect(lines[0]?.statementDate.toISOString()).toBe(
      "2026-06-01T00:00:00.000Z",
    );
    expect(lines[1]).toMatchObject({ amount: -400 });
  });

  it("skips blank and zero-amount rows", () => {
    const lines = parseBankStatementCsv("\n2026-06-01,nil,0\n2026-06-02,ok,50");
    expect(lines).toHaveLength(1);
    expect(lines[0]?.amount).toBe(50);
  });
});

describe("matchStatementLines", () => {
  it("matches by equal amount within the date window, closest first", () => {
    const matches = matchStatementLines(
      [
        { id: "b1", statementDate: new Date("2026-06-02"), amount: 1180 },
        { id: "b2", statementDate: new Date("2026-06-10"), amount: -400 },
      ],
      [
        { id: "g1", entryDate: new Date("2026-06-01"), cashDelta: 1180 },
        { id: "g2", entryDate: new Date("2026-06-09"), cashDelta: -400 },
      ],
    );

    expect(matches).toEqual([
      { bankLineId: "b1", journalEntryId: "g1" },
      { bankLineId: "b2", journalEntryId: "g2" },
    ]);
  });

  it("does not reuse a GL entry and leaves far/no matches unmatched", () => {
    const matches = matchStatementLines(
      [
        { id: "b1", statementDate: new Date("2026-06-02"), amount: 100 },
        { id: "b2", statementDate: new Date("2026-06-02"), amount: 100 },
        { id: "b3", statementDate: new Date("2026-12-31"), amount: 100 },
      ],
      [{ id: "g1", entryDate: new Date("2026-06-02"), cashDelta: 100 }],
    );

    expect(matches).toEqual([{ bankLineId: "b1", journalEntryId: "g1" }]);
  });
});

describe("summarizeReconciliation", () => {
  it("counts by status and sums amounts", () => {
    const summary = summarizeReconciliation([
      { status: "MATCHED", amount: 1180 },
      { status: "UNMATCHED", amount: -400 },
      { status: "IGNORED", amount: 25 },
    ]);

    expect(summary).toEqual({
      matched: 1,
      unmatched: 1,
      ignored: 1,
      unmatchedAmount: -400,
      statementBalance: 805,
    });
  });
});

describe("K-14 audit coverage", () => {
  it("bank reconciliation mutations write an AuditLog row, and auto-match uses a callback-form transaction", () => {
    const source = readFileSync(
      path.join(process.cwd(), "src/server/services/bank-reconciliation.ts"),
      "utf8",
    );

    for (const operation of [
      "importBankStatementLines",
      "autoMatchBankStatement",
      "ignoreBankStatementLine",
    ]) {
      const start = source.indexOf(`export async function ${operation}`);
      const next = source.indexOf("\nexport async function ", start + 1);

      expect(start).toBeGreaterThanOrEqual(0);

      const body = source.slice(start, next === -1 ? source.length : next);

      expect(body).toContain("writeAdminAudit");
    }

    const autoMatchStart = source.indexOf(
      "export async function autoMatchBankStatement",
    );
    const autoMatchNext = source.indexOf(
      "\nexport async function ",
      autoMatchStart + 1,
    );
    const autoMatchBody = source.slice(autoMatchStart, autoMatchNext);

    // K-01/I-342 gotcha: db.$transaction([...]) (array form) throws under
    // this repo's retry-proxy wrapper — must use the callback form.
    expect(autoMatchBody).toContain("db.$transaction(async (tx)");
    expect(autoMatchBody).not.toMatch(/db\.\$transaction\(\s*matches\.map/);
  });
});
