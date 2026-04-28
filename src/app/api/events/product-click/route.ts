import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "~/server/db";
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
    assertRateLimit({
      key: `product-click:${getRequestIp(req)}`,
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

  const parsed = productClickEventSchema.safeParse(await req.json());

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

  await db.productClickEvent.create({
    data: {
      productId: product.id,
      query: parsed.data.query,
      position: parsed.data.position,
      sessionKey: parsed.data.sessionKey,
    },
  });

  return NextResponse.json({ ok: true });
}
