import { createHash } from "node:crypto";
import type { Prisma, WebhookStatus } from "@prisma/client";

import { db } from "~/server/db";
import { BUSINESS_EVENTS, createOutboxEvent } from "~/server/services/outbox";

export function parseWebhookJson(rawBody: string): unknown {
  if (!rawBody.trim()) return {};

  try {
    return JSON.parse(rawBody) as unknown;
  } catch {
    return {};
  }
}

export function createWebhookExternalId(
  provider: string,
  rawBody: string,
  payload: unknown,
) {
  const explicitId = getPayloadString(payload, [
    "id",
    "eventId",
    "event_id",
    "transactionId",
    "TransactionId",
    "lowProfileCode",
    "LowProfileCode",
    "public_id",
    "asset_id",
  ]);

  if (explicitId) return explicitId;

  return createHash("sha256")
    .update(`${provider}:${rawBody}`)
    .digest("hex")
    .slice(0, 32);
}

export function getWebhookEventType(payload: unknown, fallback: string) {
  return (
    getPayloadString(payload, ["type", "event", "eventType", "EventType"]) ??
    fallback
  );
}

export async function recordWebhookEvent(input: {
  provider: string;
  rawBody: string;
  payload: unknown;
  status?: WebhookStatus;
  fallbackEventType: string;
}) {
  const externalId = createWebhookExternalId(
    input.provider,
    input.rawBody,
    input.payload,
  );
  const eventType = getWebhookEventType(input.payload, input.fallbackEventType);
  const payload = toJson(input.payload);
  const rawBodyHash = createHash("sha256").update(input.rawBody).digest("hex");

  return db.$transaction(async (tx) => {
    const event = await tx.webhookEvent.upsert({
      where: {
        provider_externalId: {
          provider: input.provider,
          externalId,
        },
      },
      update: {
        eventType,
        status: input.status ?? "RECEIVED",
        payload,
        rawBodyHash,
        processedAt: input.status === "PROCESSED" ? new Date() : undefined,
      },
      create: {
        provider: input.provider,
        externalId,
        eventType,
        status: input.status ?? "RECEIVED",
        payload,
        rawBodyHash,
        processedAt: input.status === "PROCESSED" ? new Date() : undefined,
      },
    });

    await createOutboxEvent(tx, {
      type: BUSINESS_EVENTS.webhookReceived,
      aggregateType: "WebhookEvent",
      aggregateId: event.id,
      idempotencyKey: `${BUSINESS_EVENTS.webhookReceived}:${input.provider}:${externalId}`,
      payload: {
        provider: input.provider,
        eventType,
        externalId,
        rawBodyHash,
        status: input.status ?? "RECEIVED",
      },
    });

    return event;
  });
}

function getPayloadString(payload: unknown, keys: string[]) {
  if (!payload || typeof payload !== "object") return null;

  const record = payload as Record<string, unknown>;

  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }

  return null;
}

function toJson(value: unknown): Prisma.InputJsonValue {
  if (value === undefined) return {};

  return value as Prisma.InputJsonValue;
}
