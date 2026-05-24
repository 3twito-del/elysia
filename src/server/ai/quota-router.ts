import { randomUUID } from "node:crypto";

import { google } from "@ai-sdk/google";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

import {
  DEFAULT_CEREBRAS_CHAT_MODEL,
  DEFAULT_CLOUDFLARE_CHAT_MODEL,
  DEFAULT_GATEWAY_CHAT_MODEL,
  DEFAULT_GOOGLE_CHAT_MODEL,
  DEFAULT_GROQ_CHAT_MODEL,
  FALLBACK_CEREBRAS_CHAT_MODEL,
} from "~/server/ai/constants";
import { getErrorMessage, toPrismaJson } from "~/server/ai/audit";
import type {
  AiModelCandidate,
  AiModelEnv,
  AiProviderUsageInput,
  AiPurpose,
  LanguageModelGenerateOptions,
  LanguageModelGenerateResult,
  LanguageModelStreamOptions,
  LanguageModelStreamResult,
  LanguageModelV3Like,
  ResolvedAiChatModel,
} from "~/server/ai/quota-router-types";
import {
  extractTokenUsage,
  getAiIntentMaxOutputTokenLimit,
  getAiMaxOutputTokenLimit,
  getDefaultAiModelEnv,
  getErrorHeaders,
  getErrorStatusCode,
  getHeaderNumber,
  getResetAtFromHeaders,
  isMissingProviderUsageTableError,
  parseProviderOrder,
  stripProviderPrefix,
  toError,
  trimToUndefined,
} from "~/server/ai/quota-router-utils";
import { db } from "~/server/db";

export type {
  AiModelCandidate,
  AiModelEnv,
  AiProviderId,
  AiPurpose,
  ResolvedAiChatModel,
} from "~/server/ai/quota-router-types";

const quotaBlocks = new Map<string, number>();

export function resolveAiChatModel(
  config: AiModelEnv = getDefaultAiModelEnv(),
): ResolvedAiChatModel {
  const configuredModel = config.AI_CHAT_MODEL?.trim();

  if (configuredModel) {
    return resolveConfiguredAiChatModel(configuredModel, config);
  }

  const candidates = createDefaultProviderCandidates(config);
  const readyCandidates = candidates.filter(
    (candidate) => candidate.ready && candidate.model,
  );

  if (readyCandidates.length === 1) {
    return toResolvedCandidate(readyCandidates[0]!);
  }

  if (readyCandidates.length > 1) {
    return {
      model: createFallbackLanguageModel(readyCandidates, "chat"),
      modelId: readyCandidates[0]?.displayModelId ?? "free-tier-router",
      provider: "router",
      requiresGatewayAuth: false,
      requiresGoogleKey: false,
      candidates,
    };
  }

  const readyGateway = candidates.find(
    (candidate) => candidate.provider === "gateway" && candidate.ready,
  );
  if (readyGateway) {
    return {
      model: readyGateway.modelId,
      modelId: readyGateway.displayModelId,
      provider: "gateway",
      requiresGatewayAuth: true,
      requiresGoogleKey: false,
      candidates,
    };
  }

  return {
    model: google(DEFAULT_GOOGLE_CHAT_MODEL),
    modelId: "free-tier-router",
    provider: "router",
    requiresGatewayAuth: false,
    requiresGoogleKey: false,
    candidates,
    readinessError:
      "No configured free-tier AI provider is ready. Configure CEREBRAS_API_KEY, GROQ_API_KEY, CLOUDFLARE_ACCOUNT_ID/CLOUDFLARE_AI_API_TOKEN, or GOOGLE_GENERATIVE_AI_API_KEY.",
  };
}

export function isResolvedAiModelReady(
  resolvedModel: ResolvedAiChatModel,
  config: AiModelEnv = getDefaultAiModelEnv(),
) {
  return getResolvedAiModelReadinessError(resolvedModel, config) === undefined;
}

