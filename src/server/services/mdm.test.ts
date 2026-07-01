import { describe, expect, it } from "vitest";

import {
  duplicateScore,
  findDuplicateCandidates,
  normalizePhone,
  type MdmCustomer,
} from "./mdm";

function cust(overrides: Partial<MdmCustomer>): MdmCustomer {
  return { id: "c", email: null, phone: null, firstName: null, lastName: null, ...overrides };
}

describe("normalizePhone", () => {
  it("keeps the last 9 digits", () => {
    expect(normalizePhone("+972-50-123-4567")).toBe("501234567");
    expect(normalizePhone("123")).toBeNull();
  });
});

describe("duplicateScore", () => {
  it("scores same email highest, then phone, then name", () => {
    expect(
      duplicateScore(cust({ email: "A@x.com" }), cust({ email: "a@x.com" })),
    ).toBe(1);
    expect(
      duplicateScore(cust({ phone: "050-1234567" }), cust({ phone: "0501234567" })),
    ).toBe(0.95);
    expect(
      duplicateScore(
        cust({ firstName: "דנה", lastName: "לוי" }),
        cust({ firstName: "דנה", lastName: "לוי" }),
      ),
    ).toBe(0.8);
  });
});

describe("findDuplicateCandidates", () => {
  it("returns pairs above the threshold, sorted", () => {
    const pairs = findDuplicateCandidates([
      cust({ id: "1", email: "d@x.com" }),
      cust({ id: "2", email: "d@x.com" }),
      cust({ id: "3", email: "unique@x.com", firstName: "יוסי" }),
    ]);
    expect(pairs).toHaveLength(1);
    expect(pairs[0]?.score).toBe(1);
    expect(pairs[0]?.reason).toContain('דוא"ל');
  });
});
