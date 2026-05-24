import type { LanguageModel } from "ai";

export type AiProviderId =
  | "cerebras"
  | "groq"
  | "cloudflare"
  | "google"
  | "gateway"
  | "router";

export type AiPurpose =
  | "chat"
  | "semantic_intent"
  | "embedding"
  | "catalog"
  | "gift"
  | "test";

export type ConcreteLanguageModel = Exclude<LanguageModel, string>;
export type LanguageModelV3Like = Extract<
  ConcreteLanguageModel,
  { specificationVersion: "v3" }
>;
export type LanguageModelGenerateOptions = Parameters<
  LanguageModelV3Like["doGenerate"]
>[0];
export type LanguageModelGenerateResult = Awaited<
  ReturnType<LanguageModelV3Like["doGenerate"]>
>;
export type LanguageModelStreamOptions = Parameters<
  LanguageModelV3Like["doStream"]
>[0];
export type LanguageModelStreamResult = Awaited<
  ReturnType<LanguageModelV3Like["doStream"]>
>;

export type AiModelEnv = {
  AI_CHAT_MODEL?: string;
  AI_GATEWAY_API_KEY?: string;
  AI_DAILY_HARD_STOP?: string;
  AI_INTENT_MAX_OUTPUT_TOKENS?: number;
  AI_MAX_OUTPUT_TOKENS?: number;
  CEREBRAS_API_KEY?: string;
  CEREBRAS_CHAT_MODEL?: string;
  CLOUDFLARE_ACCOUNT_ID?: string;
  CLOUDFLARE_AI_API_TOKEN?: string;
  CLOUDFLARE_CHAT_MODEL?: string;
  FREE_AI_PROVIDER_ORDER?: string;
  GOOGLE_GENERATIVE_AI_API_KEY?: string;
  GROQ_API_KEY?: string;
  GROQ_CHAT_MODEL?: string;
  VERCEL_OIDC_TOKEN?: string;
};

export type AiModelCandidate = {
  provider: Exclude<AiProviderId, "router">;
  modelId: string;
  displayModelId: string;
  model?: LanguageModelV3Like;
  ready: boolean;
  credentialEnv?: string;
  readinessError?: string;
  quotaBlockedUntil?: Date;
};

export type ResolvedAiChatModel = {
  model: LanguageModel;
  modelId: string;
  provider: AiProviderId;
  requiresGoogleKey: boolean;
  requiresGatewayAuth: boolean;
  candidates: AiModelCandidate[];
  readinessError?: string;
};

export type AiProviderUsageInput = {
  provider: string;
  model: string;
  purpose: AiPurpose;
  status: "succeeded" | "failed" | "quota_exhausted";
  usage?: unknown;
  metadata?: unknown;
  remainingRequests?: number;
  remainingTokens?: number;
  resetAt?: Date;
};