export function getResolvedAiModelReadinessError(
  resolvedModel: ResolvedAiChatModel,
  config: AiModelEnv = getDefaultAiModelEnv(),
) {
  if (resolvedModel.readinessError) return resolvedModel.readinessError;

  if (
    resolvedModel.requiresGoogleKey &&
    !config.GOOGLE_GENERATIVE_AI_API_KEY?.trim()
  ) {
    return "Missing GOOGLE_GENERATIVE_AI_API_KEY for the configured Google chat model.";
  }

  if (
    resolvedModel.requiresGatewayAuth &&
    !config.VERCEL_OIDC_TOKEN?.trim() &&
    !config.AI_GATEWAY_API_KEY?.trim()
  ) {
    return "Missing VERCEL_OIDC_TOKEN or AI_GATEWAY_API_KEY for the configured AI Gateway chat model.";
  }

  if (
    resolvedModel.provider === "cerebras" &&
    !config.CEREBRAS_API_KEY?.trim()
  ) {
    return "Missing CEREBRAS_API_KEY for the configured Cerebras chat model.";
  }

  if (resolvedModel.provider === "groq" && !config.GROQ_API_KEY?.trim()) {
    return "Missing GROQ_API_KEY for the configured Groq chat model.";
  }

  if (
    resolvedModel.provider === "cloudflare" &&
    (!config.CLOUDFLARE_ACCOUNT_ID?.trim() ||
      !config.CLOUDFLARE_AI_API_TOKEN?.trim())
  ) {
    return "Missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_AI_API_TOKEN for the configured Cloudflare Workers AI chat model.";
  }

  return undefined;
}

export function getAiMaxOutputTokens(
  config: AiModelEnv = getDefaultAiModelEnv(),
) {
  return getAiMaxOutputTokenLimit(config);
}

export function getAiIntentMaxOutputTokens(
  config: AiModelEnv = getDefaultAiModelEnv(),
) {
  return getAiIntentMaxOutputTokenLimit(config);
}

export async function recordAiProviderUsage(input: AiProviderUsageInput) {
  const usage = extractTokenUsage(input.usage);
  const metadata =
    input.metadata === undefined
      ? null
      : JSON.stringify(toPrismaJson(input.metadata));

  try {
    await db.$executeRaw`
      INSERT INTO "AiProviderUsage" (
        "id",
        "provider",
        "model",
        "purpose",
        "status",
        "promptTokens",
        "completionTokens",
        "totalTokens",
        "remainingRequests",
        "remainingTokens",
        "resetAt",
        "metadata"
      )
      VALUES (
        ${randomUUID()},
        ${input.provider},
        ${input.model},
        ${input.purpose},
        ${input.status},
        ${usage.promptTokens},
        ${usage.completionTokens},
        ${usage.totalTokens},
        ${input.remainingRequests ?? null},
        ${input.remainingTokens ?? null},
        ${input.resetAt ?? null},
        ${metadata}::jsonb
      )
    `;
  } catch (error) {
    if (isMissingProviderUsageTableError(error)) {
      console.warn("[ai-provider-usage:unavailable]", getErrorMessage(error));
      return;
    }

    console.error("[ai-provider-usage:write-failed]", getErrorMessage(error));
  }
}

export function isAiProviderQuotaError(error: unknown) {
  const statusCode = getErrorStatusCode(error);
  if (statusCode === 429) return true;

  const message = getErrorMessage(error);
  return /rate.?limit|quota|exhausted|too many requests|resource_exhausted|insufficient/i.test(
    message,
  );
}

export function resetAiQuotaRouterStateForTests() {
  quotaBlocks.clear();
}

