import { describe, expect, it } from "vitest";

import {
  AiGuardrailError,
  assertAiActionAllowed,
  isModeAllowed,
  maxAutonomyFor,
  summarizeAiRuns,
} from "./ai-governance";

describe("guardrails", () => {
  it("caps books domains at APPROVE, allows autonomy elsewhere", () => {
    expect(maxAutonomyFor("ledger")).toBe("APPROVE");
    expect(maxAutonomyFor("payments")).toBe("APPROVE");
    expect(maxAutonomyFor("crm")).toBe("AUTONOMOUS");
  });

  it("isModeAllowed forbids autonomous on books only", () => {
    expect(isModeAllowed("ledger", "AUTONOMOUS")).toBe(false);
    expect(isModeAllowed("ledger", "APPROVE")).toBe(true);
    expect(isModeAllowed("ledger", "RECOMMEND")).toBe(true);
    expect(isModeAllowed("marketing", "AUTONOMOUS")).toBe(true);
  });

  it("assertAiActionAllowed throws on autonomous books action", () => {
    expect(() => assertAiActionAllowed({ domain: "tax", mode: "AUTONOMOUS" })).toThrow(
      AiGuardrailError,
    );
    expect(() =>
      assertAiActionAllowed({ domain: "tax", mode: "APPROVE" }),
    ).not.toThrow();
    expect(() =>
      assertAiActionAllowed({ domain: "crm", mode: "AUTONOMOUS" }),
    ).not.toThrow();
  });
});

describe("summarizeAiRuns", () => {
  it("computes counts, success rate and avg duration", () => {
    expect(
      summarizeAiRuns([
        { status: "SUCCEEDED", durationMs: 100 },
        { status: "SUCCEEDED", durationMs: 300 },
        { status: "FAILED", durationMs: 200 },
        { status: "STARTED", durationMs: null },
      ]),
    ).toEqual({
      total: 4,
      succeeded: 2,
      failed: 1,
      running: 1,
      successRate: 67,
      avgDurationMs: 200,
    });
  });

  it("handles no runs", () => {
    expect(summarizeAiRuns([])).toEqual({
      total: 0,
      succeeded: 0,
      failed: 0,
      running: 0,
      successRate: 0,
      avgDurationMs: 0,
    });
  });
});
