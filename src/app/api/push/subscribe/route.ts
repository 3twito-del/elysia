import { z } from "zod";

import { auth } from "~/server/auth";
import { db } from "~/server/db";
import {
  badRequestJson,
  okJson,
  serviceUnavailableJson,
} from "~/server/http/api-response";
import {
  getVapidPublicKey,
  isPushConfigured,
  upsertPushSubscription,
} from "~/server/services/push";

const subscribeSchema = z.object({
  deviceId: z.string().trim().min(8).max(128).optional(),
  marketingOptIn: z.boolean().default(false),
  productSlug: z.string().trim().min(1).max(120).optional(),
  sessionKey: z.string().trim().min(16).max(128).optional(),
  subscription: z.object({
    endpoint: z.string().url().max(2048),
    keys: z.object({
      auth: z.string().trim().min(8).max(512),
      p256dh: z.string().trim().min(8).max(512),
    }),
  }),
  transactionalOptIn: z.boolean().default(true),
});

export async function POST(req: Request) {
  if (!isPushConfigured() || !getVapidPublicKey()) {
    return serviceUnavailableJson("Push notifications are not configured.");
  }

  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return badRequestJson("Invalid push subscription payload.");
  }

  const parsed = subscribeSchema.safeParse(body);

  if (!parsed.success) {
    return badRequestJson(
      parsed.error.issues[0]?.message ?? "Invalid push subscription payload.",
    );
  }

  const session = await auth();
  const customer =
    session?.user?.id && !session.user.adminUserId
      ? await db.customer.findUnique({
          where: { userId: session.user.id },
          select: { id: true },
        })
      : null;
  const subscription = await upsertPushSubscription({
    auth: parsed.data.subscription.keys.auth,
    customerId: customer?.id,
    deviceId: parsed.data.deviceId,
    endpoint: parsed.data.subscription.endpoint,
    marketingOptIn: parsed.data.marketingOptIn,
    p256dh: parsed.data.subscription.keys.p256dh,
    productSlug: parsed.data.productSlug,
    sessionKey: parsed.data.sessionKey,
    transactionalOptIn: parsed.data.transactionalOptIn,
    userAgent: req.headers.get("user-agent") ?? undefined,
  });

  return okJson({
    ok: true,
    subscriptionId: subscription.id,
  });
}