function resolveConfiguredAiChatModel(
  configuredModel: string,
  config: AiModelEnv,
): ResolvedAiChatModel {
  if (configuredModel.startsWith("cerebras:")) {
    return toResolvedCandidate(
      createCerebrasCandidate(
        configuredModel.slice("cerebras:".length),
        config,
      ),
    );
  }

  if (configuredModel.startsWith("groq:")) {
    return toResolvedCandidate(
      createGroqCandidate(configuredModel.slice("groq:".length), config),
    );
  }

  if (configuredModel.startsWith("cloudflare:")) {
    return toResolvedCandidate(
      createCloudflareCandidate(
        configuredModel.slice("cloudflare:".length),
        config,
      ),
    );
  }

  if (configuredModel.startsWith("google:")) {
    const modelId = configuredModel.slice("google:".length);
    return toResolvedCandidate(createGoogleCandidate(modelId, config));
  }

  if (
    configuredModel.startsWith("gateway:") ||
    configuredModel.startsWith("vercel-gateway:")
  ) {
    return toResolvedGateway(
      configuredModel.replace(/^gateway:|^vercel-gateway:/u, ""),
      config,
    );
  }

  if (configuredModel.includes("/")) {
    return toResolvedGateway(configuredModel, config);
  }

  return toResolvedCandidate(createGoogleCandidate(configuredModel, config));
}

function createDefaultProviderCandidates(config: AiModelEnv) {
  const candidates: AiModelCandidate[] = [];

  for (const provider of parseProviderOrder(config.FREE_AI_PROVIDER_ORDER)) {
    if (provider === "cerebras") {
      const primaryModel = stripProviderPrefix(
        config.CEREBRAS_CHAT_MODEL ?? DEFAULT_CEREBRAS_CHAT_MODEL,
        "cerebras",
      );
      candidates.push(createCerebrasCandidate(primaryModel, config));
      if (primaryModel !== FALLBACK_CEREBRAS_CHAT_MODEL) {
        candidates.push(
          createCerebrasCandidate(FALLBACK_CEREBRAS_CHAT_MODEL, config),
        );
      }
    }

    if (provider === "groq") {
      candidates.push(
        createGroqCandidate(
          stripProviderPrefix(
            config.GROQ_CHAT_MODEL ?? DEFAULT_GROQ_CHAT_MODEL,
            "groq",
          ),
          config,
        ),
      );
    }

    if (provider === "cloudflare") {
      candidates.push(
        createCloudflareCandidate(
          stripProviderPrefix(
            config.CLOUDFLARE_CHAT_MODEL ?? DEFAULT_CLOUDFLARE_CHAT_MODEL,
            "cloudflare",
          ),
          config,
        ),
      );
    }

    if (provider === "google") {
      candidates.push(createGoogleCandidate(DEFAULT_GOOGLE_CHAT_MODEL, config));
    }

    if (provider === "gateway") {
      candidates.push(
        createGatewayCandidate(DEFAULT_GATEWAY_CHAT_MODEL, config),
      );
    }
  }

  return candidates;
}

function createCerebrasCandidate(
  modelId: string,
  config: AiModelEnv,
): AiModelCandidate {
  const apiKey = config.CEREBRAS_API_KEY?.trim();
  const provider = createOpenAICompatible({
    name: "cerebras",
    apiKey,
    baseURL: "https://api.cerebras.ai/v1",
    includeUsage: true,
    supportsStructuredOutputs: true,
  });

  return applyQuotaState({
    provider: "cerebras",
    modelId,
    displayModelId: `cerebras:${modelId}`,
    model: provider.languageModel(modelId),
    ready: Boolean(apiKey),
    credentialEnv: "CEREBRAS_API_KEY",
    readinessError: apiKey
      ? undefined
      : "Missing CEREBRAS_API_KEY for the configured Cerebras chat model.",
  });
}

function createGroqCandidate(
  modelId: string,
  config: AiModelEnv,
): AiModelCandidate {
  const apiKey = config.GROQ_API_KEY?.trim();
  const provider = createOpenAICompatible({
    name: "groq",
    apiKey,
    baseURL: "https://api.groq.com/openai/v1",
    includeUsage: true,
    supportsStructuredOutputs: true,
  });

  return applyQuotaState({
    provider: "groq",
    modelId,
    displayModelId: `groq:${modelId}`,
    model: provider.languageModel(modelId),
    ready: Boolean(apiKey),
    credentialEnv: "GROQ_API_KEY",
    readinessError: apiKey
      ? undefined
      : "Missing GROQ_API_KEY for the configured Groq chat model.",
  });
}

