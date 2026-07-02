import { describe, expect, it } from "vitest";

import { buildCopilotContext, fallbackAnswer } from "./admin-copilot";

const snapshot = {
  overdueCount: 3,
  overdueTotal: 12500,
  dunningEscalations: 1,
  fxUnrealized: -240,
  costMargin: 8800,
};

describe("buildCopilotContext", () => {
  it("renders the key metrics as grounding lines", () => {
    const context = buildCopilotContext(snapshot);
    expect(context).toContain("חשבוניות באיחור (AR): 3");
    expect(context).toContain("12500");
    expect(context).toContain("הסלמות גבייה (רמה 3+): 1");
    expect(context).toContain("-240");
    expect(context).toContain("8800");
  });
});

describe("fallbackAnswer", () => {
  it("prefixes a no-AI summary and includes the context", () => {
    const answer = fallbackAnswer(snapshot);
    expect(answer.startsWith("סיכום מדדים (ללא AI):")).toBe(true);
    expect(answer).toContain("12500");
  });
});
