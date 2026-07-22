import { createHash } from "node:crypto";

import { generateText, Output, type LanguageModel } from "ai";
import { z } from "zod";

import {
  mergeSemanticSearchIntent,
  resolveDeterministicSemanticSearchIntent,
  type SemanticSearchIntent,
  type SemanticSearchIntentInput,
  type SemanticSearchIntentOptions,
} from "~/lib/semantic-search-intent";
import { getErrorMessage } from "~/server/ai/audit";
import {
  getAiIntentMaxOutputTokens,
  getResolvedAiModelReadinessError,
  isAiProviderQuotaError,
  recordAiProviderUsage,
  resolveAiChatModel,
  type AiModelCandidate,
  type AiProviderId,
} from "~/server/ai/model";

const AI_INTENT_TIMEOUT_MS = 1_800;
const INTENT_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const semanticIntentCache = new Map<
  string,
  { expiresAt: number; value: SemanticSearchIntent }
>();

const aiSemanticSearchIntentSchema = z.object({
  semanticQuery: z.string().trim().max(200).optional(),
  lexicalQuery: z.string().trim().max(160).optional(),
  hardFilters: z
    .object({
      category: z.string().trim().max(80).optional(),
      material: z.string().trim().max(80).optional(),
      stone: z.string().trim().max(80).optional(),
      maxPrice: z.number().positive().max(1_000_000).optional(),
    })
    .default({}),
  softSignals: z.array(z.string().trim().max(40)).max(12).default([]),
  excludedTerms: z.array(z.string().trim().max(80)).max(12).default([]),
  occasion: z.string().trim().max(80).optional(),
  recipient: z.string().trim().max(80).optional(),
  confidence: z.enum(["high", "medium", "low"]).default("medium"),
});

type AiSemanticSearchIntent = z.infer<typeof aiSemanticSearchIntentSchema>;

export async function resolveSemanticSearchIntent(
  input: SemanticSearchIntentInput,
  options: SemanticSearchIntentOptions = {},
): Promise<SemanticSearchIntent> {
  const deterministic = resolveDeterministicSemanticSearchIntent(
    input,
    options,
  );

  if (!input.query?.trim()) return deterministic;
  if (isAiSemanticSearchDisabled()) return deterministic;
  if (!shouldUseAiForSemanticIntent(deterministic)) return deterministic;

  const cacheKey = createIntentCacheKey(input, options);
  const cachedIntent = semanticIntentCache.get(cacheKey);

  if (cachedIntent && cachedIntent.expiresAt > Date.now()) {
    return cachedIntent.value;
  }
  if (cachedIntent) semanticIntentCache.delete(cacheKey);

  const resolvedModel = resolveAiChatModel();
  const readinessError = getResolvedAiModelReadinessError(resolvedModel);

  if (readinessError) return deterministic;

  const prompt = createSemanticIntentPrompt(input, options);
  const candidates = getSemanticIntentCandidates(resolvedModel);

  for (const candidate of candidates) {
    try {
      const result = await generateText({
        abortSignal: AbortSignal.timeout(AI_INTENT_TIMEOUT_MS),
        maxOutputTokens: getAiIntentMaxOutputTokens(),
        maxRetries: 0,
        model: candidate.model,
        output: Output.object({
          schema: aiSemanticSearchIntentSchema,
        }),
        prompt,
        temperature: 0,
      });
      const mergedIntent = mergeSemanticSearchIntent(
        deterministic,
        mapAiIntentOutput(result.output),
        options,
      );

      await recordAiProviderUsage({
        provider: candidate.provider,
        model: candidate.modelId,
        purpose: "semantic_intent",
        status: "succeeded",
        usage: result.usage,
      });
      semanticIntentCache.set(cacheKey, {
        value: mergedIntent,
        expiresAt: Date.now() + INTENT_CACHE_TTL_MS,
      });

      return mergedIntent;
    } catch (error) {
      await recordAiProviderUsage({
        provider: candidate.provider,
        model: candidate.modelId,
        purpose: "semantic_intent",
        status: isAiProviderQuotaError(error) ? "quota_exhausted" : "failed",
        metadata: {
          error: getErrorMessage(error),
        },
      });

      // Public search must degrade silently; provider telemetry is recorded
      // above, and RSC console errors leak into browser QA sessions.
    }
  }

  return deterministic;
}

