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

const productViewEventSchema = z.object({
  productSlug: z.string().trim().min(1),
  sessionKey: z.string().trim().min(16).max(128).optional(),
  customerId: z.string().trim().min(1).optional(),
  path: z.string().trim().max(512).optional(),
});

export async function POST(req: Request) {
  try {
    await assertRateLimit({
      key: `product-view:${getRequestIp(req)}`,
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

  const parsed = productViewEventSchema.safeParse(json.data);

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

  await db.productViewEvent.create({
    data: {
      productId: product.id,
      sessionKey: parsed.data.sessionKey,
      customerId: parsed.data.customerId,
      path: parsed.data.path,
    },
  });

  return okJson({ ok: true });
}
