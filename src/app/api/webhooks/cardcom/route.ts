import { paymentProvider } from "~/server/adapters/payment";
import {
  okJson,
  rateLimitedJson,
  unauthorizedJson,
} from "~/server/http/api-response";
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
      return rateLimitedJson(error, "Too many webhook requests.");
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

    return unauthorizedJson("Invalid signature.");
  }

  const event = await recordWebhookEvent({
    provider: "cardcom",
    rawBody,
    payload,
    status: "RECEIVED",
    fallbackEventType: "cardcom.webhook",
  });
  const paymentResult = await applyCardComWebhook(payload);

  return okJson({
    ok: true,
    provider: "cardcom",
    status: "RECEIVED",
    eventId: event.id,
    payment: paymentResult,
  });
}
