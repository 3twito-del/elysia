import { describe, expect, it } from "vitest";

import { AI_RUN_KIND } from "~/server/ai/constants";
import {
  AiToolPolicyError,
  assertAiToolPolicy,
  type AiToolPolicyContext,
} from "~/server/ai/policy";
import type { AiRunKind } from "~/server/ai/planner";

describe("AI tool policy", () => {
  it("allows catalog searches for catalog-backed planning", () => {
    expect(() =>
      assertAiToolPolicy({
        toolName: "searchCatalog",
        toolInput: { query: "ring" },
        context: createPolicyContext(AI_RUN_KIND.catalogSearch),
      }),
    ).not.toThrow();
  });

  it("blocks catalog searches when planning did not expose catalog tools", () => {
    expect(() =>
      assertAiToolPolicy({
        toolName: "searchCatalog",
        toolInput: { query: "ring" },
        context: createPolicyContext(AI_RUN_KIND.chat),
      }),
    ).toThrow(AiToolPolicyError);
  });

  it("blocks style profile writes outside explicit style profile intent", () => {
    expect(() =>
      assertAiToolPolicy({
        toolName: "saveStyleProfile",
        toolInput: { styles: ["daily"] },
        context: createPolicyContext(AI_RUN_KIND.catalogSearch),
      }),
    ).toThrow(AiToolPolicyError);
  });

  it("blocks try-on creation outside explicit try-on intent", () => {
    expect(() =>
      assertAiToolPolicy({
        toolName: "createTryOnSession",
        toolInput: { productSlug: "venus-ring" },
        context: createPolicyContext(AI_RUN_KIND.giftRecommendation),
      }),
    ).toThrow(AiToolPolicyError);
  });

  it("requires order support intent and complete order lookup input", () => {
    expect(() =>
      assertAiToolPolicy({
        toolName: "orderSupport",
        toolInput: { orderNumber: "APH-1", email: "dana@example.com" },
        context: createPolicyContext(AI_RUN_KIND.orderSupport),
      }),
    ).not.toThrow();

    expect(() =>
      assertAiToolPolicy({
        toolName: "orderSupport",
        toolInput: { orderNumber: "APH-1" },
        context: createPolicyContext(AI_RUN_KIND.orderSupport),
      }),
    ).toThrow(AiToolPolicyError);
  });
});

function createPolicyContext(kind: AiRunKind) {
  return {
    planning: {
      kind,
      signals: [],
      shouldUseCatalog:
        kind === AI_RUN_KIND.catalogSearch ||
        kind === AI_RUN_KIND.giftRecommendation ||
        kind === AI_RUN_KIND.styleProfile ||
        kind === AI_RUN_KIND.tryOn,
      requiresApproval:
        kind === AI_RUN_KIND.styleProfile || kind === AI_RUN_KIND.tryOn,
      safetyFlags: [],
      confidence: "high",
      missingFields: [],
      clarificationRequired: false,
    },
  } satisfies AiToolPolicyContext;
}
