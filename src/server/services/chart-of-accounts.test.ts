import { describe, expect, it } from "vitest";

import { deriveNormalSide, isValidAccountCode } from "./chart-of-accounts";

describe("isValidAccountCode", () => {
  it("accepts 3–5 digit codes", () => {
    expect(isValidAccountCode("1000")).toBe(true);
    expect(isValidAccountCode("500")).toBe(true);
    expect(isValidAccountCode("12345")).toBe(true);
  });

  it("rejects non-numeric, too short or too long codes", () => {
    expect(isValidAccountCode("10")).toBe(false);
    expect(isValidAccountCode("123456")).toBe(false);
    expect(isValidAccountCode("10A0")).toBe(false);
  });
});

describe("deriveNormalSide", () => {
  it("is debit for assets and expenses, credit otherwise", () => {
    expect(deriveNormalSide("ASSET")).toBe("DEBIT");
    expect(deriveNormalSide("EXPENSE")).toBe("DEBIT");
    expect(deriveNormalSide("LIABILITY")).toBe("CREDIT");
    expect(deriveNormalSide("REVENUE")).toBe("CREDIT");
    expect(deriveNormalSide("EQUITY")).toBe("CREDIT");
  });
});