export function resetSemanticIntentCacheForTests() {
  semanticIntentCache.clear();
}

function mapAiIntentOutput(
  output: AiSemanticSearchIntent,
): Partial<SemanticSearchIntent> {
  return {
    semanticQuery: output.semanticQuery,
    lexicalQuery: output.lexicalQuery,
    hardFilters: output.hardFilters,
    softSignals: output.softSignals,
    excludedTerms: output.excludedTerms,
    occasion: output.occasion,
    recipient: output.recipient,
    confidence: output.confidence,
    source: "ai",
  };
}

function createSemanticIntentPrompt(
  input: SemanticSearchIntentInput,
  options: SemanticSearchIntentOptions,
) {
  return [
    "You parse ecommerce jewelry search intent for Elysia.",
    "The user can write in Hebrew or English. Return structured intent only.",
    "Return only fields grounded in the user query or explicit filters.",
    "Hard filters must be exact values from the allowed lists. Soft signals may describe style, occasion, recipient, weight, or usage.",
    "Never invent product names, prices, inventory, or unavailable facets.",
    `User query: ${JSON.stringify(input.query ?? "")}`,
    `Explicit filters: ${JSON.stringify({
      category: input.category,
      material: input.material,
      maxPrice: input.maxPrice,
      stone: input.stone,
    })}`,
    `Allowed categories: ${JSON.stringify(options.categories ?? [])}`,
    `Allowed materials: ${JSON.stringify(options.facets?.materials ?? [])}`,
    `Allowed stones: ${JSON.stringify(options.facets?.stones ?? [])}`,
    "Examples:",
    "earrings for a bride under 700 => category earrings, maxPrice 700, softSignals bridal/delicate.",
    "gold ring without pearl => category rings, material gold if allowed, excludedTerms pearl.",
  ].join("\n");
}

function shouldUseAiForSemanticIntent(intent: SemanticSearchIntent) {
  return intent.confidence !== "high";
}

function isAiSemanticSearchDisabled() {
  return (
    process.env.AI_SEMANTIC_SEARCH_ENABLED === "0" ||
    process.env.AI_SEMANTIC_SEARCH_ENABLED === "false"
  );
}

function getSemanticIntentCandidates(
  resolvedModel: ReturnType<typeof resolveAiChatModel>,
): Array<{ provider: AiProviderId; modelId: string; model: LanguageModel }> {
  const readyCandidates = resolvedModel.candidates
    .filter(
      (
        candidate,
      ): candidate is AiModelCandidate & {
        model: NonNullable<AiModelCandidate["model"]>;
      } => Boolean(candidate.ready && candidate.model),
    )
    .map((candidate) => ({
      provider: candidate.provider,
      modelId: candidate.modelId,
      model: candidate.model,
    }));

  if (readyCandidates.length > 0) return readyCandidates;

  return [
    {
      provider: resolvedModel.provider,
      modelId: resolvedModel.modelId,
      model: resolvedModel.model,
    },
  ];
}

function createIntentCacheKey(
  input: SemanticSearchIntentInput,
  options: SemanticSearchIntentOptions,
) {
  const payload = {
    query: normalizeCacheText(input.query),
    category: input.category,
    material: input.material,
    stone: input.stone,
    maxPrice: input.maxPrice,
    categories: options.categories?.map((category) => category.slug).sort(),
    materials: options.facets?.materials.slice().sort(),
    stones: options.facets?.stones.slice().sort(),
  };

  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function normalizeCacheText(value?: string) {
  return value?.trim().toLowerCase().replace(/\s+/g, " ") ?? "";
}
