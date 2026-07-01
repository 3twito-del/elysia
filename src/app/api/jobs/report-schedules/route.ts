import { env } from "~/env";
import {
  okJson,
  rateLimitedJson,
  serviceUnavailableJson,
  unauthorizedJson,
} from "~/server/http/api-response";
import {
  assertRateLimit,
  getRequestIp,
  RateLimitExceededError,
} from "~/server/services/rate-limit";
import { runDueReportSchedules } from "~/server/services/report-schedules";

export async function GET(req: Request) {
  return runJob(req);
}

export async function POST(req: Request) {
  return runJob(req);
}

/** Runs due scheduled reports, capturing CSV snapshots. Cron/job-runner gated. */
async function runJob(req: Request) {
  try {
    await assertRateLimit({
      key: `jobs:report-schedules:${getRequestIp(req)}`,
      limit: 30,
      windowMs: 60_000,
    });
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      return rateLimitedJson(error, "Too many report-schedule job requests.");
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

  try {
    const result = await runDueReportSchedules({ limit: 25 });
    return okJson({ ok: true, result });
  } catch (error) {
    console.error("[jobs:report-schedules:failed]", error);
    return serviceUnavailableJson("Report-schedules job processor is unavailable.");
  }
}
