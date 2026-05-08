import { z } from "zod";

import { okJson } from "~/server/http/api-response";
import {
  assertRateLimit,
  getRequestIp,
  RateLimitExceededError,
} from "~/server/services/rate-limit";
import { getCartBySession } from "~/server/services/cart";

const cartCountQuerySchema = z.object({
  sessionKey: z.string().trim().min(16).max(128).optional(),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = cartCountQuerySchema.safeParse({
    sessionKey: url.searchParams.get("sessionKey") ?? undefined,
  });

  if (!parsed.success || !parsed.data.sessionKey) {
    return okJson({ itemCount: 0 });
  }

  try {
    await assertRateLimit({
      key: `cart-count:${getRequestIp(req)}`,
      limit: 120,
      windowMs: 60_000,
    });

    const cart = await getCartBySession(parsed.data.sessionKey);

    return okJson({ itemCount: cart?.itemCount ?? 0 });
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      return okJson({ itemCount: 0 }, { status: 429 });
    }

    return okJson({ itemCount: 0 }, { status: 400 });
  }
}
