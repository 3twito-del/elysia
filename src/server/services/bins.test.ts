import { describe, expect, it } from "vitest";

import { validateBinCode } from "./bins";

describe("validateBinCode", () => {
  it("accepts aisle-rack-level codes", () => {
    expect(validateBinCode("A-01-3")).toBe(true);
    expect(validateBinCode("bc-12-05")).toBe(true); // normalized to upper
    expect(validateBinCode("ZZZ-999-999")).toBe(true);
  });

  it("rejects malformed codes", () => {
    expect(validateBinCode("A01-3")).toBe(false);
    expect(validateBinCode("1-01-3")).toBe(false);
    expect(validateBinCode("A-01")).toBe(false);
    expect(validateBinCode("")).toBe(false);
  });
});
