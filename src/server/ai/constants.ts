export const AI_PROMPT_VERSION = "elysia-commerce-agent-v1";

export const DEFAULT_GOOGLE_CHAT_MODEL = "gemini-2.5-flash-lite";
export const DEFAULT_GATEWAY_CHAT_MODEL = "openai/gpt-5.4";
export const DEFAULT_FREE_AI_PROVIDER_ORDER = [
  "cerebras",
  "groq",
  "cloudflare",
  "google",
] as const;
export const DEFAULT_CEREBRAS_CHAT_MODEL = "qwen-3-235b-a22b-instruct-2507";
export const FALLBACK_CEREBRAS_CHAT_MODEL = "llama3.1-8b";
export const DEFAULT_GROQ_CHAT_MODEL = "llama-3.1-8b-instant";
export const DEFAULT_CLOUDFLARE_CHAT_MODEL = "@cf/zai-org/glm-4.7-flash";
export const DEFAULT_CLOUDFLARE_EMBEDDING_MODEL = "@cf/baai/bge-m3";
export const DEFAULT_AI_MAX_OUTPUT_TOKENS = 500;
export const DEFAULT_AI_INTENT_MAX_OUTPUT_TOKENS = 128;

export const AI_TOOL_WORKFLOW_MODEL = "elysia-agent-tools-v1";

export const AI_RUN_STATUS = {
  started: "STARTED",
  succeeded: "SUCCEEDED",
  failed: "FAILED",
} as const;

export const AI_RUN_KIND = {
  chat: "chat",
  catalogSearch: "catalog_search",
  giftRecommendation: "gift_recommendation",
  styleProfile: "style_profile",
  tryOn: "try_on",
  orderSupport: "order_support",
} as const;
