import { NextResponse } from "next/server";

import {
  parseWebhookJson,
  recordWebhookEvent,
} from "~/server/services/webhook-events";

export async function POST(req: Request) {
  const rawBody = await req.text();
  const payload = parseWebhookJson(rawBody);
  const event = await recordWebhookEvent({
    provider: "cloudinary",
    rawBody,
    payload,
    status: "RECEIVED",
    fallbackEventType: "cloudinary.webhook",
  });

  return NextResponse.json({
    ok: true,
    provider: "cloudinary",
    status: "RECEIVED",
    eventId: event.id,
  });
}
