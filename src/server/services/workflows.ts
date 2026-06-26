import { Prisma } from "@prisma/client";

import { db } from "~/server/db";
import {
  executeActions,
  validateActions,
  type WorkflowAction,
} from "~/server/services/workflow-actions";
import {
  describeCondition,
  evaluateCondition,
  validateRule,
  type RuleContext,
} from "~/server/services/workflow-rules";

/**
 * Workflow engine (WFL-001/004): no-code automations of trigger → condition →
 * actions. Definitions are validated up front; runs are idempotent (unique
 * dedupeKey) so the same event never fires actions twice. `dispatchEvent` is the
 * entry point for event-driven automation over OutboxEvent-style events.
 */

export const TRIGGER_TYPES = ["MANUAL", "EVENT", "SCHEDULE"] as const;
export type TriggerType = (typeof TRIGGER_TYPES)[number];

function normalizeTrigger(value: string | undefined): TriggerType {
  return value && (TRIGGER_TYPES as readonly string[]).includes(value)
    ? (value as TriggerType)
    : "MANUAL";
}

function parseActions(value: Prisma.JsonValue | null | undefined): WorkflowAction[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (action) => !!action && typeof action === "object" && !Array.isArray(action),
  ) as unknown as WorkflowAction[];
}

const asJson = (value: unknown) => value as Prisma.InputJsonValue;

/** Whether a definition should fire for a given event name. Pure. */
export function matchesEvent(
  definition: {
    isActive: boolean;
    triggerType: string;
    triggerEvent: string | null;
  },
  event: string,
): boolean {
  return (
    definition.isActive &&
    definition.triggerType === "EVENT" &&
    definition.triggerEvent === event
  );
}

/** Creates and validates a workflow definition. */
export async function createWorkflow(input: {
  name: string;
  description?: string;
  triggerType?: string;
  triggerEvent?: string;
  scheduleCron?: string;
  conditionRule?: unknown;
  actions: WorkflowAction[];
}) {
  if (!input.name.trim()) throw new Error("שם התהליך הוא שדה חובה.");

  const triggerType = normalizeTrigger(input.triggerType);
  if (triggerType === "EVENT" && !input.triggerEvent?.trim()) {
    throw new Error("טריגר אירוע מחייב שם אירוע.");
  }
  if (triggerType === "SCHEDULE" && !input.scheduleCron?.trim()) {
    throw new Error("טריגר מתוזמן מחייב הגדרת cron.");
  }

  const ruleErrors = validateRule(input.conditionRule ?? null);
  if (ruleErrors.length > 0) throw new Error(ruleErrors.join(" "));

  const actionErrors = validateActions(input.actions);
  if (actionErrors.length > 0) throw new Error(actionErrors.join(" "));

  return db.workflowDefinition.create({
    data: {
      name: input.name.trim(),
      description: input.description,
      triggerType,
      triggerEvent:
        triggerType === "EVENT" ? input.triggerEvent?.trim() : undefined,
      scheduleCron:
        triggerType === "SCHEDULE" ? input.scheduleCron?.trim() : undefined,
      ...(input.conditionRule != null
        ? { conditionRule: asJson(input.conditionRule) }
        : {}),
      actions: asJson(input.actions),
    },
  });
}

/** Enables or disables a workflow. */
export async function setWorkflowActive(input: {
  workflowId: string;
  isActive: boolean;
}) {
  return db.workflowDefinition.update({
    where: { id: input.workflowId },
    data: { isActive: input.isActive },
  });
}

/** Deletes a workflow and its run history. */
export async function deleteWorkflow(input: { workflowId: string }) {
  return db.workflowDefinition.delete({ where: { id: input.workflowId } });
}

/**
 * Runs a single workflow against a context. Idempotent: a repeated dedupeKey
 * returns the existing run without re-firing actions. Records a WorkflowRun and,
 * when matched, advances runCount.
 */
