import { describe, expect, it } from "vitest";

import {
  describeBusinessAction,
  evaluateBusinessRules,
  slaDeadlines,
  slaState,
  validateBusinessAction,
} from "./business-rules";

describe("evaluateBusinessRules", () => {
  const rules = [
    {
      id: "r1",
      name: "high value",
      priority: 50,
      conditionRule: { field: "total", op: "gt", value: 1000 },
      action: { type: "REQUIRE_APPROVAL" as const },
    },
    {
      id: "r2",
      name: "vip",
      priority: 10,
      conditionRule: { field: "vip", op: "truthy" },
      action: { type: "FLAG", config: { label: "vip" } },
    },
    {
      id: "r3",
      name: "blocked",
      priority: 99,
      conditionRule: { field: "country", op: "eq", value: "XX" },
      action: { type: "ESCALATE" },
    },
  ];

  it("returns matched rules in priority order", () => {
    const matched = evaluateBusinessRules(rules, {
      total: 1500,
      vip: true,
      country: "IL",
    });
    expect(matched.map((rule) => rule.id)).toEqual(["r2", "r1"]);
    expect(matched[0]?.description).toBe("סימון: vip");
  });

  it("returns nothing when no rule matches", () => {
    expect(evaluateBusinessRules(rules, { total: 5 })).toEqual([]);
  });
});

describe("validateBusinessAction", () => {
  it("accepts known actions and rejects unknown", () => {
    expect(validateBusinessAction({ type: "FLAG" })).toEqual([]);
    expect(validateBusinessAction({ type: "ZAP" })).toEqual([
      "סוג פעולה לא נתמך: ZAP.",
    ]);
  });
});

describe("describeBusinessAction", () => {
  it("includes config detail when present", () => {
    expect(
      describeBusinessAction({ type: "SET_PRIORITY", config: { value: "HIGH" } }),
    ).toBe("קביעת עדיפות: HIGH");
    expect(describeBusinessAction({ type: "ESCALATE" })).toBe("הסלמה");
  });
});

describe("slaDeadlines + slaState", () => {
  const startedAt = new Date("2026-06-27T08:00:00Z");

  it("computes response/resolution deadlines", () => {
    const { responseBy, resolutionBy } = slaDeadlines({
      startedAt,
      responseMinutes: 60,
      resolutionMinutes: 240,
    });
    expect(responseBy.toISOString()).toBe("2026-06-27T09:00:00.000Z");
    expect(resolutionBy.toISOString()).toBe("2026-06-27T12:00:00.000Z");
  });

  it("classifies OK / DUE_SOON / BREACHED", () => {
    const deadline = new Date("2026-06-27T09:00:00Z"); // 60 min window
    expect(
      slaState({ startedAt, deadline, now: new Date("2026-06-27T08:30:00Z") }),
    ).toBe("OK");
    expect(
      slaState({ startedAt, deadline, now: new Date("2026-06-27T08:50:00Z") }),
    ).toBe("DUE_SOON");
    expect(
      slaState({ startedAt, deadline, now: new Date("2026-06-27T09:05:00Z") }),
    ).toBe("BREACHED");
  });
});
