import { describe, expect, it } from "vitest";

import {
  base32Decode,
  base32Encode,
  buildOtpAuthUri,
  currentTotpStep,
  generateTotpSecret,
  TOTP_STEP_SECONDS,
  totpCodeAtStep,
  verifyTotpCode,
} from "./totp";

// RFC 6238 Appendix B test vectors: HMAC-SHA1, 20-byte ASCII secret
// "12345678901234567890", 8-digit truncation. This module truncates to 6
// digits; since 10^6 divides 10^8, the 6-digit code is exactly the published
// 8-digit value mod 1e6 — the underlying HOTP computation is unchanged.
const RFC_SECRET = base32Encode(Buffer.from("12345678901234567890", "ascii"));

const RFC_VECTORS = [
  { eightDigit: "94287082", timeSeconds: 59 },
  { eightDigit: "07081804", timeSeconds: 1111111109 },
  { eightDigit: "14050471", timeSeconds: 1111111111 },
  { eightDigit: "89005924", timeSeconds: 1234567890 },
  { eightDigit: "69279037", timeSeconds: 2000000000 },
];

function sixDigitFromRfcVector(eightDigit: string) {
  return (Number(eightDigit) % 1_000_000).toString().padStart(6, "0");
}

describe("totpCodeAtStep", () => {
  it.each(RFC_VECTORS)(
    "matches the RFC 6238 vector at $timeSeconds s",
    ({ timeSeconds, eightDigit }) => {
      const step = Math.floor(timeSeconds / TOTP_STEP_SECONDS);

      expect(totpCodeAtStep(RFC_SECRET, step)).toBe(
        sixDigitFromRfcVector(eightDigit),
      );
    },
  );
});

describe("verifyTotpCode", () => {
  it("accepts the code for the current step", () => {
    const secret = generateTotpSecret();
    const now = 1_700_000_000_000;
    const step = currentTotpStep(now);
    const code = totpCodeAtStep(secret, step);

    expect(verifyTotpCode(secret, code, { now })).toBe(true);
  });

  it("accepts a code one step behind (clock drift) within the default window", () => {
    const secret = generateTotpSecret();
    const now = 1_700_000_000_000;
    const previousStepCode = totpCodeAtStep(
      secret,
      currentTotpStep(now) - 1,
    );

    expect(verifyTotpCode(secret, previousStepCode, { now })).toBe(true);
  });

  it("rejects a code two steps behind, outside the default window", () => {
    const secret = generateTotpSecret();
    const now = 1_700_000_000_000;
    const staleCode = totpCodeAtStep(secret, currentTotpStep(now) - 2);

    expect(verifyTotpCode(secret, staleCode, { now })).toBe(false);
  });

  it("rejects a wrong code", () => {
    const secret = generateTotpSecret();

    expect(verifyTotpCode(secret, "000000", { now: Date.now() })).toBe(false);
  });

  it("rejects malformed input", () => {
    const secret = generateTotpSecret();

    expect(verifyTotpCode(secret, "12ab56", {})).toBe(false);
    expect(verifyTotpCode(secret, "12345", {})).toBe(false);
  });
});

describe("base32Encode / base32Decode", () => {
  it("round-trips arbitrary bytes", () => {
    const original = Buffer.from([0, 1, 2, 3, 250, 251, 252, 253, 254, 255]);

    expect(base32Decode(base32Encode(original))).toEqual(original);
  });

  it("round-trips a freshly generated secret", () => {
    const secret = generateTotpSecret();

    expect(secret).toMatch(/^[A-Z2-7]+$/u);
    expect(base32Decode(secret).length).toBe(20);
  });
});

describe("buildOtpAuthUri", () => {
  it("encodes issuer, label, and secret into an otpauth:// URI", () => {
    const uri = buildOtpAuthUri({
      accountLabel: "admin@elysia.local",
      issuer: "Elysia",
      secretBase32: "JBSWY3DPEHPK3PXP",
    });

    expect(uri.startsWith("otpauth://totp/")).toBe(true);
    expect(uri).toContain("secret=JBSWY3DPEHPK3PXP");
    expect(uri).toContain("issuer=Elysia");
    expect(uri).toContain(encodeURIComponent("Elysia:admin@elysia.local"));
  });
});
