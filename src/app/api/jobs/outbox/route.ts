import { env } from "~/env";
import {
  okJson,
  rateLimitedJson,
  serviceUnavailableJson,
  unauthorizedJson,
} from "~/server/http/api-response";
import {
  type ProcessOutboxResult,
  processDueOutboxEvents,
} from "~/server/services/jobs";
import {
  deliverDueAlertNotifications,
  sweepOperationalInvariants,
} from "~/server/services/operational-alerts";
import {
  assertRateLimit,
  getRequestIp,
  RateLimitExceededError,
} from "~/server/services/rate-limit";

export async function GET(req: Request) {
  return runOutboxJob(req);
}

export async function POST(req: Request) {
  return runOutboxJob(req);
}

async function runOutboxJob(req: Request) {
  try {
    await assertRateLimit({
      key: `jobs:outbox:${getRequestIp(req)}`,
      limit: 30,
      windowMs: 60_000,
    });
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      return rateLimitedJson(error, "Too many outbox job requests.");
    }

    throw error;
  }

  const auth = req.headers.get("authorization");
  const secret = env.JOB_RUNNER_SECRET ?? env.CRON_SECRET;
  const expected = secret ? `Bearer ${secret}` : null;

  if (env.NODE_ENV === "production" && !expected) {
    return serviceUnavailableJson(
      "JOB_RUNNER_SECRET is required in production.",
    );
  }

  if (expected && auth !== expected) {
    return unauthorizedJson("Unauthorized job runner.");
  }

  let result: Awaited<ReturnType<typeof processDueOutboxEvents>>;

  try {
    result = await processDueOutboxEvents({ limit: 25 });
  } catch (error) {
    console.error("[jobs:outbox:process-failed]", error);

    return serviceUnavailableJson("Outbox job processor is unavailable.");
  }

  // ADR 0007: the worker tick both processes due events and sweeps
  // class-aware business invariants. Sweep/delivery failures are logged and
  // retried on the next tick; they never mask detection or fail the tick.
  let alerts: { violations: number } | { error: string };

  try {
    alerts = await sweepOperationalInvariants();
    await deliverDueAlertNotifications();
  } catch (error) {
    console.error("[jobs:outbox:alert-sweep-failed]", error);
    alerts = { error: "sweep-failed" };
  }

  return okJson({
    ok: true,
    result,
    alerts,
    summary: createOutboxJobSummary(result),
  });
}

function createOutboxJobSummary(result: ProcessOutboxResult) {
  const status =
    result.failed > 0
      ? "retryable-failures"
      : result.skipped > 0
        ? "completed-with-skips"
        : "completed";

  return {
    completed: result.processed,
    failed: result.failed,
    retryable: result.failed,
    scanned: result.scanned,
    skipped: result.skipped,
    status,
  };
}
