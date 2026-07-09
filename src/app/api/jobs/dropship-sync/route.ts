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
import { syncShopifyDropshipCatalog } from "~/server/services/shopify-dropship-sync";

/**
 * ADR 0012 scheduled sync — the freshness baseline for dropship display
 * truth. The click-out verification remains the fail-closed guarantee; this
 * job only narrows drift windows. Runs as a Vercel cron (daily until owner
 * Fact B confirms sub-daily cron capability; the ADR target is every 6h with
 * a 12h freshness SLO). No-ops safely while SHOPIFY_DROPSHIP_SYNC_ENABLED is
 * off.
 */
export async function GET(req: Request) {
  return runDropshipSyncJob(req);
}

export async function POST(req: Request) {
  return runDropshipSyncJob(req);
}

async function runDropshipSyncJob(req: Request) {
  try {
    await assertRateLimit({
      key: `jobs:dropship-sync:${getRequestIp(req)}`,
      limit: 10,
      windowMs: 60_000,
    });
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      return rateLimitedJson(error, "Too many dropship sync requests.");
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
    const result = await syncShopifyDropshipCatalog({ first: 50 });

    return okJson({ result });
  } catch (error) {
    console.error("[jobs:dropship-sync:failed]", error);

    return serviceUnavailableJson("Dropship sync failed.");
  }
}
