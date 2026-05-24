import { env } from "~/env";
import {
  DEFAULT_AI_INTENT_MAX_OUTPUT_TOKENS,
  DEFAULT_AI_MAX_OUTPUT_TOKENS,
  DEFAULT_FREE_AI_PROVIDER_ORDER,
} from "~/server/ai/constants";
import type { AiModelEnv, AiProviderId } from "~/server/ai/quota-router-types";

export function getAiMaxOutputTokenLimit(config: AiModelEnv) {
  return boundTokenLimit(
    config.AI_MAX_OUTPUT_TOKENS,
    DEFAULT_AI_MAX_OUTPUT_TOKENS,
  );
}

export function getAiIntentMaxOutputTokenLimit(config: AiModelEnv) {
  return boundTokenLimit(
    config.AI_INTENT_MAX_OUTPUT_TOKENS,
    DEFAULT_AI_INTENT_MAX_OUTPUT_TOKENS,
  );
}

export function parseProviderOrder(value: string | undefined) {
  const providers = (
    value?.trim() ? value.split(",") : [...DEFAULT_FREE_AI_PROVIDER_ORDER]
  )
    .map((provider) => provider.trim().toLowerCase())
    .filter(
      (provider): provider is Exclude<AiProviderId, "router"> =>
        provider === "cerebras" ||
        provider === "groq" ||
        provider === "cloudflare" ||
        provider === "google" ||
        provider === "gateway",
    );

  return providers.length > 0 ? providers : [...DEFAULT_FREE_AI_PROVIDER_ORDER];
}

export function stripProviderPrefix(modelId: string, provider: string) {
  const prefix = `${provider}:`;
  return modelId.startsWith(prefix) ? modelId.slice(prefix.length) : modelId;
}

export function trimToUndefined(value?: string) {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;

  return trimmed;
}

export function boundTokenLimit(value: number | undefined, fallback: number) {
  const limit = value ?? fallback;
  return Math.min(Math.max(limit, 1), 2_000);
}

export function getDefaultAiModelEnv(): AiModelEnv {
  return {
    AI_CHAT_MODEL: env.AI_CHAT_MODEL,
    AI_DAILY_HARD_STOP: env.AI_DAILY_HARD_STOP,
    AI_GATEWAY_API_KEY: env.AI_GATEWAY_API_KEY,
    AI_INTENT_MAX_OUTPUT_TOKENS: env.AI_INTENT_MAX_OUTPUT_TOKENS,
    AI_MAX_OUTPUT_TOKENS: env.AI_MAX_OUTPUT_TOKENS,
    CEREBRAS_API_KEY: env.CEREBRAS_API_KEY,
    CEREBRAS_CHAT_MODEL: env.CEREBRAS_CHAT_MODEL,
    CLOUDFLARE_ACCOUNT_ID: env.CLOUDFLARE_ACCOUNT_ID,
    CLOUDFLARE_AI_API_TOKEN: env.CLOUDFLARE_AI_API_TOKEN,
    CLOUDFLARE_CHAT_MODEL: env.CLOUDFLARE_CHAT_MODEL,
    FREE_AI_PROVIDER_ORDER: env.FREE_AI_PROVIDER_ORDER,
    GOOGLE_GENERATIVE_AI_API_KEY: env.GOOGLE_GENERATIVE_AI_API_KEY,
    GROQ_API_KEY: env.GROQ_API_KEY,
    GROQ_CHAT_MODEL: env.GROQ_CHAT_MODEL,
    VERCEL_OIDC_TOKEN: env.VERCEL_OIDC_TOKEN,
  };
}

export function extractTokenUsage(usage: unknown) {
  if (!usage || typeof usage !== "object") {
    return {
      promptTokens: null,
      completionTokens: null,
      totalTokens: null,
    };
  }

  const record = usage as Record<string, unknown>;
  const promptTokens =
    getNumber(record.inputTokens) ??
    getNumber(record.promptTokens) ??
    getNestedTokenTotal(record.inputTokens);
  const completionTokens =
    getNumber(record.outputTokens) ??
    getNumber(record.completionTokens) ??
    getNestedTokenTotal(record.outputTokens);
  const totalTokens =
    getNumber(record.totalTokens) ??
    (promptTokens !== null || completionTokens !== null
      ? (promptTokens ?? 0) + (completionTokens ?? 0)
      : null);

  return {
    promptTokens,
    completionTokens,
    totalTokens,
  };
}

export function getNestedTokenTotal(value: unknown) {
  if (!value || typeof value !== "object") return null;

  return getNumber((value as Record<string, unknown>).total);
}

export function getNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function getErrorStatusCode(error: unknown) {
  if (!error || typeof error !== "object") return undefined;

  const record = error as Record<string, unknown>;
  const statusCode = getNumber(record.statusCode) ?? getNumber(record.status);

  return statusCode ?? undefined;
}

export function getErrorHeaders(error: unknown) {
  if (!error || typeof error !== "object") return {};

  const record = error as Record<string, unknown>;
  const headers = record.responseHeaders ?? record.headers;

  if (headers instanceof Headers) {
    return Object.fromEntries(
      [...headers.entries()].map(([key, value]) => [key.toLowerCase(), value]),
    );
  }

  if (!headers || typeof headers !== "object") return {};

  return Object.fromEntries(
    Object.entries(headers as Record<string, unknown>).map(([key, value]) => [
      key.toLowerCase(),
      String(value),
    ]),
  );
}

export function getHeaderNumber(
  headers: Record<string, string>,
  keys: string[],
) {
  for (const key of keys) {
    const value = headers[key.toLowerCase()];
    if (!value) continue;

    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }

  return undefined;
}

export function getResetAtFromHeaders(headers: Record<string, string>) {
  const retryAfter = headers["retry-after"];
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds)) {
      return new Date(Date.now() + seconds * 1000);
    }

    const timestamp = Date.parse(retryAfter);
    if (!Number.isNaN(timestamp)) return new Date(timestamp);
  }

  const reset = headers["x-ratelimit-reset"] ?? headers["ratelimit-reset"];
  if (!reset) return undefined;

  const seconds = Number(reset);
  if (Number.isFinite(seconds)) {
    if (seconds > 1_000_000_000) return new Date(seconds * 1000);

    return new Date(Date.now() + seconds * 1000);
  }

  const timestamp = Date.parse(reset);
  return Number.isNaN(timestamp) ? undefined : new Date(timestamp);
}

export function toError(error: unknown, fallbackMessage: string) {
  if (error instanceof Error) return error;
  if (typeof error === "string") return new Error(error);

  return new Error(fallbackMessage);
}

export function isMissingProviderUsageTableError(error: unknown) {
  if (!error || typeof error !== "object") return false;

  const record = error as { code?: unknown; message?: unknown };
  const code = typeof record.code === "string" ? record.code : "";
  const message = typeof record.message === "string" ? record.message : "";

  return (
    code === "P2021" ||
    code === "P2022" ||
    message.includes('relation "AiProviderUsage" does not exist') ||
    message.includes("The table `AiProviderUsage` does not exist") ||
    message.includes("42P01")
  );
}
