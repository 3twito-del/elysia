import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const requiresProductionRuntimeEnv =
  (process.env.VERCEL === "1" && process.env.VERCEL_ENV === "production") ||
  process.env.REQUIRE_PRODUCTION_RUNTIME_ENV === "1";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    AUTH_SECRET: requiresProductionRuntimeEnv
      ? z.string()
      : z.string().optional(),
    DATABASE_URL: requiresProductionRuntimeEnv
      ? z.string().url()
      : z.string().url().optional(),
    ADMIN_BOOTSTRAP_EMAIL: z.string().email().optional(),
    ADMIN_BOOTSTRAP_PASSWORD: z.string().min(12).optional(),
    ADMIN_BOOTSTRAP_NAME: z.string().optional(),
    CARD_COM_TERMINAL: z.string().optional(),
    CARD_COM_API_NAME: z.string().optional(),
    CARD_COM_API_PASSWORD: z.string().optional(),
    CARD_COM_WEBHOOK_SECRET: z.string().min(16).optional(),
    CLOUDINARY_CLOUD_NAME: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),
    BREVO_API_KEY: z.string().optional(),
    STORE_FROM_EMAIL: z.string().email().optional(),
    STORE_FROM_NAME: z.string().optional(),
    OPERATIONS_EMAIL: z.string().email().optional(),
    RESEND_API_KEY: z.string().optional(),
    SMS_PROVIDER_API_KEY: z.string().optional(),
    CRON_SECRET: z.string().optional(),
    JOB_RUNNER_SECRET: z.string().optional(),
    TYPESENSE_API_KEY: z.string().optional(),
    TYPESENSE_HOST: z.string().optional(),
    TYPESENSE_PORT: z.coerce.number().optional(),
    TYPESENSE_PROTOCOL: z.enum(["http", "https"]).optional(),
    GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional(),
    AI_GATEWAY_API_KEY: z.string().optional(),
    AI_CHAT_MODEL: z.string().optional(),
    FREE_AI_PROVIDER_ORDER: z.string().optional(),
    CEREBRAS_API_KEY: z.string().optional(),
    CEREBRAS_CHAT_MODEL: z.string().optional(),
    GROQ_API_KEY: z.string().optional(),
    GROQ_CHAT_MODEL: z.string().optional(),
    CLOUDFLARE_ACCOUNT_ID: z.string().optional(),
    CLOUDFLARE_AI_API_TOKEN: z.string().optional(),
    CLOUDFLARE_CHAT_MODEL: z.string().optional(),
    CLOUDFLARE_EMBEDDING_MODEL: z.string().optional(),
    AI_EMBEDDING_MODEL: z.string().optional(),
    AI_EMBEDDING_DIMENSIONS: z.coerce.number().int().positive().optional(),
    AI_SEMANTIC_SEARCH_ENABLED: z.enum(["0", "1", "false", "true"]).optional(),
    AI_MAX_OUTPUT_TOKENS: z.coerce.number().int().positive().optional(),
    AI_INTENT_MAX_OUTPUT_TOKENS: z.coerce.number().int().positive().optional(),
    AI_DAILY_HARD_STOP: z.enum(["0", "1", "false", "true"]).optional(),
    UPSTASH_REDIS_REST_URL: z.string().url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
    VERCEL_OIDC_TOKEN: z.string().optional(),
    SITE_URL: z.string().url().optional(),
    VAPID_PUBLIC_KEY: z.string().optional(),
    VAPID_PRIVATE_KEY: z.string().optional(),
    VAPID_SUBJECT: z.string().optional(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().optional(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    AUTH_SECRET: process.env.AUTH_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    ADMIN_BOOTSTRAP_EMAIL: process.env.ADMIN_BOOTSTRAP_EMAIL,
    ADMIN_BOOTSTRAP_PASSWORD: process.env.ADMIN_BOOTSTRAP_PASSWORD,
    ADMIN_BOOTSTRAP_NAME: process.env.ADMIN_BOOTSTRAP_NAME,
    CARD_COM_TERMINAL: process.env.CARD_COM_TERMINAL,
    CARD_COM_API_NAME: process.env.CARD_COM_API_NAME,
    CARD_COM_API_PASSWORD: process.env.CARD_COM_API_PASSWORD,
    CARD_COM_WEBHOOK_SECRET: process.env.CARD_COM_WEBHOOK_SECRET,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    BREVO_API_KEY: process.env.BREVO_API_KEY,
    STORE_FROM_EMAIL: process.env.STORE_FROM_EMAIL,
    STORE_FROM_NAME: process.env.STORE_FROM_NAME,
    OPERATIONS_EMAIL: process.env.OPERATIONS_EMAIL,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    SMS_PROVIDER_API_KEY: process.env.SMS_PROVIDER_API_KEY,
    CRON_SECRET: process.env.CRON_SECRET,
    JOB_RUNNER_SECRET: process.env.JOB_RUNNER_SECRET,
    TYPESENSE_API_KEY: process.env.TYPESENSE_API_KEY,
    TYPESENSE_HOST: process.env.TYPESENSE_HOST,
    TYPESENSE_PORT: process.env.TYPESENSE_PORT,
    TYPESENSE_PROTOCOL: process.env.TYPESENSE_PROTOCOL,
    GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    AI_GATEWAY_API_KEY: process.env.AI_GATEWAY_API_KEY,
    AI_CHAT_MODEL: process.env.AI_CHAT_MODEL,
    FREE_AI_PROVIDER_ORDER: process.env.FREE_AI_PROVIDER_ORDER,
    CEREBRAS_API_KEY: process.env.CEREBRAS_API_KEY,
    CEREBRAS_CHAT_MODEL: process.env.CEREBRAS_CHAT_MODEL,
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    GROQ_CHAT_MODEL: process.env.GROQ_CHAT_MODEL,
    CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
    CLOUDFLARE_AI_API_TOKEN: process.env.CLOUDFLARE_AI_API_TOKEN,
    CLOUDFLARE_CHAT_MODEL: process.env.CLOUDFLARE_CHAT_MODEL,
    CLOUDFLARE_EMBEDDING_MODEL: process.env.CLOUDFLARE_EMBEDDING_MODEL,
    AI_EMBEDDING_MODEL: process.env.AI_EMBEDDING_MODEL,
    AI_EMBEDDING_DIMENSIONS: process.env.AI_EMBEDDING_DIMENSIONS,
    AI_SEMANTIC_SEARCH_ENABLED: process.env.AI_SEMANTIC_SEARCH_ENABLED,
    AI_MAX_OUTPUT_TOKENS: process.env.AI_MAX_OUTPUT_TOKENS,
    AI_INTENT_MAX_OUTPUT_TOKENS: process.env.AI_INTENT_MAX_OUTPUT_TOKENS,
    AI_DAILY_HARD_STOP: process.env.AI_DAILY_HARD_STOP,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    VERCEL_OIDC_TOKEN: process.env.VERCEL_OIDC_TOKEN,
    SITE_URL: process.env.SITE_URL,
    VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY,
    VAPID_SUBJECT: process.env.VAPID_SUBJECT,
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    NODE_ENV: process.env.NODE_ENV,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
