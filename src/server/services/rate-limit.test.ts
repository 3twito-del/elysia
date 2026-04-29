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

  it("blocks Vercel builds when shared rate-limit env is missing", () => {
    expect(() =>
      assertSharedRateLimitConfig({
        VERCEL: "1",
        UPSTASH_REDIS_REST_URL: "",
        UPSTASH_REDIS_REST_TOKEN: undefined,
      }),
    ).toThrow(/UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN/);
  });

  it("accepts Vercel builds when shared rate-limit env is configured", () => {
    expect(() =>
      assertSharedRateLimitConfig({
        VERCEL: "1",
        UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
        UPSTASH_REDIS_REST_TOKEN: "token",
      }),
    ).not.toThrow();
  });
});
