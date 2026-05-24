import { describe, expect, it, vi } from "vitest";

import {
  getProductionEnvValidationError,
  verifyProductionEnv,
  verifyProductionReadiness,
  main,
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

  it("allows preview Vercel builds without production-only shared runtime env", () => {
    expect(
      verifyProductionEnv({
        VERCEL: "1",
        VERCEL_ENV: "preview",
        UPSTASH_REDIS_REST_URL: "",
        UPSTASH_REDIS_REST_TOKEN: undefined,
      }),
    ).toEqual({ ok: true });
  });

  it("requires shared Vercel runtime env on production Vercel builds", () => {
    expect(
      verifyProductionEnv({
        VERCEL: "1",
        VERCEL_ENV: "production",
        UPSTASH_REDIS_REST_URL: "",
        UPSTASH_REDIS_REST_TOKEN: undefined,
      }),
    ).toEqual({
      ok: false,
      error:
        "Missing required Vercel environment variables: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN",
    });
  });

  it("allows production builds when Vercel runtime env is configured even if rollout providers are absent", () => {
    expect(
      verifyProductionEnv({
        VERCEL: "1",
        VERCEL_ENV: "production",
        UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
        UPSTASH_REDIS_REST_TOKEN: "token",
      }),
    ).toEqual({ ok: true });
  });

  it("skips production readiness locally unless force is requested", () => {
    expect(
      verifyProductionReadiness({
        NODE_ENV: "development",
        VERCEL: undefined,
        VERCEL_ENV: undefined,
      }),
    ).toEqual({ ok: true });
  });

  it("forces production readiness validation outside Vercel production", () => {
    expect(
      verifyProductionReadiness(
        {
          NODE_ENV: "development",
          VERCEL: undefined,
          VERCEL_ENV: undefined,
        },
        { force: true },
      ),
    ).toEqual({
      ok: false,
      error:
        "Missing production provider environment variables: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN, STORE_FROM_EMAIL, OPERATIONS_EMAIL, CARD_COM_TERMINAL, CARD_COM_API_NAME, CARD_COM_API_PASSWORD, CARD_COM_WEBHOOK_SECRET, SMS_PROVIDER_API_KEY, TYPESENSE_HOST, TYPESENSE_API_KEY, BREVO_API_KEY or RESEND_API_KEY, JOB_RUNNER_SECRET or CRON_SECRET, AI_GATEWAY_API_KEY or VERCEL_OIDC_TOKEN or GOOGLE_GENERATIVE_AI_API_KEY",
    });
  });

  it("fails production readiness clearly when Amazon-level provider env is absent", () => {
    expect(
      verifyProductionReadiness({
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
        "Missing production provider environment variables: CARD_COM_TERMINAL, CARD_COM_API_NAME, CARD_COM_API_PASSWORD, CARD_COM_WEBHOOK_SECRET, SMS_PROVIDER_API_KEY, TYPESENSE_HOST, TYPESENSE_API_KEY, BREVO_API_KEY or RESEND_API_KEY, JOB_RUNNER_SECRET or CRON_SECRET, AI_GATEWAY_API_KEY or VERCEL_OIDC_TOKEN or GOOGLE_GENERATIVE_AI_API_KEY",
    });
  });

  it("fails production readiness clearly when production payment env is partial", () => {
    expect(
      verifyProductionReadiness({
        VERCEL: "1",
        VERCEL_ENV: "production",
        UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
        UPSTASH_REDIS_REST_TOKEN: "token",
        STORE_FROM_EMAIL: "orders@example.com",
        OPERATIONS_EMAIL: "ops@example.com",
        RESEND_API_KEY: "re_live",
        CARD_COM_TERMINAL: "12345",
        SMS_PROVIDER_API_KEY: "sms-key",
        TYPESENSE_HOST: "search.example.com",
        TYPESENSE_API_KEY: "typesense-key",
        JOB_RUNNER_SECRET: "job-secret",
        AI_GATEWAY_API_KEY: "ai-key",
      }),
    ).toEqual({
      ok: false,
      error:
        "Missing production provider environment variables: CARD_COM_API_NAME, CARD_COM_API_PASSWORD, CARD_COM_WEBHOOK_SECRET",
    });
  });

  it("accepts production readiness when Amazon-level readiness env is configured", () => {
    expect(
      verifyProductionReadiness({
        VERCEL: "1",
        VERCEL_ENV: "production",
        UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
        UPSTASH_REDIS_REST_TOKEN: "token",
        STORE_FROM_EMAIL: "orders@example.com",
        OPERATIONS_EMAIL: "ops@example.com",
        BREVO_API_KEY: "brevo-key",
        CARD_COM_TERMINAL: "12345",
        CARD_COM_API_NAME: "api-name",
        CARD_COM_API_PASSWORD: "api-password",
        CARD_COM_WEBHOOK_SECRET: "webhook-secret",
        SMS_PROVIDER_API_KEY: "sms-key",
        TYPESENSE_HOST: "search.example.com",
        TYPESENSE_API_KEY: "typesense-key",
        JOB_RUNNER_SECRET: "job-secret",
        AI_GATEWAY_API_KEY: "ai-key",
      }),
    ).toEqual({ ok: true });
  });

  it("wires the CLI force flag to readiness validation", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      expect(
        main(
          {
            NODE_ENV: "development",
            VERCEL: undefined,
            VERCEL_ENV: undefined,
          },
          ["--readiness", "--force"],
        ),
      ).toBe(1);
    } finally {
      errorSpy.mockRestore();
    }
  });
});
