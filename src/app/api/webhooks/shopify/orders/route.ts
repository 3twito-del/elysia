import { verifyShopifyWebhookSignature } from "~/server/adapters/shopify";
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
  createWebhookErrorSummary,
  createWebhookSafeLogContext,
  parseWebhookJson,
  recordWebhookEvent,
} from "~/server/services/webhook-events";
import { mirrorShopifyOrderWebhook } from "~/server/services/shopify-order-mirror";
import {
  assertRateLimit,
  getRequestIp,
  RateLimitExceededError,
} from "~/server/services/rate-limit";

const WEBHOOK_MAX_BYTES = 256 * 1024;

export async function POST(req: Request) {
  try {
    await assertRateLimit({
      key: `webhook:shopify-orders:${getRequestIp(req)}`,
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
  const signature = req.headers.get("x-shopify-hmac-sha256");
  const payload = parseWebhookJson(rawBody);

  if (!verifyShopifyWebhookSignature({ rawBody, signature })) {
    const unverifiedLogContext = createWebhookSafeLogContext({
      fallbackEventType: "shopify.orders.unverified",
      payload,
      provider: "shopify",
      rawBody,
      stage: "signature-verification",
      status: "FAILED",
    });

    await recordWebhookEvent({
      provider: "shopify",
      rawBody,
      payload,
      status: "FAILED",
      fallbackEventType: "shopify.orders.unverified",
    }).catch((error: unknown) => {
      console.error(
        "[webhook:shopify:record-failed]",
        unverifiedLogContext,
        createWebhookErrorSummary(error),
      );
    });

    return unauthorizedJson("Invalid Shopify signature.");
  }

  await recordWebhookEvent({
    provider: "shopify",
    rawBody,
    payload,
    status: "RECEIVED",
    fallbackEventType: "shopify.orders.webhook",
  });

  let mirror: Awaited<ReturnType<typeof mirrorShopifyOrderWebhook>>;

  try {
    mirror = await mirrorShopifyOrderWebhook(payload);
  } catch (error) {
    const processingLogContext = createWebhookSafeLogContext({
      fallbackEventType: "shopify.orders.webhook",
      payload,
      provider: "shopify",
      rawBody,
      stage: "processing",
      status: "RECEIVED",
    });

    console.error(
      "[webhook:shopify:process-failed]",
      processingLogContext,
      createWebhookErrorSummary(error),
    );

    return serviceUnavailableJson("Shopify webhook processing is unavailable.");
  }

  const event = await recordWebhookEvent({
    provider: "shopify",
    rawBody,
    payload,
    status: "PROCESSED",
    fallbackEventType: "shopify.orders.webhook",
  });

  return okJson({
    ok: true,
    provider: "shopify",
    status: "PROCESSED",
    eventId: event.id,
    mirror,
  });
}
