import { createHash } from "node:crypto";

import { Prisma } from "@prisma/client";
import { z } from "zod";

import { env } from "~/env";
import { db } from "~/server/db";
import {
  getFixtureCatalogProductBySlug,
  shouldUseCatalogFixtures,
} from "~/server/services/catalog-fixtures";
import { BUSINESS_EVENTS, enqueueOutboxEvent } from "~/server/services/outbox";

export const analyticsEventTypes = [
  "page_view",
  "route_change",
  "scroll_depth",
  "cta_impression",
  "cta_click",
  "outbound_click",
  "form_start",
  "form_error",
  "product_view",
  "product_click",
  "search_performed",
  "wishlist_add",
  "add_to_cart",
  "checkout_started",
  "order_created",
  "payment_captured",
  "shopify_checkout_started",
  "service_request_created",
  "appointment_requested",
  "newsletter_subscribed",
  "push_opt_in",
] as const;

export type AnalyticsEventType = (typeof analyticsEventTypes)[number];

export const analyticsConsentModes = [
  "essential",
  "measurement",
  "business",
] as const;

export type AnalyticsConsentMode = (typeof analyticsConsentModes)[number];

const publicBehaviorEventTypes = new Set<AnalyticsEventType>([
  "page_view",
  "route_change",
  "scroll_depth",
  "cta_impression",
  "cta_click",
  "outbound_click",
  "form_start",
  "form_error",
  "product_view",
  "product_click",
  "search_performed",
]);

const sensitivePayloadKeyPattern =
  /(email|e-mail|mail|phone|mobile|tel|address|street|city|postal|zip|token|secret|password|authorization|cookie|raw|payload|card|cvv|cc|iban|input|fieldValue|payment|credit|expiry|pan)/i;
