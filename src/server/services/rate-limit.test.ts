import { afterEach, describe, expect, it, vi } from "vitest";

import {
  assertSharedRateLimitConfig,
  consumeRateLimit,
  createRateLimitKey,
  resetRateLimitStateForTests,
} from "./rate-limit";

describe("rate limit service", () => {
  afterEach(() => {
    resetRateLimitStateForTests();
  });

  it("uses the local limiter when shared rate-limit env is not required", async () => {
    const input = {
      key: "test:local",
      limit: 1,
      windowMs: 60_000,
    };

    await expect(consumeRateLimit(input)).resolves.toMatchObject({
      allowed: true,
      remaining: 0,
    });
    await expect(consumeRateLimit(input)).resolves.toMatchObject({
      allowed: false,
      remaining: 0,
    });
  });

  it("uses the local limiter for Vercel-like development envs", () => {
    expect(() =>
      assertSharedRateLimitConfig({
        NODE_ENV: "development",
        VERCEL: "1",
        UPSTASH_REDIS_REST_URL: "",
        UPSTASH_REDIS_REST_TOKEN: undefined,
      }),
    ).not.toThrow();
  });

  it("blocks production Vercel runtimes when shared rate-limit env is missing", () => {
    expect(() =>
      assertSharedRateLimitConfig({
        NODE_ENV: "production",
        VERCEL: "1",
        VERCEL_ENV: "production",
        UPSTASH_REDIS_REST_URL: "",
        UPSTASH_REDIS_REST_TOKEN: undefined,
      }),
    ).toThrow(/UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN/);
  });

  it("uses the local limiter for preview Vercel runtimes without shared env", () => {
    expect(() =>
      assertSharedRateLimitConfig({
        NODE_ENV: "production",
        VERCEL: "1",
        VERCEL_ENV: "preview",
        UPSTASH_REDIS_REST_URL: "",
        UPSTASH_REDIS_REST_TOKEN: undefined,
      }),
    ).not.toThrow();
  });

  it("falls back to the local limiter instead of failing request handlers when shared runtime config is unavailable", async () => {
    const originalEnv = {
      NODE_ENV: process.env.NODE_ENV,
      UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
      UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
    };
    const errorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    setEnv("NODE_ENV", "production");
    setEnv("VERCEL", "1");
    setEnv("VERCEL_ENV", "production");
    deleteEnv("UPSTASH_REDIS_REST_URL");
    deleteEnv("UPSTASH_REDIS_REST_TOKEN");

    try {
      await expect(
        consumeRateLimit({
          key: "test:production-fallback",
          limit: 1,
          windowMs: 60_000,
        }),
      ).resolves.toMatchObject({
        allowed: true,
        remaining: 0,
      });
    } finally {
      restoreEnv(originalEnv);
      errorSpy.mockRestore();
    }
  });

  it("accepts production Vercel runtimes when shared rate-limit env is configured", () => {
    expect(() =>
      assertSharedRateLimitConfig({
        NODE_ENV: "production",
        VERCEL: "1",
        VERCEL_ENV: "production",
        UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
        UPSTASH_REDIS_REST_TOKEN: "token",
      }),
    ).not.toThrow();
  });

  it("creates stable non-PII keys for identifier-scoped limits", () => {
    const key = createRateLimitKey("otp:request", " Dana@Example.com ");

    expect(key).toBe(createRateLimitKey("otp:request", "dana@example.com"));
    expect(key).toMatch(/^otp:request:[a-f0-9]{32}$/);
    expect(key).not.toContain("dana@example.com");
  });

  it("keeps endpoint namespaces isolated for the same identifier", async () => {
    const identifier = "Dana@Example.com";
    const otpKey = createRateLimitKey("otp:request", identifier);
    const privacyKey = createRateLimitKey("privacy:export", identifier);

    expect(otpKey).not.toBe(privacyKey);

    await expect(
      consumeRateLimit({ key: otpKey, limit: 1, windowMs: 60_000 }),
    ).resolves.toMatchObject({ allowed: true, remaining: 0 });
    await expect(
      consumeRateLimit({ key: otpKey, limit: 1, windowMs: 60_000 }),
    ).resolves.toMatchObject({ allowed: false, remaining: 0 });
    await expect(
      consumeRateLimit({ key: privacyKey, limit: 1, windowMs: 60_000 }),
    ).resolves.toMatchObject({ allowed: true, remaining: 0 });
  });
});

function restoreEnv(
  env: Record<
    | "NODE_ENV"
    | "UPSTASH_REDIS_REST_TOKEN"
    | "UPSTASH_REDIS_REST_URL"
    | "VERCEL"
    | "VERCEL_ENV",
    string | undefined
  >,
) {
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) {
      deleteEnv(key);
      continue;
    }

    setEnv(key, value);
  }
}

function setEnv(key: string, value: string) {
  process.env[key] = value;
}

function deleteEnv(key: string) {
  delete process.env[key];
}
