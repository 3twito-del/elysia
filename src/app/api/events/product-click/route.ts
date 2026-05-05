import { z } from "zod";

import { db } from "~/server/db";
import {
  badRequestJson,
  notFoundJson,
  okJson,
  rateLimitedJson,
} from "~/server/http/api-response";
import { readSafeJson } from "~/server/http/safe-json";
import {
  assertRateLimit,
  getRequestIp,
  RateLimitExceededError,
} from "~/server/services/rate-limit";

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
    return badRequestJson();
  }

  const parsed = productClickEventSchema.safeParse(json.data);

  if (!parsed.success) {
    return badRequestJson();
  }

  const product = await db.product.findUnique({
    where: { slug: parsed.data.productSlug },
    select: { id: true },
  });

  if (!product) {
    return notFoundJson();
  }

  await db.productClickEvent.create({
    data: {
      productId: product.id,
      query: parsed.data.query,
      position: parsed.data.position,
      sessionKey: parsed.data.sessionKey,
    },
  });

  return okJson({ ok: true });
}
