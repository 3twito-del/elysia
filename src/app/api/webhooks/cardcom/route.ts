import { NextResponse } from "next/server";

import { paymentProvider } from "~/server/adapters/payment";
import {
  parseWebhookJson,
  recordWebhookEvent,
} from "~/server/services/webhook-events";

export async function POST(req: Request) {
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

  return NextResponse.json({
    ok: true,
    provider: "cardcom",
    status: "RECEIVED",
    eventId: event.id,
  });
}
