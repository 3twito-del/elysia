import { describe, expect, it } from "vitest";

import { computeVendorScorecard, isTokenValid } from "./vendor-portal";

describe("isTokenValid", () => {
  const now = new Date("2026-06-27T00:00:00Z");

  it("rejects inactive tokens", () => {
    expect(isTokenValid({ isActive: false, expiresAt: null }, now)).toBe(false);
  });

  it("accepts active, unexpired (or never-expiring) tokens", () => {
    expect(isTokenValid({ isActive: true, expiresAt: null }, now)).toBe(true);
    expect(
      isTokenValid({ isActive: true, expiresAt: new Date("2026-06-28T00:00:00Z") }, now),
    ).toBe(true);
  });

  it("rejects expired tokens", () => {
    expect(
      isTokenValid({ isActive: true, expiresAt: new Date("2026-06-26T00:00:00Z") }, now),
    ).toBe(false);
  });
});

describe("computeVendorScorecard", () => {
  it("computes volume, value and on-time rate over received POs", () => {
    const result = computeVendorScorecard([
      {
        status: "RECEIVED",
        total: 1000,
        expectedAt: new Date("2026-06-10"),
        receivedAt: new Date("2026-06-09"), // on time
      },
      {
        status: "RECEIVED",
        total: 500,
        expectedAt: new Date("2026-06-10"),
        receivedAt: new Date("2026-06-12"), // late
      },
      {
        status: "ORDERED",
        total: 250,
        expectedAt: new Date("2026-07-01"),
        receivedAt: null, // not received → excluded from on-time base
      },
    ]);
    expect(result).toEqual({
      poCount: 3,
      totalValue: 1750,
      receivedCount: 2,
      onTimePercent: 50,
    });
  });

  it("handles no received POs", () => {
    expect(
      computeVendorScorecard([
        { status: "DRAFT", total: 100, expectedAt: null, receivedAt: null },
      ]),
    ).toEqual({ poCount: 1, totalValue: 100, receivedCount: 0, onTimePercent: 0 });
  });
});
