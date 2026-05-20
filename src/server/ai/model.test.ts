import { describe, expect, it } from "vitest";

import {
  getResolvedAiModelReadinessError,
  isResolvedAiModelReady,
  resolveAiChatModel,
} from "~/server/ai/model";

describe("AI model resolver", () => {
  it("uses explicit gateway model ids without requiring a Google key", () => {
    const resolved = resolveAiChatModel({
      AI_CHAT_MODEL: "openai/gpt-5.4",
    });

    expect(resolved.modelId).toBe("openai/gpt-5.4");
    expect(resolved.provider).toBe("gateway");
    expect(resolved.requiresGoogleKey).toBe(false);
    expect(resolved.requiresGatewayAuth).toBe(true);
    expect(isResolvedAiModelReady(resolved, {})).toBe(false);
    expect(
      isResolvedAiModelReady(resolved, {
        VERCEL_OIDC_TOKEN: "oidc",
      }),
    ).toBe(true);
  });

  it("uses google: overrides with direct Google key requirements", () => {
    const resolved = resolveAiChatModel({
      AI_CHAT_MODEL: "google:gemini-2.5-flash-lite",
    });

    expect(resolved.modelId).toBe("google:gemini-2.5-flash-lite");
    expect(resolved.provider).toBe("google");
    expect(resolved.requiresGoogleKey).toBe(true);
    expect(resolved.requiresGatewayAuth).toBe(false);
    expect(isResolvedAiModelReady(resolved, {})).toBe(false);
    expect(
      isResolvedAiModelReady(resolved, {
        GOOGLE_GENERATIVE_AI_API_KEY: "key",
      }),
    ).toBe(true);
  });

  it("uses the free-tier router when no manual model override exists", () => {
    const resolved = resolveAiChatModel({});

    expect(resolved.modelId).toBe("free-tier-router");
    expect(resolved.provider).toBe("router");
    expect(isResolvedAiModelReady(resolved, {})).toBe(false);
  });

  it("prefers configured free providers in order", () => {
    const resolved = resolveAiChatModel({
      CEREBRAS_API_KEY: "cerebras-key",
      GROQ_API_KEY: "groq-key",
      FREE_AI_PROVIDER_ORDER: "groq,cerebras,google",
    });

    expect(resolved.provider).toBe("router");
    expect(resolved.modelId).toBe("groq:llama-3.1-8b-instant");
    expect(resolved.candidates.filter((candidate) => candidate.ready)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          provider: "groq",
          modelId: "llama-3.1-8b-instant",
        }),
        expect.objectContaining({
          provider: "cerebras",
          modelId: "qwen-3-235b-a22b-instruct-2507",
        }),
      ]),
    );
  });

  it("can resolve a single Cerebras override", () => {
    const resolved = resolveAiChatModel({
      AI_CHAT_MODEL: "cerebras:qwen-3-235b-a22b-instruct-2507",
    });

    expect(resolved.provider).toBe("cerebras");
    expect(resolved.modelId).toBe("cerebras:qwen-3-235b-a22b-instruct-2507");
    expect(isResolvedAiModelReady(resolved, {})).toBe(false);
    expect(
      isResolvedAiModelReady(resolved, {
        CEREBRAS_API_KEY: "key",
      }),
    ).toBe(true);
  });

  it("reports actionable readiness errors for missing model credentials", () => {
    const googleModel = resolveAiChatModel({
      AI_CHAT_MODEL: "google:gemini-2.5-flash-lite",
    });
    const gatewayModel = resolveAiChatModel({
      AI_CHAT_MODEL: "openai/gpt-5.4",
    });

    expect(getResolvedAiModelReadinessError(googleModel, {})).toContain(
      "GOOGLE_GENERATIVE_AI_API_KEY",
    );
    expect(getResolvedAiModelReadinessError(gatewayModel, {})).toContain(
      "VERCEL_OIDC_TOKEN",
    );
    expect(
      getResolvedAiModelReadinessError(gatewayModel, {
        AI_GATEWAY_API_KEY: "gateway-key",
      }),
    ).toBeUndefined();
  });
});
