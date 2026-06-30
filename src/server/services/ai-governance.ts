import { db } from "~/server/db";

/**
 * AI governance & guardrails (AI-005, §4.L). Enforces the owner's standing rule
 * (decision D5): AI may *recommend* anywhere and *act with human approval*, but
 * may NEVER act autonomously on the financial books. The guardrail + audit
 * roll-up are pure and unit-tested; the overview reads the existing AiRun audit.
 */

export const AI_AUTONOMY_LEVELS = ["RECOMMEND", "APPROVE", "AUTONOMOUS"] as const;
export type AiAutonomy = (typeof AI_AUTONOMY_LEVELS)[number];

/** Domains that touch the books — autonomous AI action is forbidden here. */
export const BOOKS_DOMAINS = new Set<string>([
  "finance",
  "ledger",
  "gl",
  "invoices",
  "ar",
  "ap",
  "payments",
  "tax",
  "payroll",
  "assets",
  "entities",
]);

export class AiGuardrailError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiGuardrailError";
  }
}

/** The highest autonomy AI may use in a domain. Books cap at APPROVE. Pure. */
export function maxAutonomyFor(domain: string): AiAutonomy {
  return BOOKS_DOMAINS.has(domain) ? "APPROVE" : "AUTONOMOUS";
}

/** Whether AI may operate at a requested mode in a domain. Pure. */
export function isModeAllowed(domain: string, mode: AiAutonomy): boolean {
  if (mode === "AUTONOMOUS") return !BOOKS_DOMAINS.has(domain);
  return true;
}

/**
 * Guard a would-be AI action. Throws AiGuardrailError if it would act
 * autonomously on the books. Call this before any AI-initiated mutation.
 */
export function assertAiActionAllowed(input: {
  domain: string;
  mode: AiAutonomy;
}): void {
  if (!isModeAllowed(input.domain, input.mode)) {
    throw new AiGuardrailError(
      `פעולה אוטונומית של AI אסורה בתחום הפיננסי (${input.domain}); נדרש אישור אנושי.`,
    );
  }
}

/** The guardrail matrix for the governance UI. Pure. */
export function describeGuardrails() {
  return [...BOOKS_DOMAINS]
    .map((domain) => ({ domain, maxAutonomy: maxAutonomyFor(domain) }))
    .concat([{ domain: "operational (other)", maxAutonomy: "AUTONOMOUS" }]);
}

export type AiRunSummaryRow = { status: string; durationMs: number | null };

/** Counts + success rate + average duration over AI runs. Pure. */
export function summarizeAiRuns(runs: AiRunSummaryRow[]) {
  let succeeded = 0;
  let failed = 0;
  let running = 0;
  let durationSum = 0;
  let durationCount = 0;

  for (const run of runs) {
    if (run.status === "SUCCEEDED") succeeded += 1;
    else if (run.status === "FAILED") failed += 1;
    else running += 1;
    if (typeof run.durationMs === "number") {
      durationSum += run.durationMs;
      durationCount += 1;
    }
  }

  const completed = succeeded + failed;
  return {
    total: runs.length,
    succeeded,
    failed,
    running,
    successRate: completed > 0 ? Math.round((succeeded / completed) * 100) : 0,
    avgDurationMs: durationCount > 0 ? Math.round(durationSum / durationCount) : 0,
  };
}

/** Read-only AI governance overview from the AiRun audit log. */
export async function getAiGovernanceOverview() {
  const [runs, recent, toolCalls, modelGroups] = await Promise.all([
    db.aiRun.findMany({ select: { status: true, durationMs: true } }),
    db.aiRun.findMany({
      orderBy: { startedAt: "desc" },
      take: 15,
      select: {
        id: true,
        kind: true,
        status: true,
        model: true,
        durationMs: true,
        startedAt: true,
      },
    }),
    db.aiToolCall.count(),
    db.aiRun.groupBy({ by: ["model"], _count: true }),
  ]);

  return {
    summary: summarizeAiRuns(runs),
    toolCalls,
    models: modelGroups.map((group) => ({
      model: group.model,
      runs: group._count,
    })),
    recent: recent.map((run) => ({
      id: run.id,
      kind: run.kind,
      status: run.status,
      model: run.model,
      durationMs: run.durationMs,
      startedAt: run.startedAt,
    })),
  };
}
