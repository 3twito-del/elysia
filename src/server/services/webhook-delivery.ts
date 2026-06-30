import { createHmac, randomBytes } from "node:crypto";

import { Prisma } from "@prisma/client";

import { db } from "~/server/db";
import { toDisplayString } from "~/lib/stringify";

/**
 * Outbound webhook platform (IPL-001): register endpoints subscribed to events,
 * then dispatch idempotent, HMAC-signed deliveries with retry/backoff. Signing,
 * subscription matching and backoff are pure + tested. `deliverWebhook` is the
 * only function that makes an outbound HTTP call (explicit, short-timeout).
 */

const DELIVERY_TIMEOUT_MS = 5000;

/** HMAC-SHA256 hex signature of a payload body. Pure. */
export function signPayload(secret: string, body: string): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}

/** Whether an endpoint subscribes to an event (`*` = all). Pure. */
export function matchesSubscription(events: string[], event: string): boolean {
  return events.includes("*") || events.includes(event);
}

/** Backoff (seconds) before the next attempt, exponential and capped. Pure. */
export function nextBackoffSeconds(attempts: number): number {
  return Math.min(30 * 2 ** Math.max(0, attempts), 3600);
}

/** Masked secret for display. Pure. */
export function maskSecret(secret: string): string {
  return `${secret.slice(0, 6)}••••••`;
}

const asJson = (value: unknown) => value as Prisma.InputJsonValue;

function parseEvents(value: Prisma.JsonValue | null | undefined): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((event) => toDisplayString(event));
}

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

/** Registers an outbound endpoint with a freshly generated signing secret. */
export async function createEndpoint(input: {
  name: string;
  url: string;
  events: string[];
}) {
  if (!input.name.trim()) throw new Error("שם היעד הוא שדה חובה.");
  if (!isValidUrl(input.url)) throw new Error("כתובת URL לא תקינה.");
  const events = input.events.map((event) => event.trim()).filter(Boolean);
  if (events.length === 0) throw new Error("יש לבחור לפחות אירוע אחד.");

  const secret = `whsec_${randomBytes(24).toString("hex")}`;
  const endpoint = await db.webhookEndpoint.create({
    data: { name: input.name.trim(), url: input.url.trim(), secret, events: asJson(events) },
  });

  return { id: endpoint.id, name: endpoint.name, secret };
}

export async function setEndpointActive(input: {
  endpointId: string;
  isActive: boolean;
}) {
  return db.webhookEndpoint.update({
    where: { id: input.endpointId },
    data: { isActive: input.isActive },
  });
}

export async function deleteEndpoint(input: { endpointId: string }) {
  return db.webhookEndpoint.delete({ where: { id: input.endpointId } });
}

/**
 * Queues a delivery to every active endpoint subscribed to the event. Idempotent
 * per endpoint via dedupeKey, so re-dispatching the same event is safe.
 */
export async function dispatchWebhookEvent(input: {
  event: string;
  payload: unknown;
  dedupeKey?: string;
}) {
  const endpoints = await db.webhookEndpoint.findMany({
    where: { isActive: true },
  });

  let queued = 0;
  for (const endpoint of endpoints) {
    if (!matchesSubscription(parseEvents(endpoint.events), input.event)) continue;

    const dedupeKey = input.dedupeKey
      ? `${input.dedupeKey}:${endpoint.id}`
      : undefined;
    try {
      await db.webhookDelivery.create({
        data: {
          endpointId: endpoint.id,
          event: input.event,
          payload: asJson(input.payload ?? {}),
          dedupeKey,
        },
      });
      queued += 1;
    } catch (error) {
      // A repeated dedupeKey means this event was already queued — skip.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        continue;
      }
      throw error;
    }
  }

  return { event: input.event, queued };
}

/** Sends (or retries) a single delivery over HTTP with a signed body. */
export async function deliverWebhook(input: { deliveryId: string }) {
  const delivery = await db.webhookDelivery.findUnique({
    where: { id: input.deliveryId },
    include: { endpoint: true },
  });
  if (!delivery) throw new Error("משלוח לא נמצא.");

  const body = JSON.stringify(delivery.payload ?? {});
  const signature = signPayload(delivery.endpoint.secret, body);

  let status = "FAILED";
  let responseStatus: number | null = null;
  let error: string | null = null;

  try {
    const response = await fetch(delivery.endpoint.url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-elysia-event": delivery.event,
        "x-elysia-signature": signature,
        "x-elysia-delivery": delivery.id,
      },
      body,
      signal: AbortSignal.timeout(DELIVERY_TIMEOUT_MS),
    });
    responseStatus = response.status;
    status = response.ok ? "SENT" : "FAILED";
    if (!response.ok) error = `HTTP ${response.status}`;
  } catch (caught) {
    error = caught instanceof Error ? caught.message : "שגיאת רשת.";
  }

  return db.webhookDelivery.update({
    where: { id: delivery.id },
    data: {
      status,
      responseStatus,
      error,
      attempts: { increment: 1 },
    },
  });
}

export async function listEndpoints() {
  const endpoints = await db.webhookEndpoint.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      url: true,
      secret: true,
      events: true,
      isActive: true,
      _count: { select: { deliveries: true } },
    },
  });

  return endpoints.map((endpoint) => ({
    id: endpoint.id,
    name: endpoint.name,
    url: endpoint.url,
    maskedSecret: maskSecret(endpoint.secret),
    events: parseEvents(endpoint.events),
    isActive: endpoint.isActive,
    deliveryCount: endpoint._count.deliveries,
  }));
}

export async function listDeliveries(limit = 15) {
  const deliveries = await db.webhookDelivery.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      event: true,
      status: true,
      attempts: true,
      responseStatus: true,
      createdAt: true,
      endpoint: { select: { name: true } },
    },
  });

  return deliveries.map((delivery) => ({
    id: delivery.id,
    event: delivery.event,
    status: delivery.status,
    attempts: delivery.attempts,
    responseStatus: delivery.responseStatus,
    createdAt: delivery.createdAt,
    endpointName: delivery.endpoint.name,
  }));
}

export async function getWebhookSummary() {
  const [endpoints, active, pending, failed] = await Promise.all([
    db.webhookEndpoint.count(),
    db.webhookEndpoint.count({ where: { isActive: true } }),
    db.webhookDelivery.count({ where: { status: "PENDING" } }),
    db.webhookDelivery.count({ where: { status: "FAILED" } }),
  ]);

  return { endpoints, active, pending, failed };
}
