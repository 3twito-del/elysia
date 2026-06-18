import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  getOtpChallengeVerificationState,
  getOtpExpiresAt,
  getOtpResendWaitSeconds,
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

  it("communicates resend cooldown timing", () => {
    const requestedAt = new Date("2026-06-01T10:00:00.000Z");

    expect(
      getOtpResendWaitSeconds(
        requestedAt,
        new Date("2026-06-01T10:00:15.000Z"),
      ),
    ).toBe(45);
    expect(
      getOtpResendWaitSeconds(
        requestedAt,
        new Date("2026-06-01T10:01:01.000Z"),
      ),
    ).toBe(0);
  });

  it("classifies expired reused locked and valid OTP challenges", () => {
    const now = new Date("2026-06-01T10:00:00.000Z");

    expect(
      getOtpChallengeVerificationState(
        {
          attempts: 0,
          consumedAt: null,
          expiresAt: new Date("2026-06-01T10:05:00.000Z"),
        },
        now,
      ),
    ).toBe("valid");
    expect(
      getOtpChallengeVerificationState(
        {
          attempts: 0,
          consumedAt: null,
          expiresAt: new Date("2026-06-01T09:59:59.000Z"),
        },
        now,
      ),
    ).toBe("expired");
    expect(
      getOtpChallengeVerificationState(
        {
          attempts: 0,
          consumedAt: new Date("2026-06-01T09:58:00.000Z"),
          expiresAt: new Date("2026-06-01T10:05:00.000Z"),
        },
        now,
      ),
    ).toBe("invalid");
    expect(
      getOtpChallengeVerificationState(
        {
          attempts: 5,
          consumedAt: null,
          expiresAt: new Date("2026-06-01T10:05:00.000Z"),
        },
        now,
      ),
    ).toBe("locked");
  });
});
