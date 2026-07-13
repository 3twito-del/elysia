import { createHmac, randomBytes } from "node:crypto";
import { lookup as dnsLookup } from "node:dns/promises";

import { Prisma } from "@prisma/client";

import { db } from "~/server/db";
import { toDisplayString } from "~/lib/stringify";
import { writeAdminAudit } from "~/server/services/admin-commerce-workflow";

/**
 * Outbound webhook platform (IPL-001): register endpoints subscribed to events,
 * then dispatch idempotent, HMAC-signed deliveries with retry/backoff. Signing,
 * subscription matching and backoff are pure + tested. `deliverWebhook` is the
 * only function that makes an outbound HTTP call (explicit, short-timeout).
 *
 * K-13 (docs/QA_EVIDENCE.md "k-08-csrf-ssrf-uploads-review"): this is a
 * SYSTEM_CONFIG-gated admin feature that fetches an admin-registered URL —
 * a real SSRF primitive with no privilege-escalation angle (the actor
 * already holds the highest admin tier), but worth blocking regardless.
 * `assertPublicWebhookUrl` blocks private/reserved/loopback/link-local
 * (incl. the 169.254.169.254 cloud metadata endpoint) destinations by
 * resolving the hostname's real IP(s) and checking them, not just the
 * literal hostname string — this is why it must be async and re-run at
 * *delivery* time, not only at registration time: a DNS-rebinding attacker
 * registers a domain that resolves to a public IP when checked, then
 * repoints it to a private IP before the actual delivery fires.
 */

const BLOCKED_IPV4_RANGES: Array<{ base: string; prefixLength: number }> = [
  { base: "0.0.0.0", prefixLength: 8 }, // "this network"
  { base: "10.0.0.0", prefixLength: 8 }, // RFC1918 private
  { base: "100.64.0.0", prefixLength: 10 }, // carrier-grade NAT
  { base: "127.0.0.0", prefixLength: 8 }, // loopback
  { base: "169.254.0.0", prefixLength: 16 }, // link-local (incl. cloud metadata)
  { base: "172.16.0.0", prefixLength: 12 }, // RFC1918 private
  { base: "192.0.0.0", prefixLength: 24 }, // IETF protocol assignments
  { base: "192.0.2.0", prefixLength: 24 }, // TEST-NET-1 (documentation)
  { base: "192.168.0.0", prefixLength: 16 }, // RFC1918 private
  { base: "198.18.0.0", prefixLength: 15 }, // benchmark testing
  { base: "198.51.100.0", prefixLength: 24 }, // TEST-NET-2 (documentation)
  { base: "203.0.113.0", prefixLength: 24 }, // TEST-NET-3 (documentation)
  { base: "224.0.0.0", prefixLength: 4 }, // multicast
  { base: "240.0.0.0", prefixLength: 4 }, // reserved (incl. 255.255.255.255)
];

function ipv4ToInt(address: string): number | null {
  const parts = address.split(".");
  if (parts.length !== 4) return null;

  let value = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const octet = Number(part);
    if (octet > 255) return null;
    value = value * 256 + octet;
  }

  return value;
}

/** Whether an IPv4 address falls in a blocked private/reserved range. Pure. */
export function isBlockedIpv4Address(address: string): boolean {
  const value = ipv4ToInt(address);
  if (value === null) return false;

  return BLOCKED_IPV4_RANGES.some((range) => {
    const base = ipv4ToInt(range.base);
    if (base === null) return false;
    const mask = range.prefixLength === 0 ? 0 : ~0 << (32 - range.prefixLength);
    return (value & mask) === (base & mask);
  });
}

/** Whether an IPv6 address falls in a blocked private/reserved range. Pure. */
export function isBlockedIpv6Address(address: string): boolean {
  const normalized = address.toLowerCase();

  if (normalized === "::1" || normalized === "::") return true;
  if (normalized.startsWith("fe80:") || normalized.startsWith("fe80::")) {
    return true;
  }
  // Unique local addresses, fc00::/7 (fc00:: through fdff:...).
  if (/^f[cd][0-9a-f]{0,2}:/.test(normalized)) return true;

  // IPv4-mapped (::ffff:a.b.c.d) — check the embedded IPv4 address too.
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(normalized);
  if (mapped?.[1]) return isBlockedIpv4Address(mapped[1]);

  return false;
}

