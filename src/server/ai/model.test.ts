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

  it("falls back to the gateway model when no direct Google key exists", () => {
    const resolved = resolveAiChatModel({});

    expect(resolved.modelId).toBe("openai/gpt-5.4");
    expect(resolved.provider).toBe("gateway");
    expect(isResolvedAiModelReady(resolved, {})).toBe(false);
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
