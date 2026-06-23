import { z } from "zod";

import {
  badRequestJson,
  okJson,
  payloadTooLargeJson,
  rateLimitedJson,
  serviceUnavailableJson,
} from "~/server/http/api-response";
import { readSafeJson } from "~/server/http/safe-json";
import {
  analyticsBatchInputSchema,
  analyticsEventInputSchema,
  recordAnalyticsEvents,
} from "~/server/services/analytics";
import {
  assertRateLimit,
  getRequestIp,
  RateLimitExceededError,
} from "~/server/services/rate-limit";

const analyticsRequestSchema = z.union([
  analyticsBatchInputSchema,
  analyticsEventInputSchema.transform((event) => ({ events: [event] })),
]);

export async function POST(req: Request) {
  const start = Date.now();
  const route = "/api/analytics/events";
  const requestId = req.headers.get("x-vercel-id");

  console.log(
    JSON.stringify({ level: "info", msg: "start", route, requestId }),
  );

  try {
    await assertRateLimit({
      key: `analytics-events:${getRequestIp(req)}`,
      limit: 180,
      windowMs: 60_000,
    });
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      console.log(
        JSON.stringify({
          level: "warn",
          msg: "rate_limited",
          route,
          ms: Date.now() - start,
        }),
      );

      return rateLimitedJson(error, "Too many analytics events.");
    }

    throw error;
  }

  const json = await readSafeJson(req, { maxBytes: 64 * 1024 });

  if (!json.ok) {
    console.log(
      JSON.stringify({
        level: "warn",
        msg: "invalid_body",
        route,
        reason: json.error,
        ms: Date.now() - start,
      }),
    );

    if (json.error === "too-large") {
      return payloadTooLargeJson("Analytics batch body is too large.");
    }

    return badRequestJson();
  }

  const parsed = analyticsRequestSchema.safeParse(json.data);

  if (!parsed.success) {
    return badRequestJson("Invalid analytics event payload.");
  }

  try {
    const result = await recordAnalyticsEvents(parsed.data.events);

    console.log(
      JSON.stringify({
        level: "info",
        msg: "done",
        route,
        accepted: result.accepted,
        skipped: result.skipped,
        duplicates: result.duplicates,
        ms: Date.now() - start,
      }),
    );

    return okJson({ ok: true, ...result });
  } catch (error) {
    console.error(
      JSON.stringify({
        level: "error",
        msg: "failed",
        route,
        error: error instanceof Error ? error.message : String(error),
        ms: Date.now() - start,
      }),
    );

    return serviceUnavailableJson("Analytics ingestion failed.");
  }
}
