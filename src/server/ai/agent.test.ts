import { describe, expect, it } from "vitest";

import { createAiCommerceAgentInstructions } from "~/server/ai/agent";
import { AI_RUN_KIND } from "~/server/ai/constants";
import type { AiPlanningContext } from "~/server/ai/planner";

describe("AI commerce agent instructions", () => {
  it("includes deterministic catalog hints when catalog tools are active", () => {
    const instructions = createAiCommerceAgentInstructions({
      kind: AI_RUN_KIND.catalogSearch,
      signals: ["catalog"],
      shouldUseCatalog: true,
      requiresApproval: false,
      safetyFlags: [],
      confidence: "high",
      missingFields: [],
      clarificationRequired: false,
      catalogHints: {
        category: "earrings",
        maxPrice: 700,
      },
    });

    expect(instructions).toContain("רמזי חיפוש");
    expect(instructions).toContain('"category":"earrings"');
  });

  it("includes a clarification guard when required fields are missing", () => {
    const instructions = createAiCommerceAgentInstructions({
      kind: AI_RUN_KIND.orderSupport,
      signals: ["order_support"],
      shouldUseCatalog: false,
      requiresApproval: false,
      safetyFlags: [],
      confidence: "medium",
      missingFields: ["email"],
      clarificationRequired: true,
    } satisfies AiPlanningContext);

    expect(instructions).toContain("missingFields");
    expect(instructions).toContain("email");
    expect(instructions).toContain("clarificationRequired=true");
    expect(instructions).toContain("שאלת הבהרה קצרה אחת");
  });

  it("does not force clarification for useful non-blocking missing fields", () => {
    const instructions = createAiCommerceAgentInstructions({
      kind: AI_RUN_KIND.giftRecommendation,
      signals: ["gift", "catalog"],
      shouldUseCatalog: true,
      requiresApproval: false,
      safetyFlags: [],
      confidence: "medium",
      missingFields: ["occasion"],
      clarificationRequired: false,
      catalogHints: {
        query: "מתנה לאמא עד 700 שח בסגנון עדין",
        maxPrice: 700,
      },
    } satisfies AiPlanningContext);

    expect(instructions).toContain("רמזי חיפוש");
    expect(instructions).not.toContain("clarificationRequired=true");
  });
});
