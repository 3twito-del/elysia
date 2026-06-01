import { createHash, timingSafeEqual } from "node:crypto";

import { env } from "~/env";
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

export function verifyCloudinarySignature(input: {
  rawBody: string;
  signature: string | null;
  secret?: string;
  nodeEnv?: string;
  nowMs?: number;
  timestamp: string | null;
}) {
  const secret = input.secret ?? env.CLOUDINARY_API_SECRET;

  if (!secret) {
    return (input.nodeEnv ?? env.NODE_ENV) !== "production";
  }

  if (!input.signature || !input.timestamp) return false;

  const timestampMs = Number(input.timestamp) * 1000;
  const nowMs = input.nowMs ?? Date.now();

  if (!Number.isFinite(timestampMs)) return false;

  const twoHoursMs = 2 * 60 * 60_000;

  if (Math.abs(nowMs - timestampMs) > twoHoursMs) return false;

  const signedPayload = `${input.rawBody}${input.timestamp}${secret}`;

  return ["sha1", "sha256"].some((algorithm) =>
    safeEqualHex(
      input.signature ?? "",
      createHash(algorithm).update(signedPayload).digest("hex"),
    ),
  );
}

function safeEqualHex(actual: string, expected: string) {
  const actualBuffer = Buffer.from(actual, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");

  return (
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  );
}
