import { describe, expect, it } from "vitest";

import {
  getProductionEnvValidationError,
  verifyProductionEnv,
} from "./verify-production-env.mjs";

describe("production environment validation", () => {
  it("allows local development without production-only provider credentials", () => {
    expect(
      getProductionEnvValidationError({
        NODE_ENV: "development",
        VERCEL: undefined,
        VERCEL_ENV: undefined,
      }),
    ).toBeNull();
  });

  it("requires shared Vercel runtime env on any Vercel build", () => {
    expect(
      verifyProductionEnv({
        VERCEL: "1",
        VERCEL_ENV: "preview",
        UPSTASH_REDIS_REST_URL: "",
        UPSTASH_REDIS_REST_TOKEN: undefined,
      }),
    ).toEqual({
      ok: false,
      error:
        "Missing required Vercel environment variables: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN",
    });
  });

  it("fails production builds clearly when email provider env is absent", () => {
    expect(
      verifyProductionEnv({
        VERCEL: "1",
        VERCEL_ENV: "production",
        UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
        UPSTASH_REDIS_REST_TOKEN: "token",
        STORE_FROM_EMAIL: "orders@example.com",
        OPERATIONS_EMAIL: "ops@example.com",
      }),
    ).toEqual({
      ok: false,
      error:
        "Missing production provider environment variables: BREVO_API_KEY or RESEND_API_KEY",
    });
  });

  it("fails production builds clearly when partial CardCom env is present", () => {
    expect(
      verifyProductionEnv({
        VERCEL: "1",
        VERCEL_ENV: "production",
        UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
        UPSTASH_REDIS_REST_TOKEN: "token",
        STORE_FROM_EMAIL: "orders@example.com",
        OPERATIONS_EMAIL: "ops@example.com",
        RESEND_API_KEY: "re_live",
        CARD_COM_TERMINAL: "12345",
      }),
    ).toEqual({
      ok: false,
      error:
        "Missing production provider environment variables: CARD_COM_API_NAME, CARD_COM_API_PASSWORD, CARD_COM_WEBHOOK_SECRET",
    });
  });

  it("accepts production builds when required provider env is configured", () => {
    expect(
      verifyProductionEnv({
        VERCEL: "1",
        VERCEL_ENV: "production",
        UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
        UPSTASH_REDIS_REST_TOKEN: "token",
        STORE_FROM_EMAIL: "orders@example.com",
        OPERATIONS_EMAIL: "ops@example.com",
        BREVO_API_KEY: "brevo-key",
      }),
    ).toEqual({ ok: true });
  });
});
