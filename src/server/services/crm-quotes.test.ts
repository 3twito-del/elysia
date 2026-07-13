import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  computeQuoteTotals,
  isQuoteExpired,
  parseQuoteLines,
} from "./crm-quotes";

describe("computeQuoteTotals", () => {
  it("computes subtotal, VAT and total", () => {
    const totals = computeQuoteTotals({
      lines: [
        { quantity: 2, unitPrice: 50 },
        { quantity: 1, unitPrice: 100 },
      ],
      taxRate: 0.18,
    });
    expect(totals).toEqual({ subtotal: 200, taxTotal: 36, total: 236 });
  });
});

describe("parseQuoteLines", () => {
  it("parses 'description | qty | price' rows and skips blanks", () => {
    expect(
      parseQuoteLines("Ring | 2 | 500\n\nNecklace | 1 | 1200\n"),
    ).toEqual([
      { description: "Ring", quantity: 2, unitPrice: 500 },
      { description: "Necklace", quantity: 1, unitPrice: 1200 },
    ]);
  });

  it("defaults quantity to 1 and price to 0 when missing/invalid", () => {
    expect(parseQuoteLines("Service only")).toEqual([
      { description: "Service only", quantity: 1, unitPrice: 0 },
    ]);
  });
});

describe("isQuoteExpired", () => {
  const asOf = new Date("2026-06-24T00:00:00.000Z");
  const past = new Date("2026-06-01T00:00:00.000Z");
  const future = new Date("2026-07-01T00:00:00.000Z");

  it("is expired when sent and past its validity", () => {
    expect(isQuoteExpired({ status: "SENT", validUntil: past }, asOf)).toBe(
      true,
    );
  });

  it("is not expired when still valid", () => {
    expect(isQuoteExpired({ status: "SENT", validUntil: future }, asOf)).toBe(
      false,
    );
  });

  it("is not expired before it is sent", () => {
    expect(isQuoteExpired({ status: "DRAFT", validUntil: past }, asOf)).toBe(
      false,
    );
  });

  it("is not expired without a validity date", () => {
    expect(isQuoteExpired({ status: "SENT", validUntil: null }, asOf)).toBe(
      false,
    );
  });
});

describe("K-14 audit coverage", () => {
  it("decideQuote and convertQuoteToInvoice write an AuditLog row", () => {
    const source = readFileSync(
      path.join(process.cwd(), "src/server/services/crm-quotes.ts"),
      "utf8",
    );

    for (const operation of ["decideQuote", "convertQuoteToInvoice"]) {
      const start = source.indexOf(`export async function ${operation}`);
      const next = source.indexOf("\nexport async function ", start + 1);

      expect(start).toBeGreaterThanOrEqual(0);

      const body = source.slice(start, next === -1 ? source.length : next);

      expect(body).toContain("writeAdminAudit");
    }
  });
});
