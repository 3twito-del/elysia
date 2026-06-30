import type { Prisma } from "@prisma/client";

import { db } from "~/server/db";
import { toDisplayString } from "~/lib/stringify";
import {
  describeCondition,
  evaluateCondition,
  validateRule,
  type RuleContext,
} from "~/server/services/workflow-rules";

/**
 * Business rules + generic SLA (WFL-005). A business rule synchronously
 * classifies any entity: when its condition matches a record, the action
 * (flag / priority / approval / escalation) applies. SLA policies define
 * response/resolution targets per entity tier, feeding escalation. Evaluation,
 * SLA deadlines and breach state are pure + unit-tested.
 */

export const BUSINESS_ACTIONS = [
  "FLAG",
  "SET_PRIORITY",
  "REQUIRE_APPROVAL",
  "ESCALATE",
  "NOTIFY",
] as const;

export type BusinessActionType = (typeof BUSINESS_ACTIONS)[number];

export const SLA_TIERS = ["LOW", "STANDARD", "HIGH", "URGENT"] as const;
export type SlaTier = (typeof SLA_TIERS)[number];

export type BusinessRuleAction = { type: string; config?: Record<string, unknown> };

const actionLabel: Record<string, string> = {
  FLAG: "סימון",
  SET_PRIORITY: "קביעת עדיפות",
  REQUIRE_APPROVAL: "דרישת אישור",
  ESCALATE: "הסלמה",
  NOTIFY: "התראה",
};

const asJson = (value: unknown) => value as Prisma.InputJsonValue;

function parseAction(value: Prisma.JsonValue | null | undefined): BusinessRuleAction {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { type: "FLAG" };
  }
  const node = value as Record<string, unknown>;
  return {
    type: typeof node.type === "string" ? node.type : "FLAG",
    config:
      node.config && typeof node.config === "object" && !Array.isArray(node.config)
        ? (node.config as Record<string, unknown>)
        : undefined,
  };
}

/** One-line Hebrew description of a business action. Pure. */
export function describeBusinessAction(action: BusinessRuleAction): string {
  const label = actionLabel[action.type] ?? action.type;
  const detail =
    action.config?.label ?? action.config?.value ?? action.config?.message;
  return detail ? `${label}: ${toDisplayString(detail)}` : label;
}

/** Validates a business action. Pure. */
export function validateBusinessAction(action: unknown): string[] {
  if (!action || typeof action !== "object") return ["פעולה לא תקינה."];
  const node = action as BusinessRuleAction;
  if (!(BUSINESS_ACTIONS as readonly string[]).includes(node.type)) {
    return [`סוג פעולה לא נתמך: ${toDisplayString(node.type)}.`];
  }
  return [];
}

export type EvaluatedRule = {
  id: string;
  name: string;
  action: BusinessRuleAction;
  description: string;
};

/**
 * Evaluates business rules against a record, returning the matched rules in
 * priority order (lowest number first). Pure — produces classifications, never
 * mutates. Reuses the workflow rule engine.
 */
export function evaluateBusinessRules(
  rules: Array<{
    id: string;
    name: string;
    priority: number;
    conditionRule: unknown;
    action: BusinessRuleAction;
  }>,
  context: RuleContext,
): EvaluatedRule[] {
  return [...rules]
    .sort((a, b) => a.priority - b.priority)
    .filter((rule) => evaluateCondition(rule.conditionRule, context))
    .map((rule) => ({
      id: rule.id,
      name: rule.name,
      action: rule.action,
      description: describeBusinessAction(rule.action),
    }));
}

/** Response + resolution deadlines from a start time and SLA minutes. Pure. */
export function slaDeadlines(input: {
  startedAt: Date;
  responseMinutes: number;
  resolutionMinutes: number;
}) {
  const minute = 60 * 1000;
  return {
    responseBy: new Date(input.startedAt.getTime() + input.responseMinutes * minute),
    resolutionBy: new Date(
      input.startedAt.getTime() + input.resolutionMinutes * minute,
    ),
  };
}

/** SLA state for a deadline: OK / DUE_SOON (within 20%) / BREACHED. Pure. */
export function slaState(input: {
  startedAt: Date;
  deadline: Date;
  now: Date;
}): "OK" | "DUE_SOON" | "BREACHED" {
  if (input.now.getTime() >= input.deadline.getTime()) return "BREACHED";
  const total = input.deadline.getTime() - input.startedAt.getTime();
  const remaining = input.deadline.getTime() - input.now.getTime();
  return total > 0 && remaining <= total * 0.2 ? "DUE_SOON" : "OK";
}

