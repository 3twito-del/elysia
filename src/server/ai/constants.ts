export const AI_PROMPT_VERSION = "elysia-commerce-agent-v1";

export const DEFAULT_GOOGLE_CHAT_MODEL = "gemini-2.5-flash-lite";
export const DEFAULT_GATEWAY_CHAT_MODEL = "openai/gpt-5.4";

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
