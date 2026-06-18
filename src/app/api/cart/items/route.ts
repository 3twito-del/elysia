import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  badRequestJson,
  okJson,
  rateLimitedJson,
  serviceUnavailableJson,
} from "~/server/http/api-response";
import {
  assertRateLimit,
  getRequestIp,
  RateLimitExceededError,
} from "~/server/services/rate-limit";
import { addCartItem, addCartItemInputSchema } from "~/server/services/cart";
import { shouldUseFixtureCart } from "~/server/services/cart-fixtures";
import { scheduleCartReminder } from "~/server/services/push";

export async function POST(req: Request) {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return badRequestJson("Invalid cart item payload.");
  }

  const parsed = addCartItemInputSchema.safeParse(body);

  if (!parsed.success) {
    return badRequestJson(
      parsed.error.issues[0]?.message ?? "Invalid cart item payload.",
    );
  }

  try {
    await assertRateLimit({
      key: `cart-add:${getRequestIp(req)}`,
      limit: 40,
      windowMs: 60_000,
    });

    const cart = await addCartItem(parsed.data);

    if (!shouldUseFixtureCart()) {
      await scheduleCartReminder({
        sessionKey: parsed.data.sessionKey,
      }).catch(() => undefined);
    }

    return okJson({ itemCount: cart.itemCount, ok: true });
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      return rateLimitedJson(error, "Too many cart item requests.");
    }

    if (error instanceof z.ZodError) {
      return badRequestJson(
        error.issues[0]?.message ?? "Invalid cart item payload.",
      );
    }

    if (error instanceof TRPCError && error.code === "BAD_REQUEST") {
      return badRequestJson(error.message);
    }

    return serviceUnavailableJson(
      "Cart item updates are temporarily unavailable.",
    );
  }
}
