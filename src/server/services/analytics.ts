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
  "product_view",
  "product_click",
  "search_performed",
]);

const sensitivePayloadKeyPattern =
  /(email|e-mail|mail|phone|mobile|tel|address|street|city|postal|zip|token|secret|password|authorization|cookie|raw|payload|card|cvv|cc|iban)/i;

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
  sessionKey: z.string().trim().min(8).max(256).optional(),
  sessionKeyHash: z.string().trim().min(16).max(128).optional(),
  customerId: z.string().trim().min(1).max(128).optional(),
  orderId: z.string().trim().min(1).max(128).optional(),
  productId: z.string().trim().min(1).max(128).optional(),
  productSlug: z.string().trim().min(1).max(180).optional(),
  path: z.string().trim().max(512).optional(),
  referrer: z.string().trim().max(512).optional(),
  utm: z.record(z.string().max(64), analyticsJsonSchema).optional(),
  device: z.record(z.string().max(64), analyticsJsonSchema).optional(),
  consentMode: z.enum(analyticsConsentModes).default("business"),
  payload: analyticsJsonSchema.optional(),
  idempotencyKey: z.string().trim().min(8).max(256).optional(),
});

export const analyticsBatchInputSchema = z.object({
  events: z.array(analyticsEventInputSchema).min(1).max(25),
});

export type AnalyticsEventInput = z.infer<typeof analyticsEventInputSchema>;

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
        | "missing_consent"
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

  if (
    isPublicBehaviorEvent(parsed.type) &&
    parsed.consentMode !== "measurement"
  ) {
    return { status: "skipped", eventId: null, reason: "missing_consent" };
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

  const data: Prisma.AnalyticsEventCreateInput = {
    type: parsed.type,
    occurredAt: parsed.occurredAt ?? new Date(),
    sessionKeyHash:
      parsed.sessionKeyHash ??
      (parsed.sessionKey ? hashAnalyticsIdentifier(parsed.sessionKey) : null),
    customer: parsed.customerId
      ? { connect: { id: parsed.customerId } }
      : undefined,
    order: parsed.orderId ? { connect: { id: parsed.orderId } } : undefined,
    product: productId ? { connect: { id: productId } } : undefined,
    path: parsed.path,
    referrer: parsed.referrer,
    utm: toNullableJsonInput(parsed.utm),
    device: toNullableJsonInput(parsed.device),
    consentMode: parsed.consentMode,
    payload: toNullableJsonInput(redactAnalyticsPayload(parsed.payload)),
    idempotencyKey: parsed.idempotencyKey
      ? hashAnalyticsIdentifier(parsed.idempotencyKey)
      : undefined,
  };

  try {
    const event = await db.analyticsEvent.create({
      data,
      select: { id: true },
    });
    await enqueueAnalyticsRollupSafely(parsed.occurredAt ?? new Date());

    return { status: "accepted", eventId: event.id };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { status: "duplicate", eventId: null };
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

  if (typeof value === "string") return value.slice(0, 2_000);

  return value;
}

function toNullableJsonInput(value: Prisma.JsonValue | undefined) {
  if (typeof value === "undefined") return undefined;

  return value === null ? Prisma.JsonNull : (value as Prisma.InputJsonValue);
}

function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}
