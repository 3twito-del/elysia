import { env } from "~/env";
import {
  okJson,
  rateLimitedJson,
  serviceUnavailableJson,
  unauthorizedJson,
} from "~/server/http/api-response";
import { processDueOutboxEvents } from "~/server/services/jobs";
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

  const result = await processDueOutboxEvents({ limit: 25 });

  return okJson({ ok: true, result });
}
