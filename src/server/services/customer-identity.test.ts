import { describe, expect, it } from "vitest";

import {
  findDuplicateGroups,
  normalizeEmail,
  normalizePhone,
} from "./customer-identity";

describe("normalizeEmail / normalizePhone", () => {
  it("normalizes email casing and whitespace", () => {
    expect(normalizeEmail("  Foo@Bar.COM ")).toBe("foo@bar.com");
    expect(normalizeEmail("  ")).toBeNull();
  });

  it("keeps only phone digits and requires at least 7", () => {
    expect(normalizePhone("+972 (50) 123-4567")).toBe("972501234567");
    expect(normalizePhone("12-34")).toBeNull();
  });
});

describe("findDuplicateGroups", () => {
  it("groups customers sharing an email or phone", () => {
    const groups = findDuplicateGroups([
      { id: "a", name: "A", email: "x@y.com", phone: "0501234567" },
      { id: "b", name: "B", email: "X@Y.com", phone: null },
      { id: "c", name: "C", email: null, phone: "050-123-4567" },
      { id: "d", name: "D", email: "unique@z.com", phone: "0529999999" },
    ]);

    const emailGroup = groups.find((group) => group.type === "email");
    const phoneGroup = groups.find((group) => group.type === "phone");

    expect(emailGroup?.customers.map((c) => c.id).sort()).toEqual(["a", "b"]);
    expect(phoneGroup?.customers.map((c) => c.id).sort()).toEqual(["a", "c"]);
  });

  it("returns no groups when everyone is unique", () => {
    expect(
      findDuplicateGroups([
        { id: "a", name: "A", email: "a@a.com", phone: "0500000001" },
        { id: "b", name: "B", email: "b@b.com", phone: "0500000002" },
      ]),
    ).toEqual([]);
  });
});