const sensitiveStringPattern =
  /([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\b\d{3}[-\s]?\d{3}[-\s]?\d{4}\b|\b(?:\d[ -]*?){13,19}\b)/i;
const attributionEventTypes = new Set<AnalyticsEventType>([
  "page_view",
  "route_change",
  "product_view",
  "product_click",
  "search_performed",
  "cta_click",
  "add_to_cart",
  "checkout_started",
  "order_created",
  "payment_captured",
]);

const analyticsSources = ["client", "server", "job", "import"] as const;

const analyticsJsonSchema: z.ZodType<Prisma.JsonValue> = z.lazy(() =>
  z.union([
    z.string().max(2_000),
    z.number().finite(),
    z.boolean(),
    z.null(),
    z.array(analyticsJsonSchema).max(50),
    z.record(z.string().max(80), analyticsJsonSchema),
  ]),
);

export const analyticsEventInputSchema = z.object({
  type: z.enum(analyticsEventTypes),
  occurredAt: z.coerce.date().optional(),
  visitorKey: z.string().trim().min(8).max(256).optional(),
  visitorKeyHash: z.string().trim().min(16).max(128).optional(),
  sessionKey: z.string().trim().min(8).max(256).optional(),
  sessionKeyHash: z.string().trim().min(16).max(128).optional(),
  customerId: z.string().trim().min(1).max(128).optional(),
  orderId: z.string().trim().min(1).max(128).optional(),
  productId: z.string().trim().min(1).max(128).optional(),
  productSlug: z.string().trim().min(1).max(180).optional(),
  source: z.enum(analyticsSources).default("server"),
  sequence: z.number().int().nonnegative().optional(),
  url: z.string().trim().max(2_048).optional(),
  title: z.string().trim().max(240).optional(),
  path: z.string().trim().max(512).optional(),
  referrer: z.string().trim().max(512).optional(),
  utm: z.record(z.string().max(64), analyticsJsonSchema).optional(),
  device: z.record(z.string().max(64), analyticsJsonSchema).optional(),
  viewport: z.record(z.string().max(64), analyticsJsonSchema).optional(),
  geo: z.record(z.string().max(64), analyticsJsonSchema).optional(),
  attribution: z.record(z.string().max(64), analyticsJsonSchema).optional(),
  consentMode: z.enum(analyticsConsentModes).default("business"),
  payload: analyticsJsonSchema.optional(),
  schemaVersion: z.number().int().positive().max(10).default(1),
  idempotencyKey: z.string().trim().min(8).max(256).optional(),
});

export const analyticsBatchInputSchema = z.object({
  events: z.array(analyticsEventInputSchema).min(1).max(25),
});

export type AnalyticsEventInput = z.input<typeof analyticsEventInputSchema>;
type ParsedAnalyticsEventInput = z.output<typeof analyticsEventInputSchema>;

export type AnalyticsRecordResult =
  | { status: "accepted"; eventId: string | null }
  | { status: "duplicate"; eventId: null }
  | {
      status: "skipped";
      eventId: null;
      reason:
        | "disabled"
        | "database_unavailable"
        | "fixture_mode"
        | "missing_product";
    };

export function isAnalyticsIngestionEnabled() {
  return !["0", "false"].includes(env.ANALYTICS_INGESTION_ENABLED ?? "");
}

export function isAnalyticsRollupsEnabled() {
  return !["0", "false"].includes(env.ANALYTICS_ROLLUPS_ENABLED ?? "");
}

export function hashAnalyticsIdentifier(value: string) {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

export function redactAnalyticsPayload(
  value: Prisma.JsonValue | undefined,
): Prisma.JsonValue | undefined {
  if (typeof value === "undefined") return undefined;

  return redactJsonValue(value, 0);
}

export async function recordAnalyticsEvents(input: AnalyticsEventInput[]) {
  const results: AnalyticsRecordResult[] = [];

  for (const event of input) {
    results.push(await recordAnalyticsEvent(event));
  }

  return {
    accepted: results.filter((result) => result.status === "accepted").length,
    duplicates: results.filter((result) => result.status === "duplicate")
      .length,
    skipped: results.filter((result) => result.status === "skipped").length,
    results,
  };
}

export async function recordAnalyticsEvent(
  input: AnalyticsEventInput,
): Promise<AnalyticsRecordResult> {
  const parsed = analyticsEventInputSchema.parse(input);

  if (!isAnalyticsIngestionEnabled()) {
    return { status: "skipped", eventId: null, reason: "disabled" };
  }

  if (!env.DATABASE_URL) {
    return { status: "skipped", eventId: null, reason: "database_unavailable" };
  }

  if (shouldUseCatalogFixtures()) {
    return { status: "skipped", eventId: null, reason: "fixture_mode" };
  }

  const productId = await resolveAnalyticsProductId({
    productId: parsed.productId,
    productSlug: parsed.productSlug,
  });

  if (parsed.productSlug && !productId) {
    return { status: "skipped", eventId: null, reason: "missing_product" };
  }

  const occurredAt = parsed.occurredAt ?? new Date();
  const sessionKeyHash =
    parsed.sessionKeyHash ??
    (parsed.sessionKey ? hashAnalyticsIdentifier(parsed.sessionKey) : null);
  const visitorKeyHash =
    parsed.visitorKeyHash ??
    (parsed.visitorKey ? hashAnalyticsIdentifier(parsed.visitorKey) : null);
  const redactedPayload = redactAnalyticsPayload(parsed.payload);
  try {
    const identity = await resolveAnalyticsIdentity({
      occurredAt,
      visitorKeyHash,
      sessionKeyHash,
      customerId: parsed.customerId,
      path: parsed.path,
      referrer: parsed.referrer,
      utm: parsed.utm,
      device: parsed.device,
      geo: parsed.geo,
    });
    const data: Prisma.AnalyticsEventCreateInput = {
      type: parsed.type,
      occurredAt,
      visitor: identity.visitorId
        ? { connect: { id: identity.visitorId } }
        : undefined,
      session: identity.sessionId
        ? { connect: { id: identity.sessionId } }
        : undefined,
      sessionKeyHash,
      customer: parsed.customerId
        ? { connect: { id: parsed.customerId } }
        : undefined,
      order: parsed.orderId ? { connect: { id: parsed.orderId } } : undefined,
      product: productId ? { connect: { id: productId } } : undefined,
      source: parsed.source,
      sequence: parsed.sequence,
      url: parsed.url,
      title: parsed.title,
      path: parsed.path,
      referrer: parsed.referrer,
      utm: toNullableJsonInput(parsed.utm),
      device: toNullableJsonInput(parsed.device),
      viewport: toNullableJsonInput(parsed.viewport),
      geo: toNullableJsonInput(parsed.geo),
      attribution: toNullableJsonInput(parsed.attribution),
      consentMode: parsed.consentMode,
      payload: toNullableJsonInput(redactedPayload),
      schemaVersion: parsed.schemaVersion,
      idempotencyKey: parsed.idempotencyKey
        ? hashAnalyticsIdentifier(parsed.idempotencyKey)
        : undefined,
    };
    const event = await db.analyticsEvent.create({
      data,
      select: { id: true },
    });
    await recordAttributionSideEffects({
      eventId: event.id,
      input: parsed,
      identity,
      occurredAt,
      productId,
      payload: redactedPayload,
    });
    await enqueueAnalyticsRollupSafely(occurredAt);

    return { status: "accepted", eventId: event.id };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { status: "duplicate", eventId: null };
    }

    if (isAnalyticsDatabaseUnavailableError(error)) {
      return {
        status: "skipped",
        eventId: null,
        reason: "database_unavailable",
      };
    }

    throw error;
  }
}

async function enqueueAnalyticsRollupSafely(date: Date) {
  try {
    const rollupDate = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );

    await enqueueOutboxEvent({
      type: BUSINESS_EVENTS.analyticsRollupRequested,
      aggregateType: "AnalyticsDailyAggregate",
      aggregateId: rollupDate.toISOString().slice(0, 10),
      idempotencyKey: `${BUSINESS_EVENTS.analyticsRollupRequested}:${rollupDate
        .toISOString()
        .slice(0, 10)}`,
      availableAt: new Date(Date.now() + 60_000),
      payload: { date: rollupDate.toISOString() },
    });
  } catch (error) {
    console.error("[analytics:rollup-enqueue-failed]", error);
  }
}

