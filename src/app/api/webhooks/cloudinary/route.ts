import { verifyCloudinarySignature } from "~/server/adapters/cloudinary";
import {
  badRequestJson,
  okJson,
  payloadTooLargeJson,
  rateLimitedJson,
  unauthorizedJson,
} from "~/server/http/api-response";
import { readSafeText } from "~/server/http/safe-json";
import {
  createWebhookErrorSummary,
  createWebhookSafeLogContext,
  parseWebhookJson,
  recordWebhookEvent,
} from "~/server/services/webhook-events";
import {
  assertRateLimit,
  getRequestIp,
  RateLimitExceededError,
} from "~/server/services/rate-limit";

const WEBHOOK_MAX_BYTES = 256 * 1024;

export async function POST(req: Request) {
  try {
    await assertRateLimit({
      key: `webhook:cloudinary:${getRequestIp(req)}`,
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
  const signature = req.headers.get("x-cld-signature");
  const timestamp = req.headers.get("x-cld-timestamp");

  if (!verifyCloudinarySignature({ rawBody, signature, timestamp })) {
    const unverifiedLogContext = createWebhookSafeLogContext({
      fallbackEventType: "cloudinary.unverified",
      payload,
      provider: "cloudinary",
      rawBody,
      stage: "signature-verification",
      status: "FAILED",
    });

    await recordWebhookEvent({
      provider: "cloudinary",
      rawBody,
      payload,
      status: "FAILED",
      fallbackEventType: "cloudinary.unverified",
    }).catch((error: unknown) => {
      console.error(
        "[webhook:cloudinary:record-failed]",
        unverifiedLogContext,
        createWebhookErrorSummary(error),
      );
    });

    return unauthorizedJson("Invalid Cloudinary signature.");
  }

  const event = await recordWebhookEvent({
    provider: "cloudinary",
    rawBody,
    payload,
    status: "RECEIVED",
    fallbackEventType: "cloudinary.webhook",
  });

  return okJson({
    ok: true,
    provider: "cloudinary",
    status: "RECEIVED",
    eventId: event.id,
  });
}
