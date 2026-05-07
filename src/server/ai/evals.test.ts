import { describe, expect, it } from "vitest";

import {
  DETERMINISTIC_AI_EVAL_CASES,
  runDeterministicAiEvals,
} from "~/server/ai/evals";

describe("deterministic AI evals", () => {
  it("passes every curated agent planning scenario", () => {
    const results = runDeterministicAiEvals();

    expect(results).toHaveLength(DETERMINISTIC_AI_EVAL_CASES.length);
    expect(results.filter((result) => !result.passed)).toEqual([]);
  });

  it("reports failures with actionable details", () => {
    const [result] = runDeterministicAiEvals([
      {
        name: "intentionally wrong expectation",
        input: "מתנה לאמא עד 700 שח",
        expectedKind: "chat",
        expectedTools: [],
      },
    ]);

    expect(result?.passed).toBe(false);
    expect(result?.failures.join(" ")).toContain("expected kind");
  });
});
