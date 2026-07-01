import { describe, expect, it } from "vitest";

import {
  allocateFefo,
  compareExpiry,
  expiryStatus,
  isExpired,
  sortLotsFefo,
} from "./lot-tracking";

const d = (s: string) => new Date(s);

describe("compareExpiry / sortLotsFefo", () => {
  it("orders earliest expiry first, nulls last", () => {
    const sorted = sortLotsFefo([
      { expiryDate: null },
      { expiryDate: d("2026-05-01") },
      { expiryDate: d("2026-01-01") },
    ]);
    expect(sorted.map((l) => l.expiryDate)).toEqual([
      d("2026-01-01"),
      d("2026-05-01"),
      null,
    ]);
  });

  it("compareExpiry handles nulls", () => {
    expect(compareExpiry(null, d("2026-01-01"))).toBeGreaterThan(0);
    expect(compareExpiry(d("2026-01-01"), null)).toBeLessThan(0);
    expect(compareExpiry(null, null)).toBe(0);
  });
});

describe("allocateFefo", () => {
  const lots = [
    { id: "late", quantity: 5, expiryDate: d("2026-06-01") },
    { id: "soon", quantity: 3, expiryDate: d("2026-02-01") },
    { id: "none", quantity: 10, expiryDate: null },
  ];

  it("consumes soonest-expiring lots first", () => {
    const result = allocateFefo(lots, 6);
    expect(result.allocations).toEqual([
      { lotId: "soon", quantity: 3 },
      { lotId: "late", quantity: 3 },
    ]);
    expect(result.fulfilled).toBe(6);
    expect(result.shortfall).toBe(0);
  });

  it("reports shortfall when demand exceeds stock", () => {
    const result = allocateFefo(lots, 100);
    expect(result.fulfilled).toBe(18);
    expect(result.shortfall).toBe(82);
  });
});

describe("isExpired / expiryStatus", () => {
  const now = d("2026-03-01T00:00:00Z");

  it("flags expired and expiring lots", () => {
    expect(isExpired(d("2026-02-01"), now)).toBe(true);
    expect(expiryStatus(d("2026-02-01"), now)).toBe("EXPIRED");
    expect(expiryStatus(d("2026-03-15"), now)).toBe("EXPIRING");
    expect(expiryStatus(d("2026-08-01"), now)).toBe("OK");
    expect(expiryStatus(null, now)).toBe("NONE");
  });
});
