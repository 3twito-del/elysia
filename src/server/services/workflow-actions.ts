import { toDisplayString } from "~/lib/stringify";
import { createApprovalRequest } from "~/server/services/approvals";
import { getPath, type RuleContext } from "~/server/services/workflow-rules";

/**
 * Action model for the no-code Workflow platform (WFL, §4.P). A workflow's
 * `actions` is an array of `{ type, config }`. String config values support
 * `{{dotted.path}}` interpolation from the run context. Validation, description,
 * interpolation and planning are pure; only `executeActions` touches the DB.
 *
 * Safe-by-design: the only action with an external side effect is CREATE_APPROVAL
 * (raises an in-system ApprovalRequest, feeding SoD / WFL-003). NOTIFY / LOG /
 * WEBHOOK are recorded as run results without making outbound calls.
 */

export const ACTION_TYPES = [
  "CREATE_APPROVAL",
  "NOTIFY",
  "LOG",
  "WEBHOOK",
] as const;

export type ActionType = (typeof ACTION_TYPES)[number];

export type WorkflowAction = {
  type: string;
  config?: Record<string, unknown>;
};

export type ActionResult = {
  type: string;
  ok: boolean;
  detail: string;
  ref?: string;
};

const actionLabel: Record<string, string> = {
  CREATE_APPROVAL: "פתיחת בקשת אישור",
  NOTIFY: "שליחת התראה",
  LOG: "רישום ביומן",
  WEBHOOK: "קריאת Webhook",
};

/** Replaces `{{path}}` tokens in a template with context values. Pure. */
export function interpolateString(
  template: string,
  context: RuleContext,
): string {
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_match, path: string) => {
    const value = getPath(context, path);
    return toDisplayString(value);
  });
}

/** Interpolates every string value in a config object. Pure. */
export function interpolateConfig(
  config: Record<string, unknown> | undefined,
  context: RuleContext,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(config ?? {})) {
    out[key] =
      typeof value === "string" ? interpolateString(value, context) : value;
  }
  return out;
}

/** One-line Hebrew description of an action. Pure. */
export function describeAction(action: WorkflowAction): string {
  const label = actionLabel[action.type] ?? action.type;
  const config = action.config ?? {};
  if (action.type === "CREATE_APPROVAL") {
    return `${label}: ${toDisplayString(config.title)}`.trim();
  }
  if (action.type === "WEBHOOK") {
    return `${label}: ${toDisplayString(config.url)}`.trim();
  }
  if (action.type === "NOTIFY" || action.type === "LOG") {
    return `${label}: ${toDisplayString(config.message)}`.trim();
  }
  return label;
}

/** Validates an actions array, returning human errors. Pure. */
export function validateActions(actions: unknown): string[] {
  if (!Array.isArray(actions) || actions.length === 0) {
    return ["יש להגדיר לפחות פעולה אחת."];
  }

  const errors: string[] = [];
  actions.forEach((raw, index) => {
    const position = index + 1;
    if (!raw || typeof raw !== "object") {
      errors.push(`פעולה ${position}: מבנה לא תקין.`);
      return;
    }
    const action = raw as WorkflowAction;
    if (!(ACTION_TYPES as readonly string[]).includes(action.type)) {
      errors.push(`פעולה ${position}: סוג לא נתמך (${String(action.type)}).`);
      return;
    }
    const config = action.config ?? {};
    if (action.type === "CREATE_APPROVAL" && !asNonEmpty(config.title)) {
      errors.push(`פעולה ${position}: בקשת אישור דורשת כותרת.`);
    }
    if (
      (action.type === "NOTIFY" || action.type === "LOG") &&
      !asNonEmpty(config.message)
    ) {
      errors.push(`פעולה ${position}: דרושה הודעה.`);
    }
    if (action.type === "WEBHOOK" && !asNonEmpty(config.url)) {
      errors.push(`פעולה ${position}: Webhook דורש כתובת.`);
    }
  });
  return errors;
}

function asNonEmpty(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

/** Normalises + interpolates actions against a context for preview/run. Pure. */
export function planActions(
  actions: WorkflowAction[],
  context: RuleContext,
): Array<{ type: string; config: Record<string, unknown>; description: string }> {
  return actions.map((action) => {
    const config = interpolateConfig(action.config, context);
    return {
      type: action.type,
      config,
      description: describeAction({ type: action.type, config }),
    };
  });
}

function toNumberOrUndefined(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

async function executeAction(
  action: WorkflowAction,
  context: RuleContext,
): Promise<ActionResult> {
  const config = interpolateConfig(action.config, context);

  switch (action.type) {
    case "CREATE_APPROVAL": {
      const approval = await createApprovalRequest({
        title: toDisplayString(config.title) || "בקשה אוטומטית",
        amount: toNumberOrUndefined(config.amount),
        notes: config.notes ? toDisplayString(config.notes) : undefined,
        entityType: config.entityType ? toDisplayString(config.entityType) : "workflow",
        entityId: config.entityId ? toDisplayString(config.entityId) : undefined,
      });
      return {
        type: action.type,
        ok: true,
        detail: `נוצרה בקשת אישור ${approval.requestNumber}`,
        ref: approval.id,
      };
    }
    case "NOTIFY":
      return {
        type: action.type,
        ok: true,
        detail: `התראה: ${toDisplayString(config.message)}`,
      };
    case "LOG":
      return {
        type: action.type,
        ok: true,
        detail: toDisplayString(config.message),
      };
    case "WEBHOOK":
      return {
        type: action.type,
        ok: true,
        detail: `Webhook (מתועד): ${toDisplayString(config.url)}`,
      };
    default:
      return {
        type: action.type,
        ok: false,
        detail: `סוג פעולה לא ידוע: ${action.type}`,
      };
  }
}

/** Runs every action, capturing per-action success/failure. */
export async function executeActions(
  actions: WorkflowAction[],
  context: RuleContext,
): Promise<ActionResult[]> {
  const results: ActionResult[] = [];
  for (const action of actions) {
    try {
      results.push(await executeAction(action, context));
    } catch (error) {
      results.push({
        type: action.type,
        ok: false,
        detail: error instanceof Error ? error.message : "פעולה נכשלה.",
      });
    }
  }
  return results;
}