export async function resolveAnalyticsIdentity(input: {
  occurredAt: Date;
  visitorKeyHash?: string | null;
  sessionKeyHash?: string | null;
  customerId?: string | null;
  path?: string | null;
  referrer?: string | null;
  utm?: Prisma.JsonValue;
  device?: Prisma.JsonValue;
  geo?: Prisma.JsonValue;
  replayEnabled?: boolean;
}) {
  let visitorId: string | null = null;

  if (input.visitorKeyHash) {
    const visitor = await db.analyticsVisitor.upsert({
      where: { visitorKeyHash: input.visitorKeyHash },
      create: {
        visitorKeyHash: input.visitorKeyHash,
        customer: input.customerId
          ? { connect: { id: input.customerId } }
          : undefined,
        firstSeenAt: input.occurredAt,
        lastSeenAt: input.occurredAt,
        firstPath: input.path ?? undefined,
        firstReferrer: input.referrer ?? undefined,
        firstUtm: toNullableJsonInput(input.utm),
        device: toNullableJsonInput(input.device),
        geo: toNullableJsonInput(input.geo),
      },
      update: {
        lastSeenAt: input.occurredAt,
        customer: input.customerId
          ? { connect: { id: input.customerId } }
          : undefined,
        device: toNullableJsonInput(input.device),
        geo: toNullableJsonInput(input.geo),
      },
      select: { id: true },
    });

    visitorId = visitor.id;
  }

  let sessionId: string | null = null;

  if (input.sessionKeyHash) {
    const session = await db.analyticsSession.upsert({
      where: { sessionKeyHash: input.sessionKeyHash },
      create: {
        sessionKeyHash: input.sessionKeyHash,
        visitor: visitorId ? { connect: { id: visitorId } } : undefined,
        customer: input.customerId
          ? { connect: { id: input.customerId } }
          : undefined,
        startedAt: input.occurredAt,
        lastSeenAt: input.occurredAt,
        entryPath: input.path ?? undefined,
        exitPath: input.path ?? undefined,
        referrer: input.referrer ?? undefined,
        utm: toNullableJsonInput(input.utm),
        device: toNullableJsonInput(input.device),
        geo: toNullableJsonInput(input.geo),
        eventCount: 1,
        replayEnabled: input.replayEnabled ?? false,
      },
      update: {
        lastSeenAt: input.occurredAt,
        exitPath: input.path ?? undefined,
        visitor: visitorId ? { connect: { id: visitorId } } : undefined,
        customer: input.customerId
          ? { connect: { id: input.customerId } }
          : undefined,
        device: toNullableJsonInput(input.device),
        geo: toNullableJsonInput(input.geo),
        eventCount: { increment: 1 },
        replayEnabled:
          typeof input.replayEnabled === "boolean"
            ? input.replayEnabled
            : undefined,
      },
      select: { id: true },
    });

    sessionId = session.id;
  }

  return { visitorId, sessionId };
}

