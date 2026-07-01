import { describe, expect, it } from "vitest";

import { build810, build850, build856, ediSegment, x12Date } from "./edi";

describe("ediSegment + x12Date", () => {
  it("joins elements with * and ends with ~", () => {
    expect(ediSegment("PO1", 1, 5, "EA")).toBe("PO1*1*5*EA~");
  });
  it("formats YYYYMMDD", () => {
    expect(x12Date(new Date("2026-03-07T10:00:00Z"))).toBe("20260307");
  });
});

describe("build850", () => {
  const doc = build850({
    poNumber: "PO-1001",
    poDate: new Date("2026-03-07T00:00:00Z"),
    vendorName: "Acme",
    senderId: "ELYSIA",
    receiverId: "ACME",
    controlNumber: 1,
    lines: [
      { sku: "SKU-1", description: "Ring", quantity: 3, unitCost: 100 },
      { sku: "SKU-2", description: "Chain", quantity: 1, unitCost: 250 },
    ],
  });

  it("wraps a valid envelope with ST*850 and PO1 lines", () => {
    expect(doc.startsWith("ISA*")).toBe(true);
    expect(doc).toContain("ST*850*0001~");
    expect(doc).toContain("BEG*00*SA*PO-1001");
    expect((doc.match(/PO1\*/g) ?? []).length).toBe(2);
    expect(doc).toContain("CTT*2~");
    expect(doc.trimEnd().endsWith("IEA*1*000000001~")).toBe(true);
  });

  it("SE segment count matches the transaction set", () => {
    // ST + BEG + DTM + N1 + 2×PO1 + CTT + SE = 8
    expect(doc).toContain("SE*8*0001~");
  });
});

describe("build810", () => {
  it("builds an invoice with BIG, IT1 lines and TDS total", () => {
    const doc = build810({
      invoiceNumber: "INV-9",
      invoiceDate: new Date("2026-03-07T00:00:00Z"),
      vendorName: "Acme",
      senderId: "ELYSIA",
      receiverId: "ACME",
      controlNumber: 2,
      total: 350,
      lines: [{ sku: "SKU-1", quantity: 1, unitPrice: 350 }],
    });
    expect(doc).toContain("ST*810*0001~");
    expect(doc).toContain("BIG*20260307*INV-9~");
    expect(doc).toContain("TDS*35000~");
    expect(doc).toContain("CTT*1~");
  });
});

describe("build856", () => {
  const doc = build856({
    shipmentId: "SHP-77",
    shipDate: new Date("2026-03-07T08:30:00Z"),
    orderNumber: "ORD-500",
    shipToName: "Buyer Co",
    carrier: "UPS",
    tracking: "1Z-ABC",
    senderId: "ELYSIA",
    receiverId: "ORD-500",
    controlNumber: 3,
    lines: [
      { sku: "SKU-1", quantity: 3 },
      { sku: "SKU-2", quantity: 1 },
    ],
  });

  it("builds the S→O→I HL hierarchy with BSN and PRF", () => {
    expect(doc).toContain("ST*856*0001~");
    expect(doc).toContain("BSN*00*SHP-77*20260307*0830~");
    expect(doc).toContain("HL*1**S~");
    expect(doc).toContain("HL*2*1*O~");
    expect(doc).toContain("PRF*ORD-500~");
    expect(doc).toContain("REF*CN*1Z-ABC~");
    expect((doc.match(/SN1\*/g) ?? []).length).toBe(2);
  });

  it("counts HL segments in CTT and closes the envelope", () => {
    // shipment(1) + order(1) + 2 items = 4 HL loops
    expect(doc).toContain("CTT*4~");
    // ST + BSN + HL/S + TD1 + TD5 + REF + DTM + N1 + HL/O + PRF
    //   + 2×(HL/I + LIN + SN1) + CTT + SE = 18
    expect(doc).toContain("SE*18*0001~");
    expect(doc.trimEnd().endsWith("IEA*1*000000003~")).toBe(true);
  });
});
