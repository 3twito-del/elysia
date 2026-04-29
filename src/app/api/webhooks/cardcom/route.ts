import { NextResponse } from "next/server";

import { paymentProvider } from "~/server/adapters/payment";
import {
  parseWebhookJson,
  recordWebhookEvent,
} from "~/server/services/webhook-events";
import { applyCardComWebhook } from "~/server/services/payment-webhooks";
import {
  assertRateLimit,
  getRequestIp,
  RateLimitExceededError,
} from "~/server/services/rate-limit";

export async function POST(req: Request) {
  try {
    await assertRateLimit({
      key: `webhook:cardcom:${getRequestIp(req)}`,
      limit: 120,
      windowMs: 60_000,
    });
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      return NextResponse.json(
        { ok: false, error: "Too many webhook requests." },
        {
          status: 429,
          headers: { "Retry-After": String(error.retryAfterSeconds) },
        },
      );
    }

    throw error;
  }

  const rawBody = await req.text();
  const payload = parseWebhookJson(rawBody);
  const signature = req.headers.get("x-cardcom-signature") ?? undefined;
  const verified = await paymentProvider.verifyWebhook(payload, signature);

  if (!verified) {
    await recordWebhookEvent({
      provider: "cardcom",
      rawBody,
      payload,
      status: "FAILED",
      fallbackEventType: "cardcom.unverified",
    }).catch((error: unknown) => {
      console.error("[webhook:cardcom:record-failed]", error);
    });

    return NextResponse.json(
      { ok: false, error: "Invalid signature" },
      { status: 401 },
    );
  }

  const event = await recordWebhookEvent({
    provider: "cardcom",
    rawBody,
    payload,
    status: "RECEIVED",
    fallbackEventType: "cardcom.webhook",
  });
  const paymentResult = await applyCardComWebhook(payload);

  return NextResponse.json({
    ok: true,
    provider: "cardcom",
    status: "RECEIVED",
    eventId: event.id,
    payment: paymentResult,
  });
}