async function recordAttributionSideEffects(input: {
  eventId: string;
  input: ParsedAnalyticsEventInput;
  identity: { visitorId: string | null; sessionId: string | null };
  occurredAt: Date;
  productId: string | null;
  payload: Prisma.JsonValue | undefined;
}) {
  if (!shouldCreateAttributionTouchpoint(input.input)) return;

  try {
    const attribution = normalizeAttribution({
      utm: input.input.utm,
      attribution: input.input.attribution,
      referrer: input.input.referrer,
    });

    const touchpoint = await db.attributionTouchpoint.create({
      data: {
        visitor: input.identity.visitorId
          ? { connect: { id: input.identity.visitorId } }
          : undefined,
        session: input.identity.sessionId
          ? { connect: { id: input.identity.sessionId } }
          : undefined,
        customer: input.input.customerId
          ? { connect: { id: input.input.customerId } }
          : undefined,
        order: input.input.orderId
          ? { connect: { id: input.input.orderId } }
          : undefined,
        occurredAt: input.occurredAt,
        type: input.input.type,
        source: attribution.source,
        medium: attribution.medium,
        campaign: attribution.campaign,
        referrer: input.input.referrer,
        landingPath: input.input.path,
        weight:
          input.input.type === "order_created" ||
          input.input.type === "payment_captured"
            ? 1
            : 0,
        metadata: toNullableJsonInput({
          eventId: input.eventId,
          url: input.input.url ?? null,
          productId: input.productId,
        }),
      },
      select: { id: true },
    });

    if (input.input.orderId) {
      await upsertOrderAttribution({
        orderId: input.input.orderId,
        touchpointId: touchpoint.id,
        identity: input.identity,
        occurredAt: input.occurredAt,
        payload: input.payload,
        fallbackAttribution: attribution,
      });
    }
  } catch (error) {
    console.error("[analytics:attribution-failed]", error);
  }
}

async function upsertOrderAttribution(input: {
  orderId: string;
  touchpointId: string;
  identity: { visitorId: string | null; sessionId: string | null };
  occurredAt: Date;
  payload: Prisma.JsonValue | undefined;
  fallbackAttribution: NormalizedAttribution;
}) {
  const touchpoints = await db.attributionTouchpoint.findMany({
    where: {
      occurredAt: { lte: input.occurredAt },
      OR: createOrderAttributionLookup(input.orderId, input.identity),
    },
    orderBy: { occurredAt: "asc" },
    take: 100,
  });
  const firstTouch = touchpoints[0] ?? null;
  const lastTouch =
    touchpoints.find((touchpoint) => touchpoint.id === input.touchpointId) ??
    touchpoints.at(-1) ??
    null;
  const order = await db.order.findUnique({
    where: { id: input.orderId },
    select: { total: true },
  });
  const revenue = order ? Number(order.total) : extractRevenue(input.payload);
  const attribution = {
    source: lastTouch?.source ?? input.fallbackAttribution.source,
    medium: lastTouch?.medium ?? input.fallbackAttribution.medium,
    campaign: lastTouch?.campaign ?? input.fallbackAttribution.campaign,
  };

  await db.orderAttribution.upsert({
    where: { orderId: input.orderId },
    create: {
      order: { connect: { id: input.orderId } },
      ...attribution,
      firstTouch: toNullableJsonInput(serializeTouchpoint(firstTouch)),
      lastTouch: toNullableJsonInput(serializeTouchpoint(lastTouch)),
      conversionTouch: toNullableJsonInput(serializeTouchpoint(lastTouch)),
      revenue,
      modelVersion: "v1",
    },
    update: {
      ...attribution,
      firstTouch: toNullableJsonInput(serializeTouchpoint(firstTouch)),
      lastTouch: toNullableJsonInput(serializeTouchpoint(lastTouch)),
      conversionTouch: toNullableJsonInput(serializeTouchpoint(lastTouch)),
      revenue,
      modelVersion: "v1",
    },
  });
}

async function resolveAnalyticsProductId(input: {
  productId?: string;
  productSlug?: string;
}) {
  if (input.productId) return input.productId;
  if (!input.productSlug) return null;

  if (shouldUseCatalogFixtures()) {
    return getFixtureCatalogProductBySlug(input.productSlug)?.slug ?? null;
  }

  const product = await db.product.findUnique({
    where: { slug: input.productSlug },
    select: { id: true },
  });

  return product?.id ?? null;
}

