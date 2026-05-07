import type { LanguageModel } from "ai";
import { google } from "@ai-sdk/google";

import { env } from "~/env";
import {
  DEFAULT_GATEWAY_CHAT_MODEL,
  DEFAULT_GOOGLE_CHAT_MODEL,
} from "~/server/ai/constants";

export type AiModelEnv = {
  AI_CHAT_MODEL?: string;
  AI_GATEWAY_API_KEY?: string;
  GOOGLE_GENERATIVE_AI_API_KEY?: string;
  VERCEL_OIDC_TOKEN?: string;
};

export type ResolvedAiChatModel = {
  model: LanguageModel;
  modelId: string;
  provider: "google" | "gateway";
  requiresGoogleKey: boolean;
  requiresGatewayAuth: boolean;
};

export function resolveAiChatModel(
  config: AiModelEnv = {
    AI_CHAT_MODEL: env.AI_CHAT_MODEL,
    AI_GATEWAY_API_KEY: env.AI_GATEWAY_API_KEY,
    GOOGLE_GENERATIVE_AI_API_KEY: env.GOOGLE_GENERATIVE_AI_API_KEY,
    VERCEL_OIDC_TOKEN: env.VERCEL_OIDC_TOKEN,
  },
): ResolvedAiChatModel {
  const configuredModel = config.AI_CHAT_MODEL?.trim();

  if (configuredModel?.startsWith("google:")) {
    const modelId = configuredModel.slice("google:".length);

    return {
      model: google(modelId),
      modelId: configuredModel,
      provider: "google",
      requiresGoogleKey: true,
      requiresGatewayAuth: false,
    };
  }

  if (configuredModel && !configuredModel.includes("/")) {
    return {
      model: google(configuredModel),
      modelId: `google:${configuredModel}`,
      provider: "google",
      requiresGoogleKey: true,
      requiresGatewayAuth: false,
    };
  }

  if (configuredModel) {
    return {
      model: configuredModel,
      modelId: configuredModel,
      provider: "gateway",
      requiresGoogleKey: false,
      requiresGatewayAuth: true,
    };
  }

  if (config.GOOGLE_GENERATIVE_AI_API_KEY) {
    return {
      model: google(DEFAULT_GOOGLE_CHAT_MODEL),
      modelId: `google:${DEFAULT_GOOGLE_CHAT_MODEL}`,
      provider: "google",
      requiresGoogleKey: true,
      requiresGatewayAuth: false,
    };
  }

  return {
    model: DEFAULT_GATEWAY_CHAT_MODEL,
    modelId: DEFAULT_GATEWAY_CHAT_MODEL,
    provider: "gateway",
    requiresGoogleKey: false,
    requiresGatewayAuth: true,
  };
}

export function isResolvedAiModelReady(
  resolvedModel: ResolvedAiChatModel,
  config: AiModelEnv = {
    AI_GATEWAY_API_KEY: env.AI_GATEWAY_API_KEY,
    GOOGLE_GENERATIVE_AI_API_KEY: env.GOOGLE_GENERATIVE_AI_API_KEY,
    VERCEL_OIDC_TOKEN: env.VERCEL_OIDC_TOKEN,
  },
) {
  return getResolvedAiModelReadinessError(resolvedModel, config) === undefined;
}

export function getResolvedAiModelReadinessError(
  resolvedModel: ResolvedAiChatModel,
  config: AiModelEnv = {
    AI_GATEWAY_API_KEY: env.AI_GATEWAY_API_KEY,
    GOOGLE_GENERATIVE_AI_API_KEY: env.GOOGLE_GENERATIVE_AI_API_KEY,
    VERCEL_OIDC_TOKEN: env.VERCEL_OIDC_TOKEN,
  },
) {
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

  return undefined;
}