function createCloudflareCandidate(
  modelId: string,
  config: AiModelEnv,
): AiModelCandidate {
  const accountId = trimToUndefined(config.CLOUDFLARE_ACCOUNT_ID);
  const apiToken = trimToUndefined(config.CLOUDFLARE_AI_API_TOKEN);
  const ready = Boolean(accountId && apiToken);
  const provider = createOpenAICompatible({
    name: "cloudflare",
    apiKey: apiToken,
    baseURL: `https://api.cloudflare.com/client/v4/accounts/${
      accountId ?? "missing-account"
    }/ai/v1`,
    includeUsage: true,
    supportsStructuredOutputs: true,
  });

  return applyQuotaState({
    provider: "cloudflare",
    modelId,
    displayModelId: `cloudflare:${modelId}`,
    model: provider.languageModel(modelId),
    ready,
    credentialEnv: "CLOUDFLARE_ACCOUNT_ID/CLOUDFLARE_AI_API_TOKEN",
    readinessError: ready
      ? undefined
      : "Missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_AI_API_TOKEN for the configured Cloudflare Workers AI chat model.",
  });
}

function createGoogleCandidate(
  modelId: string,
  config: AiModelEnv,
): AiModelCandidate {
  const apiKey = config.GOOGLE_GENERATIVE_AI_API_KEY?.trim();

  return applyQuotaState({
    provider: "google",
    modelId,
    displayModelId: `google:${modelId}`,
    model: google(modelId),
    ready: Boolean(apiKey),
    credentialEnv: "GOOGLE_GENERATIVE_AI_API_KEY",
    readinessError: apiKey
      ? undefined
      : "Missing GOOGLE_GENERATIVE_AI_API_KEY for the configured Google chat model.",
  });
}

function createGatewayCandidate(
  modelId: string,
  config: AiModelEnv,
): AiModelCandidate {
  const ready = Boolean(
    trimToUndefined(config.VERCEL_OIDC_TOKEN) ??
    trimToUndefined(config.AI_GATEWAY_API_KEY),
  );

  return applyQuotaState({
    provider: "gateway",
    modelId,
    displayModelId: modelId,
    ready,
    credentialEnv: "VERCEL_OIDC_TOKEN/AI_GATEWAY_API_KEY",
    readinessError: ready
      ? undefined
      : "Missing VERCEL_OIDC_TOKEN or AI_GATEWAY_API_KEY for the configured AI Gateway chat model.",
  });
}

function toResolvedCandidate(candidate: AiModelCandidate): ResolvedAiChatModel {
  return {
    model: candidate.model ?? google(DEFAULT_GOOGLE_CHAT_MODEL),
    modelId: candidate.displayModelId,
    provider: candidate.provider,
    requiresGatewayAuth: false,
    requiresGoogleKey: candidate.provider === "google",
    candidates: [candidate],
    readinessError: candidate.quotaBlockedUntil
      ? candidate.readinessError
      : undefined,
  };
}

function toResolvedGateway(
  modelId: string,
  config: AiModelEnv,
): ResolvedAiChatModel {
  const candidate = createGatewayCandidate(modelId, config);

  return {
    model: modelId,
    modelId,
    provider: "gateway",
    requiresGatewayAuth: true,
    requiresGoogleKey: false,
    candidates: [candidate],
    readinessError: candidate.quotaBlockedUntil
      ? candidate.readinessError
      : undefined,
  };
}

function createFallbackLanguageModel(
  candidates: AiModelCandidate[],
  purpose: AiPurpose,
): LanguageModelV3Like {
  const readyModels = candidates.filter(
    (
      candidate,
    ): candidate is AiModelCandidate & { model: LanguageModelV3Like } =>
      Boolean(candidate.model),
  );

  return {
    specificationVersion: "v3",
    provider: "free-tier-router",
    modelId: readyModels.map((candidate) => candidate.displayModelId).join(","),
    supportedUrls: {},
    doGenerate: (options) =>
      generateWithFallback(readyModels, purpose, options),
    doStream: (options) => streamWithFallback(readyModels, purpose, options),
  };
}

