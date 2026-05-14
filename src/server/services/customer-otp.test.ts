import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  getOtpExpiresAt,
  hashOtp,
  normalizeOtpIdentifier,
  otpHashesMatch,
  redactOtpIdentifierForMetadata,
} from "./customer-otp";

describe("customer OTP helpers", () => {
  it("normalizes email and phone identifiers before hashing", () => {
    expect(normalizeOtpIdentifier(" Dana@Example.COM ")).toBe(
      "dana@example.com",
    );
    expect(normalizeOtpIdentifier("050-123 4567")).toBe("0501234567");
  });

  it("redacts OTP identifiers before operational metadata persistence", () => {
    expect(redactOtpIdentifierForMetadata(" Dana@Example.COM ")).toBe(
      "d***@example.com",
    );
    expect(redactOtpIdentifierForMetadata("050-123 4567")).toBe("***4567");
    expect(redactOtpIdentifierForMetadata("")).toBe("[redacted]");
  });

  it("matches OTP hashes without comparing raw codes", () => {
    const hash = hashOtp("dana@example.com", "123456");

    expect(hash).toMatch(/^otp-hmac-sha256:/);
    expect(otpHashesMatch(hash, "Dana@Example.com", "123456")).toBe(true);
    expect(otpHashesMatch(hash, "Dana@Example.com", "654321")).toBe(false);
  });

  it("keeps pending legacy OTP hashes verifiable during rollout", () => {
    const legacyHash = createHash("sha256")
      .update("dana@example.com:123456")
      .digest("hex");

    expect(otpHashesMatch(legacyHash, "Dana@Example.com", "123456")).toBe(true);
  });

  it("expires OTP challenges after ten minutes", () => {
    expect(
      getOtpExpiresAt(new Date("2026-04-28T08:00:00.000Z")).toISOString(),
    ).toBe("2026-04-28T08:10:00.000Z");
  });
});