// ---- persistence ----

export async function createBusinessRule(input: {
  name: string;
  entityType: string;
  conditionRule: unknown;
  action: BusinessRuleAction;
  priority?: number;
}) {
  if (!input.name.trim()) throw new Error("שם החוק הוא שדה חובה.");
  if (!input.entityType.trim()) throw new Error("סוג ישות הוא שדה חובה.");

  const ruleErrors = validateRule(input.conditionRule ?? null);
  if (ruleErrors.length > 0) throw new Error(ruleErrors.join(" "));
  const actionErrors = validateBusinessAction(input.action);
  if (actionErrors.length > 0) throw new Error(actionErrors.join(" "));

  return db.businessRule.create({
    data: {
      name: input.name.trim(),
      entityType: input.entityType.trim(),
      conditionRule: asJson(input.conditionRule ?? {}),
      action: asJson(input.action),
      priority: Math.trunc(input.priority ?? 100),
    },
  });
}

export async function setBusinessRuleActive(input: {
  ruleId: string;
  isActive: boolean;
}) {
  return db.businessRule.update({
    where: { id: input.ruleId },
    data: { isActive: input.isActive },
  });
}

export async function deleteBusinessRule(input: { ruleId: string }) {
  return db.businessRule.delete({ where: { id: input.ruleId } });
}

/** Loads active rules for an entity type and classifies a record. */
export async function applyBusinessRules(input: {
  entityType: string;
  context: RuleContext;
}) {
  const rules = await db.businessRule.findMany({
    where: { entityType: input.entityType, isActive: true },
  });
  return evaluateBusinessRules(
    rules.map((rule) => ({
      id: rule.id,
      name: rule.name,
      priority: rule.priority,
      conditionRule: rule.conditionRule,
      action: parseAction(rule.action),
    })),
    input.context,
  );
}

export async function listBusinessRules(limit = 30) {
  const rules = await db.businessRule.findMany({
    orderBy: [{ entityType: "asc" }, { priority: "asc" }],
    take: limit,
    select: {
      id: true,
      name: true,
      entityType: true,
      conditionRule: true,
      action: true,
      priority: true,
      isActive: true,
    },
  });

  return rules.map((rule) => ({
    id: rule.id,
    name: rule.name,
    entityType: rule.entityType,
    condition: describeCondition(rule.conditionRule),
    action: describeBusinessAction(parseAction(rule.action)),
    priority: rule.priority,
    isActive: rule.isActive,
  }));
}

export async function upsertSlaPolicy(input: {
  name: string;
  entityType: string;
  tier?: string;
  responseMinutes: number;
  resolutionMinutes: number;
}) {
  if (!input.name.trim()) throw new Error("שם המדיניות הוא שדה חובה.");
  const tier = (SLA_TIERS as readonly string[]).includes(input.tier ?? "")
    ? (input.tier as SlaTier)
    : "STANDARD";
  const responseMinutes = Math.max(1, Math.trunc(input.responseMinutes));
  const resolutionMinutes = Math.max(responseMinutes, Math.trunc(input.resolutionMinutes));

  return db.slaPolicy.upsert({
    where: { entityType_tier: { entityType: input.entityType.trim(), tier } },
    create: {
      name: input.name.trim(),
      entityType: input.entityType.trim(),
      tier,
      responseMinutes,
      resolutionMinutes,
    },
    update: { name: input.name.trim(), responseMinutes, resolutionMinutes },
  });
}

export async function listSlaPolicies() {
  const policies = await db.slaPolicy.findMany({
    orderBy: [{ entityType: "asc" }, { tier: "asc" }],
    select: {
      id: true,
      name: true,
      entityType: true,
      tier: true,
      responseMinutes: true,
      resolutionMinutes: true,
      isActive: true,
    },
  });
  return policies;
}

export async function getBusinessRulesSummary() {
  const [rules, activeRules, slaPolicies] = await Promise.all([
    db.businessRule.count(),
    db.businessRule.count({ where: { isActive: true } }),
    db.slaPolicy.count(),
  ]);
  return { rules, activeRules, slaPolicies };
}
