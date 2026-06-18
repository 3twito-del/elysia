import { TRPCError } from "@trpc/server";
import { afterEach, describe, expect, it } from "vitest";

import {
  RateLimitExceededError,
  resetRateLimitStateForTests,
} from "~/server/services/rate-limit";

import { assertTRPCRateLimit, getTRPCRequestIp } from "./rate-limit";

describe("tRPC rate limit boundary", () => {
  afterEach(() => {
    resetRateLimitStateForTests();
  });

  it("throws a standardized too-many-requests error with retry metadata", async () => {
    const input = {
      key: "trpc:test",
      limit: 1,
      windowMs: 60_000,
      message: "Too many OTP requests.",
    };

    await expect(assertTRPCRateLimit(input)).resolves.toMatchObject({
      allowed: true,
      remaining: 0,
    });

    try {
      await assertTRPCRateLimit(input);
      throw new Error("Expected rate limit to fail.");
    } catch (error) {
      expectTRPCRateLimitError(error, "Too many OTP requests.");
    }
  });

  it("normalizes forwarded IPs through the shared request-IP helper", () => {
    const headers = new Headers({
      "x-forwarded-for": " 203.0.113.10, 198.51.100.10 ",
    });

    expect(getTRPCRequestIp(headers)).toBe("203.0.113.10");
  });

  it("uses a generic message when callers do not provide endpoint copy", async () => {
    const input = {
      key: "trpc:default-copy",
      limit: 1,
      windowMs: 60_000,
    };

    await assertTRPCRateLimit(input);

    try {
      await assertTRPCRateLimit(input);
      throw new Error("Expected rate limit to fail.");
    } catch (error) {
      expectTRPCRateLimitError(error, "Too many requests.");
    }
  });
});

function expectTRPCRateLimitError(error: unknown, message: string) {
  expect(error).toBeInstanceOf(TRPCError);

  const trpcError = error as TRPCError;

  expect(trpcError.code).toBe("TOO_MANY_REQUESTS");
  expect(trpcError.message).toBe(message);
  expect(trpcError.cause).toBeInstanceOf(RateLimitExceededError);
  expect(
    (trpcError.cause as RateLimitExceededError).retryAfterSeconds,
  ).toBeGreaterThanOrEqual(1);
}