/** Whether a resolved IP address (v4 or v6) is private/reserved. Pure. */
export function isBlockedAddress(address: string): boolean {
  return address.includes(":")
    ? isBlockedIpv6Address(address)
    : isBlockedIpv4Address(address);
}

export class WebhookUrlBlockedError extends Error {
  constructor(url: string) {
    super(`כתובת URL אינה מותרת (יעד פרטי/שמור): ${url}`);
    this.name = "WebhookUrlBlockedError";
  }
}

/**
 * Resolves the URL's hostname and rejects if any resolved address is
 * private/reserved. Must be called again immediately before every delivery
 * attempt, not only at registration — see the module-level comment on
 * DNS rebinding.
 */
export async function assertPublicWebhookUrl(url: string): Promise<void> {
  const parsed = new URL(url);
  const addresses = await dnsLookup(parsed.hostname, { all: true });

  if (addresses.length === 0 || addresses.some((entry) => isBlockedAddress(entry.address))) {
    throw new WebhookUrlBlockedError(url);
  }
}

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
  adminUserId: string;
}) {
  if (!input.name.trim()) throw new Error("שם היעד הוא שדה חובה.");
  if (!isValidUrl(input.url)) throw new Error("כתובת URL לא תקינה.");
  await assertPublicWebhookUrl(input.url);
  const events = input.events.map((event) => event.trim()).filter(Boolean);
  if (events.length === 0) throw new Error("יש לבחור לפחות אירוע אחד.");

  const secret = `whsec_${randomBytes(24).toString("hex")}`;
  const endpoint = await db.$transaction(async (tx) => {
    const created = await tx.webhookEndpoint.create({
      data: {
        name: input.name.trim(),
        url: input.url.trim(),
        secret,
        events: asJson(events),
      },
    });

    await writeAdminAudit(tx, {
      adminUserId: input.adminUserId,
      action: "webhook_endpoint_created",
      entity: "WebhookEndpoint",
      entityId: created.id,
      metadata: { name: created.name, url: created.url, events },
    });

    return created;
  });

  return { id: endpoint.id, name: endpoint.name, secret };
}

export async function setEndpointActive(input: {
  endpointId: string;
  isActive: boolean;
  adminUserId: string;
}) {
  return db.$transaction(async (tx) => {
    const updated = await tx.webhookEndpoint.update({
      where: { id: input.endpointId },
      data: { isActive: input.isActive },
    });

    await writeAdminAudit(tx, {
      adminUserId: input.adminUserId,
      action: "webhook_endpoint_status_updated",
      entity: "WebhookEndpoint",
      entityId: updated.id,
      metadata: { isActive: updated.isActive },
    });

    return updated;
  });
}

export async function deleteEndpoint(input: {
  endpointId: string;
  adminUserId: string;
}) {
  return db.$transaction(async (tx) => {
    const deleted = await tx.webhookEndpoint.delete({
      where: { id: input.endpointId },
    });

    await writeAdminAudit(tx, {
      adminUserId: input.adminUserId,
      action: "webhook_endpoint_deleted",
      entity: "WebhookEndpoint",
      entityId: deleted.id,
      metadata: { name: deleted.name, url: deleted.url },
    });

    return deleted;
  });
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
export async function deliverWebhook(input: {
  deliveryId: string;
  adminUserId: string;
}) {
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
    // Re-checked here, not only at registration: DNS rebinding can repoint
    // an approved hostname at a private IP between registration and this
    // exact delivery attempt.
    await assertPublicWebhookUrl(delivery.endpoint.url);

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

  const updated = await db.webhookDelivery.update({
    where: { id: delivery.id },
    data: {
      status,
      responseStatus,
      error,
      attempts: { increment: 1 },
    },
  });

  // Not run inside a transaction with the update above: the outbound fetch
  // sits between the read and the write, so there's no single db.$transaction
  // this could join without holding a connection open across a network call.
  await writeAdminAudit(db, {
    adminUserId: input.adminUserId,
    action: "webhook_delivery_triggered",
    entity: "WebhookDelivery",
    entityId: updated.id,
    metadata: { status: updated.status, responseStatus, error },
  });

  return updated;
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
