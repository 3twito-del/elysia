import { describe, expect, it } from "vitest";

import { nextStage, summarizeCandidatesByStage } from "./recruiting";

describe("nextStage", () => {
  it("advances along the pipeline", () => {
    expect(nextStage("APPLIED")).toBe("SCREEN");
    expect(nextStage("SCREEN")).toBe("INTERVIEW");
    expect(nextStage("INTERVIEW")).toBe("OFFER");
    expect(nextStage("OFFER")).toBe("HIRED");
  });

  it("keeps terminal stages put", () => {
    expect(nextStage("HIRED")).toBe("HIRED");
    expect(nextStage("REJECTED")).toBe("REJECTED");
  });
});

describe("summarizeCandidatesByStage", () => {
  it("counts candidates per stage", () => {
    expect(
      summarizeCandidatesByStage([
        { stage: "APPLIED" },
        { stage: "APPLIED" },
        { stage: "INTERVIEW" },
      ]),
    ).toEqual({ APPLIED: 2, INTERVIEW: 1 });
  });
});
