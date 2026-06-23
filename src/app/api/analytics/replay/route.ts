import {
  badRequestJson,
  okJson,
  payloadTooLargeJson,
  rateLimitedJson,
} from "~/server/http/api-response";
import { readSafeJson } from "~/server/http/safe-json";
import {
  analyticsReplayChunkInputSchema,
  recordAnalyticsReplayChunk,
} from "~/server/services/analytics-replay";
import {
  assertRateLimit,
  getRequestIp,
  RateLimitExceededError,
} from "~/server/services/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    await assertRateLimit({
      key: `analytics-replay:${getRequestIp(req)}`,
      limit: 60,
      windowMs: 60_000,
    });
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      return rateLimitedJson(error, "Too many analytics replay chunks.");
    }

    throw error;
  }

  const json = await readSafeJson(req, { maxBytes: 256 * 1024 });

  if (!json.ok) {
    if (json.error === "too-large") {
      return payloadTooLargeJson("Analytics replay chunk is too large.");
    }

    return badRequestJson("Invalid analytics replay payload.");
  }

  const parsed = analyticsReplayChunkInputSchema.safeParse(json.data);

  if (!parsed.success) {
    return badRequestJson("Invalid analytics replay payload.");
  }

  const result = await recordAnalyticsReplayChunk(parsed.data);

  if (result.status === "rejected") {
    return badRequestJson(`Replay chunk rejected: ${result.reason}.`);
  }

  return okJson({
    ok: true,
    result,
  });
}
