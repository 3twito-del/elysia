import { paymentProvider } from "~/server/adapters/payment";
import {
  badRequestJson,
  okJson,
  payloadTooLargeJson,
  rateLimitedJson,
  serviceUnavailableJson,
  unauthorizedJson,
} from "~/server/http/api-response";
import { readSafeText } from "~/server/http/safe-json";
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

const WEBHOOK_MAX_BYTES = 256 * 1024;

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

  const body = await readSafeText(req, { maxBytes: WEBHOOK_MAX_BYTES });

  if (!body.ok) {
    return body.error === "too-large"
      ? payloadTooLargeJson("Webhook body is too large.")
      : badRequestJson("Webhook body is required.");
  }

  const rawBody = body.text;
  const payload = parseWebhookJson(rawBody);
  const signature = req.headers.get("x-cardcom-signature") ?? undefined;
  const timestamp = req.headers.get("x-cardcom-timestamp") ?? undefined;
  const verified = await paymentProvider.verifyWebhook({
    payload,
    rawBody,
    signature,
    timestamp,
  });

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
  let paymentResult: Awaited<ReturnType<typeof applyCardComWebhook>>;

  try {
    paymentResult = await applyCardComWebhook(payload);
  } catch (error) {
    console.error("[webhook:cardcom:process-failed]", error);

    return serviceUnavailableJson("CardCom webhook processing is unavailable.");
  }

  return okJson({
    ok: true,
    provider: "cardcom",
    status: "RECEIVED",
    eventId: event.id,
    payment: paymentResult,
  });
}