function isPublicBehaviorEvent(type: AnalyticsEventType) {
  return publicBehaviorEventTypes.has(type);
}

function shouldCreateAttributionTouchpoint(input: ParsedAnalyticsEventInput) {
  return (
    (isPublicBehaviorEvent(input.type) ||
      attributionEventTypes.has(input.type)) &&
    (Boolean(input.path) ||
      Boolean(input.referrer) ||
      Boolean(input.utm && Object.keys(input.utm).length > 0) ||
      Boolean(input.attribution && Object.keys(input.attribution).length > 0) ||
      Boolean(input.orderId))
  );
}

function redactJsonValue(
  value: Prisma.JsonValue,
  depth: number,
): Prisma.JsonValue {
  if (depth > 6) return "[redacted:max-depth]";

  if (Array.isArray(value)) {
    return value.slice(0, 50).map((item) => redactJsonValue(item, depth + 1));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !sensitivePayloadKeyPattern.test(key))
        .map(([key, nestedValue]) => [
          key,
          redactJsonValue(nestedValue as Prisma.JsonValue, depth + 1),
        ]),
    );
  }

  if (typeof value === "string") {
    if (sensitiveStringPattern.test(value)) return "[redacted]";

    return value.slice(0, 2_000);
  }

  return value;
}

export function toNullableJsonInput(value: Prisma.JsonValue | undefined) {
  if (typeof value === "undefined") return undefined;

  return value === null ? Prisma.JsonNull : (value as Prisma.InputJsonValue);
}

type NormalizedAttribution = {
  source: string;
  medium: string;
  campaign: string;
};

function normalizeAttribution(input: {
  utm?: Prisma.JsonValue;
  attribution?: Prisma.JsonValue;
  referrer?: string | null;
}): NormalizedAttribution {
  const utm = asStringRecord(input.utm);
  const attribution = asStringRecord(input.attribution);
  const referrerHost = getReferrerHost(input.referrer);
  const source = attribution.source ?? utm.source ?? referrerHost ?? "direct";
  const medium =
    attribution.medium ?? utm.medium ?? (referrerHost ? "referral" : "none");
  const campaign = attribution.campaign ?? utm.campaign ?? "(not set)";

  return {
    source: source.slice(0, 120),
    medium: medium.slice(0, 120),
    campaign: campaign.slice(0, 180),
  };
}

function asStringRecord(
  value: Prisma.JsonValue | undefined,
): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  const result: Record<string, string> = {};
  const record = value as Record<string, Prisma.JsonValue>;

  for (const [key, nestedValue] of Object.entries(record)) {
    if (typeof nestedValue !== "string") continue;

    const trimmed = nestedValue.trim();

    if (trimmed) result[key] = trimmed;
  }

  return result;
}

function getReferrerHost(referrer?: string | null) {
  if (!referrer) return null;

  try {
    return new URL(referrer).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function serializeTouchpoint(
  touchpoint: {
    id: string;
    occurredAt: Date;
    type: string;
    source: string | null;
    medium: string | null;
    campaign: string | null;
    referrer: string | null;
    landingPath: string | null;
  } | null,
): Prisma.JsonValue {
  if (!touchpoint) return null;

  return {
    id: touchpoint.id,
    occurredAt: touchpoint.occurredAt.toISOString(),
    type: touchpoint.type,
    source: touchpoint.source,
    medium: touchpoint.medium,
    campaign: touchpoint.campaign,
    referrer: touchpoint.referrer,
    landingPath: touchpoint.landingPath,
  };
}

function extractRevenue(value: Prisma.JsonValue | undefined) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return 0;

  const record = value as Record<string, unknown>;

  for (const key of ["revenue", "amount", "total"]) {
    const nestedValue = record[key];

    if (typeof nestedValue === "number" && Number.isFinite(nestedValue)) {
      return nestedValue;
    }
  }

  return 0;
}

function createOrderAttributionLookup(
  orderId: string,
  identity: { visitorId: string | null; sessionId: string | null },
): Prisma.AttributionTouchpointWhereInput[] {
  const filters: Prisma.AttributionTouchpointWhereInput[] = [{ orderId }];

  if (identity.sessionId) filters.push({ sessionId: identity.sessionId });
  if (identity.visitorId) filters.push({ visitorId: identity.visitorId });

  return filters;
}

function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

export function isAnalyticsDatabaseUnavailableError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    ["P2021", "P2022"].includes(error.code)
  );
}
