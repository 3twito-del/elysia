import { z } from "zod";

import {
  badRequestJson,
  notFoundJson,
  okJson,
  payloadTooLargeJson,
  rateLimitedJson,
} from "~/server/http/api-response";
import { readSafeJson } from "~/server/http/safe-json";
import {
  assertRateLimit,
  getRequestIp,
  RateLimitExceededError,
} from "~/server/services/rate-limit";
import { recordProductClickEvent } from "~/server/services/product-events";

const productClickEventSchema = z.object({
  productSlug: z.string().trim().min(1),
  query: z.string().trim().max(250).optional(),
  position: z.number().int().nonnegative().optional(),
  sessionKey: z.string().trim().min(16).max(128).optional(),
});

export async function POST(req: Request) {
  try {
    await assertRateLimit({
      key: `product-click:${getRequestIp(req)}`,
      limit: 120,
      windowMs: 60_000,
    });
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      return rateLimitedJson(error, "Too many analytics events.");
    }

    throw error;
  }

  const json = await readSafeJson(req);

  if (!json.ok) {
    if (json.error === "too-large") {
      return payloadTooLargeJson("Analytics event body is too large.");
    }

    return badRequestJson();
  }

  const parsed = productClickEventSchema.safeParse(json.data);

  if (!parsed.success) {
    return badRequestJson();
  }

  const recorded = await recordProductClickEvent(parsed.data);

  if (!recorded) return notFoundJson();

  return okJson({ ok: true });
}
