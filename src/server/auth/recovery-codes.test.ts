import { describe, expect, it } from "vitest";

import {
  generateRecoveryCodes,
  normalizeRecoveryCodeInput,
} from "./recovery-codes";

describe("generateRecoveryCodes", () => {
  it("generates the requested count", () => {
    expect(generateRecoveryCodes(10)).toHaveLength(10);
  });

  it("formats each code as two hyphenated groups from the safe alphabet", () => {
    const codes = generateRecoveryCodes(20);

    for (const code of codes) {
      expect(code).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}$/u);
    }
  });

  it("never produces ambiguous characters (0/O, 1/I/L)", () => {
    const codes = generateRecoveryCodes(50);

    for (const code of codes) {
      expect(code).not.toMatch(/[01ILO]/u);
    }
  });

  it("generates unique codes within a batch", () => {
    const codes = generateRecoveryCodes(50);

    expect(new Set(codes).size).toBe(codes.length);
  });
});

describe("normalizeRecoveryCodeInput", () => {
  it("strips the hyphen and uppercases", () => {
    expect(normalizeRecoveryCodeInput("abcd-2345")).toBe("ABCD2345");
  });

  it("strips surrounding whitespace and stray characters", () => {
    expect(normalizeRecoveryCodeInput("  ABCD 2345  ")).toBe("ABCD2345");
  });
});
