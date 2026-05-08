import { afterEach, describe, expect, it } from "vitest";

import {
  assertSharedRateLimitConfig,
  consumeRateLimit,
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
        UPSTASH_REDIS_REST_URL: "",
        UPSTASH_REDIS_REST_TOKEN: undefined,
      }),
    ).toThrow(/UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN/);
  });

  it("accepts production Vercel runtimes when shared rate-limit env is configured", () => {
    expect(() =>
      assertSharedRateLimitConfig({
        NODE_ENV: "production",
        VERCEL: "1",
        UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
        UPSTASH_REDIS_REST_TOKEN: "token",
      }),
    ).not.toThrow();
  });
});