async function generateWithFallback(
  candidates: Array<AiModelCandidate & { model: LanguageModelV3Like }>,
  purpose: AiPurpose,
  options: LanguageModelGenerateOptions,
): Promise<LanguageModelGenerateResult> {
  let lastError: unknown;

  for (const candidate of candidates) {
    try {
      const result = await candidate.model.doGenerate(options);
      await recordAiProviderUsage({
        provider: candidate.provider,
        model: candidate.modelId,
        purpose,
        status: "succeeded",
        usage: result.usage,
        metadata: { routedBy: "free-tier-router" },
      });

      return result;
    } catch (error) {
      lastError = error;
      await recordProviderFailure(candidate, purpose, error);
    }
  }

  throw toError(lastError, "No AI provider candidates are available.");
}

async function streamWithFallback(
  candidates: Array<AiModelCandidate & { model: LanguageModelV3Like }>,
  purpose: AiPurpose,
  options: LanguageModelStreamOptions,
): Promise<LanguageModelStreamResult> {
  let lastError: unknown;

  for (const candidate of candidates) {
    try {
      return await candidate.model.doStream(options);
    } catch (error) {
      lastError = error;
      await recordProviderFailure(candidate, purpose, error);
    }
  }

  throw toError(lastError, "No AI provider candidates are available.");
}

async function recordProviderFailure(
  candidate: AiModelCandidate,
  purpose: AiPurpose,
  error: unknown,
) {
  const quotaError = isAiProviderQuotaError(error);
  const headers = getErrorHeaders(error);
  const resetAt = getResetAtFromHeaders(headers) ?? undefined;

  if (quotaError) {
    markProviderQuotaBlocked(candidate, resetAt);
  }

  await recordAiProviderUsage({
    provider: candidate.provider,
    model: candidate.modelId,
    purpose,
    status: quotaError ? "quota_exhausted" : "failed",
    remainingRequests: getHeaderNumber(headers, [
      "x-ratelimit-remaining-requests",
      "x-ratelimit-remaining",
      "ratelimit-remaining",
    ]),
    remainingTokens: getHeaderNumber(headers, [
      "x-ratelimit-remaining-tokens",
      "x-ratelimit-remaining-tokens-minute",
    ]),
    resetAt,
    metadata: {
      error: getErrorMessage(error),
      statusCode: getErrorStatusCode(error),
      routedBy: "free-tier-router",
    },
  });
}

function applyQuotaState(candidate: AiModelCandidate): AiModelCandidate {
  const blockedUntil = getQuotaBlockedUntil(candidate);
  if (!blockedUntil) return candidate;

  return {
    ...candidate,
    ready: false,
    quotaBlockedUntil: blockedUntil,
    readinessError: `${candidate.displayModelId} is locally quota-blocked until ${blockedUntil.toISOString()}.`,
  };
}

function markProviderQuotaBlocked(candidate: AiModelCandidate, resetAt?: Date) {
  if (!isDailyHardStopEnabled()) return;

  const until = resetAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000);
  quotaBlocks.set(getQuotaBlockKey(candidate), until.getTime());
}

function getQuotaBlockedUntil(candidate: AiModelCandidate) {
  if (!isDailyHardStopEnabled()) return undefined;

  const blockedUntil = quotaBlocks.get(getQuotaBlockKey(candidate));
  if (!blockedUntil) return undefined;

  if (blockedUntil <= Date.now()) {
    quotaBlocks.delete(getQuotaBlockKey(candidate));
    return undefined;
  }

  return new Date(blockedUntil);
}

function getQuotaBlockKey(
  candidate: Pick<AiModelCandidate, "provider" | "modelId">,
) {
  return `${candidate.provider}:${candidate.modelId}`;
}

function isDailyHardStopEnabled(config: AiModelEnv = getDefaultAiModelEnv()) {
  return (
    config.AI_DAILY_HARD_STOP !== "0" && config.AI_DAILY_HARD_STOP !== "false"
  );
}
