import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "~/server/db";
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
      return NextResponse.json(
        { ok: false, error: "Too many analytics events." },
        {
          status: 429,
          headers: { "Retry-After": String(error.retryAfterSeconds) },
        },
      );
    }

    throw error;
  }

  const json = await readSafeJson(req);

  if (!json.ok) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const parsed = productViewEventSchema.safeParse(json.data);

  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const product = await db.product.findUnique({
    where: { slug: parsed.data.productSlug },
    select: { id: true },
  });

  if (!product) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  await db.productViewEvent.create({
    data: {
      productId: product.id,
      sessionKey: parsed.data.sessionKey,
      customerId: parsed.data.customerId,
      path: parsed.data.path,
    },
  });

  return NextResponse.json({ ok: true });
}
