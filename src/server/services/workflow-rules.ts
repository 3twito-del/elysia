/**
 * Generic rule engine for the no-code Workflow/BPM platform (WFL, §4.P).
 *
 * A rule is a recursive JSON tree of `{ all: [...] }`, `{ any: [...] }`,
 * `{ not: {...} }` or a leaf `{ field, op, value }`. `field` is a dotted path
 * into an arbitrary evaluation context. Everything here is pure and unit-tested;
 * the same evaluator powers workflow conditions and (later) business rules.
 */

import { toDisplayString } from "~/lib/stringify";

export type RuleContext = Record<string, unknown>;

export const RULE_OPERATORS = [
  "eq",
  "neq",
  "gt",
  "gte",
  "lt",
  "lte",
  "contains",
  "in",
  "exists",
  "truthy",
  "falsy",
] as const;

export type RuleOperator = (typeof RULE_OPERATORS)[number];

/** Operators that don't need a `value`. */
const UNARY_OPERATORS = new Set<string>(["exists", "truthy", "falsy"]);

const operatorLabel: Record<string, string> = {
  eq: "שווה ל",
  neq: "שונה מ",
  gt: "גדול מ",
  gte: "גדול או שווה ל",
  lt: "קטן מ",
  lte: "קטן או שווה ל",
  contains: "מכיל",
  in: "אחד מ",
  exists: "קיים",
  truthy: "אמת",
  falsy: "שקר",
};

/** Reads a dotted path (`order.total`) out of a context object. Pure. */
export function getPath(context: RuleContext, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc != null && typeof acc === "object") {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, context);
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function evaluateLeaf(
  field: string,
  op: string,
  value: unknown,
  context: RuleContext,
): boolean {
  const actual = getPath(context, field);

  switch (op) {
    case "eq":
      return actual === value;
    case "neq":
      return actual !== value;
    case "exists":
      return actual !== undefined && actual !== null;
    case "truthy":
      return Boolean(actual);
    case "falsy":
      return !actual;
    case "contains":
      if (typeof actual === "string") return actual.includes(String(value));
      if (Array.isArray(actual)) return actual.includes(value);
      return false;
    case "in":
      return Array.isArray(value) && value.includes(actual);
    case "gt":
    case "gte":
    case "lt":
    case "lte": {
      const a = toNumber(actual);
      const b = toNumber(value);
      if (a === null || b === null) return false;
      if (op === "gt") return a > b;
      if (op === "gte") return a >= b;
      if (op === "lt") return a < b;
      return a <= b;
    }
    default:
      return false;
  }
}

/**
 * Evaluates a rule tree against a context. A null/empty rule means "no
 * condition" and evaluates to true (so a workflow with no condition always
 * runs). An unrecognised leaf evaluates to false.
 */
export function evaluateCondition(
  rule: unknown,
  context: RuleContext,
): boolean {
  if (rule == null) return true;
  if (typeof rule !== "object") return false;
  const node = rule as Record<string, unknown>;

  if (Array.isArray(node.all)) {
    return node.all.every((sub) => evaluateCondition(sub, context));
  }
  if (Array.isArray(node.any)) {
    return node.any.some((sub) => evaluateCondition(sub, context));
  }
  if ("not" in node) {
    return !evaluateCondition(node.not, context);
  }
  if (typeof node.field === "string" && typeof node.op === "string") {
    return evaluateLeaf(node.field, node.op, node.value, context);
  }

  // An object with no recognised keys imposes no constraint.
  return true;
}

/** Human-readable Hebrew description of a rule tree. Pure. */
export function describeCondition(rule: unknown): string {
  if (rule == null) return "תמיד";
  if (typeof rule !== "object") return "—";
  const node = rule as Record<string, unknown>;

  if (Array.isArray(node.all)) {
    if (node.all.length === 0) return "תמיד";
    return node.all.map((sub) => describeCondition(sub)).join(" וגם ");
  }
  if (Array.isArray(node.any)) {
    if (node.any.length === 0) return "אף פעם";
    return `(${node.any.map((sub) => describeCondition(sub)).join(" או ")})`;
  }
  if ("not" in node) {
    return `לא (${describeCondition(node.not)})`;
  }
  if (typeof node.field === "string" && typeof node.op === "string") {
    const label = operatorLabel[node.op] ?? node.op;
    if (UNARY_OPERATORS.has(node.op)) return `${node.field} ${label}`;
    return `${node.field} ${label} ${formatValue(node.value)}`;
  }

  return "תמיד";
}

function formatValue(value: unknown): string {
  if (Array.isArray(value)) return value.map((v) => toDisplayString(v)).join("/");
  if (value === null || value === undefined) return "—";
  return toDisplayString(value);
}

/** Validates a rule tree, returning a list of human errors. Pure. */
export function validateRule(rule: unknown, depth = 0): string[] {
  if (rule == null) return [];
  if (depth > 10) return ["חוק מקונן עמוק מדי."];
  if (typeof rule !== "object") return ["חוק חייב להיות אובייקט."];
  const node = rule as Record<string, unknown>;

  if (Array.isArray(node.all) || Array.isArray(node.any)) {
    const branch = (node.all ?? node.any) as unknown[];
    return branch.flatMap((sub) => validateRule(sub, depth + 1));
  }
  if ("not" in node) {
    return validateRule(node.not, depth + 1);
  }
  if ("field" in node || "op" in node) {
    const errors: string[] = [];
    if (typeof node.field !== "string" || node.field.trim() === "") {
      errors.push("חסר שדה (field) בתנאי.");
    }
    if (
      typeof node.op !== "string" ||
      !(RULE_OPERATORS as readonly string[]).includes(node.op)
    ) {
      errors.push(`אופרטור לא נתמך: ${String(node.op)}.`);
    } else if (!UNARY_OPERATORS.has(node.op) && !("value" in node)) {
      errors.push(`אופרטור ${node.op} דורש ערך.`);
    }
    return errors;
  }

  return ["מבנה תנאי לא מזוהה."];
}