export async function runWorkflow(input: {
  workflowId: string;
  context?: RuleContext;
  dedupeKey?: string;
}) {
  if (input.dedupeKey) {
    const existing = await db.workflowRun.findUnique({
      where: { dedupeKey: input.dedupeKey },
    });
    if (existing) return existing;
  }

  const definition = await db.workflowDefinition.findUnique({
    where: { id: input.workflowId },
  });
  if (!definition) throw new Error("תהליך לא נמצא.");

  const context = input.context ?? {};
  const matched = evaluateCondition(definition.conditionRule, context);

  if (!matched) {
    return createRun({
      workflowId: definition.id,
      status: "SKIPPED",
      context,
      dedupeKey: input.dedupeKey,
    });
  }

  const results = await executeActions(parseActions(definition.actions), context);
  const status = results.some((result) => !result.ok) ? "FAILED" : "MATCHED";

  const run = await createRun({
    workflowId: definition.id,
    status,
    context,
    actionResults: results,
    dedupeKey: input.dedupeKey,
    error: status === "FAILED" ? "פעולה אחת או יותר נכשלה." : undefined,
  });

  await db.workflowDefinition.update({
    where: { id: definition.id },
    data: { runCount: { increment: 1 } },
  });

  return run;
}

async function createRun(input: {
  workflowId: string;
  status: string;
  context: RuleContext;
  actionResults?: unknown;
  dedupeKey?: string;
  error?: string;
}) {
  try {
    return await db.workflowRun.create({
      data: {
        workflowId: input.workflowId,
        status: input.status,
        dedupeKey: input.dedupeKey,
        context: asJson(input.context),
        ...(input.actionResults != null
          ? { actionResults: asJson(input.actionResults) }
          : {}),
        error: input.error,
      },
    });
  } catch (error) {
    // Concurrent run with the same dedupeKey — return the winner.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002" &&
      input.dedupeKey
    ) {
      const existing = await db.workflowRun.findUnique({
        where: { dedupeKey: input.dedupeKey },
      });
      if (existing) return existing;
    }
    throw error;
  }
}

/**
 * Fires every active EVENT workflow registered for an event name. Each run is
 * deduped per-workflow so re-delivering the same event is safe (WFL-004).
 */
export async function dispatchEvent(input: {
  event: string;
  context?: RuleContext;
  dedupeKey?: string;
}) {
  const definitions = await db.workflowDefinition.findMany({
    where: {
      isActive: true,
      triggerType: "EVENT",
      triggerEvent: input.event,
    },
    select: { id: true },
  });

  const runs = [];
  for (const definition of definitions) {
    runs.push(
      await runWorkflow({
        workflowId: definition.id,
        context: input.context,
        dedupeKey: input.dedupeKey
          ? `${input.dedupeKey}:${definition.id}`
          : undefined,
      }),
    );
  }

  return {
    event: input.event,
    matched: runs.filter((run) => run.status === "MATCHED").length,
    total: runs.length,
  };
}

/** Recent workflows with run counts and a condition summary. */
export async function listWorkflows(limit = 20) {
  const workflows = await db.workflowDefinition.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      name: true,
      triggerType: true,
      triggerEvent: true,
      conditionRule: true,
      actions: true,
      isActive: true,
      runCount: true,
    },
  });

  return workflows.map((workflow) => ({
    id: workflow.id,
    name: workflow.name,
    triggerType: workflow.triggerType,
    triggerEvent: workflow.triggerEvent,
    condition: describeCondition(workflow.conditionRule),
    actionCount: parseActions(workflow.actions).length,
    isActive: workflow.isActive,
    runCount: workflow.runCount,
  }));
}

/** Recent runs across (or within) workflows. */
export async function listWorkflowRuns(input: { workflowId?: string; limit?: number } = {}) {
  const runs = await db.workflowRun.findMany({
    where: input.workflowId ? { workflowId: input.workflowId } : {},
    orderBy: { createdAt: "desc" },
    take: input.limit ?? 20,
    select: {
      id: true,
      status: true,
      createdAt: true,
      workflow: { select: { name: true } },
    },
  });

  return runs.map((run) => ({
    id: run.id,
    status: run.status,
    createdAt: run.createdAt,
    workflowName: run.workflow.name,
  }));
}

export async function getWorkflowSummary() {
  const [total, active, matchedRuns, totalRuns] = await Promise.all([
    db.workflowDefinition.count(),
    db.workflowDefinition.count({ where: { isActive: true } }),
    db.workflowRun.count({ where: { status: "MATCHED" } }),
    db.workflowRun.count(),
  ]);

  return { total, active, matchedRuns, totalRuns };
}
