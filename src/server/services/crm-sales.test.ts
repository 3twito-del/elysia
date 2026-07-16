import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  pipelineByStage,
  weightedPipelineValue,
  winRate,
} from "./crm-sales";

const opportunities = [
  { stage: "QUALIFIED", status: "OPEN", amount: 1000, probability: 20 },
  { stage: "PROPOSAL", status: "OPEN", amount: 2000, probability: 50 },
  { stage: "NEGOTIATION", status: "OPEN", amount: 4000, probability: 75 },
  { stage: "WON", status: "WON", amount: 5000, probability: 100 },
  { stage: "LOST", status: "LOST", amount: 3000, probability: 0 },
];

describe("weightedPipelineValue", () => {
  it("sums amount × probability over open opportunities only", () => {
    // 1000*0.2 + 2000*0.5 + 4000*0.75 = 200 + 1000 + 3000 = 4200
    expect(weightedPipelineValue(opportunities)).toBe(4200);
  });

  it("is zero with no open opportunities", () => {
    expect(
      weightedPipelineValue([
        { stage: "WON", status: "WON", amount: 5000, probability: 100 },
      ]),
    ).toBe(0);
  });
});

describe("pipelineByStage", () => {
  it("groups open opportunities by stage with totals", () => {
    const rows = pipelineByStage(opportunities);
    expect(rows).toHaveLength(3);

    const negotiation = rows.find((row) => row.stage === "NEGOTIATION");
    expect(negotiation).toEqual({
      stage: "NEGOTIATION",
      count: 1,
      amount: 4000,
      weighted: 3000,
    });
  });
});

describe("winRate", () => {
  it("computes won / (won + lost) as a percentage", () => {
    expect(winRate(opportunities)).toBe(50);
  });

  it("is zero when nothing has closed", () => {
    expect(
      winRate([
        { stage: "PROPOSAL", status: "OPEN", amount: 1, probability: 50 },
      ]),
    ).toBe(0);
  });
});

describe("K-14 audit coverage", () => {
  it("createLead, convertLeadToOpportunity, setOpportunityStage, updateLead, and updateOpportunityDetails write an AuditLog row", () => {
    const source = readFileSync(
      path.join(process.cwd(), "src/server/services/crm-sales.ts"),
      "utf8",
    );

    for (const operation of [
      "createLead",
      "convertLeadToOpportunity",
      "setOpportunityStage",
      "updateLead",
      "updateOpportunityDetails",
    ]) {
      const start = source.indexOf(`export async function ${operation}`);
      const next = source.indexOf("\nexport async function ", start + 1);

      expect(start).toBeGreaterThanOrEqual(0);

      const body = source.slice(start, next === -1 ? source.length : next);

      expect(body).toContain("writeAdminAudit");
    }
  });
});
