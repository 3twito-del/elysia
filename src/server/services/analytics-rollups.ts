import type { Prisma } from "@prisma/client";

import { env } from "~/env";
import { db } from "~/server/db";
import {
  analyticsEventTypes,
  isAnalyticsRollupsEnabled,
  type AnalyticsEventType,
} from "~/server/services/analytics";

const funnelSteps: AnalyticsEventType[] = [
  "page_view",
  "product_view",
  "add_to_cart",
  "checkout_started",
  "order_created",
  "payment_captured",
];

export type AnalyticsRollupResult = {
  date: Date;
  skipped: boolean;
  aggregates: number;
  funnelSteps: number;
  products: number;
  hourlyAggregates: number;
  pages: number;
  campaigns: number;
  biSnapshots: number;
};

export async function rollupAnalyticsDaily(
  input: { date?: Date } = {},
): Promise<AnalyticsRollupResult> {
  const date = startOfUtcDay(input.date ?? new Date());
  const nextDate = addDays(date, 1);

  if (!isAnalyticsRollupsEnabled() || !env.DATABASE_URL) {
    return {
      date,
      skipped: true,
      aggregates: 0,
      funnelSteps: 0,
      products: 0,
      hourlyAggregates: 0,
      pages: 0,
      campaigns: 0,
      biSnapshots: 0,
    };
  }

  const [
    eventCounts,
    orderRevenue,
    paymentRevenue,
    productEvents,
    orderItems,
    rawEvents,
    sessions,
    orderAttributions,
  ] = await Promise.all([
    db.analyticsEvent.groupBy({
      by: ["type"],
      where: { occurredAt: { gte: date, lt: nextDate } },
      _count: { _all: true },
    }),
    db.order.aggregate({
      where: {
        createdAt: { gte: date, lt: nextDate },
        status: { notIn: ["CANCELLED", "REFUNDED"] },
      },
      _sum: { total: true },
      _count: { _all: true },
    }),
    db.payment.aggregate({
      where: {
        capturedAt: { gte: date, lt: nextDate },
        status: "CAPTURED",
      },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    db.analyticsEvent.groupBy({
      by: ["productId", "type"],
      where: {
        occurredAt: { gte: date, lt: nextDate },
        productId: { not: null },
      },
      _count: { _all: true },
    }),
    db.orderItem.findMany({
      where: {
        order: {
          createdAt: { gte: date, lt: nextDate },
          status: { notIn: ["CANCELLED", "REFUNDED"] },
        },
      },
      include: { variant: { select: { productId: true } } },
    }),
    db.analyticsEvent.findMany({
      where: { occurredAt: { gte: date, lt: nextDate } },
      select: {
        type: true,
        occurredAt: true,
        path: true,
        title: true,
        visitorId: true,
        sessionId: true,
        sessionKeyHash: true,
        utm: true,
        payload: true,
      },
    }),
    db.analyticsSession.findMany({
      where: {
        OR: [
          { startedAt: { gte: date, lt: nextDate } },
          { lastSeenAt: { gte: date, lt: nextDate } },
        ],
      },
      select: {
        id: true,
        visitorId: true,
        sessionKeyHash: true,
        entryPath: true,
        exitPath: true,
        utm: true,
      },
    }),
    db.orderAttribution.findMany({
      where: {
        order: {
          createdAt: { gte: date, lt: nextDate },
          status: { notIn: ["CANCELLED", "REFUNDED"] },
        },
      },
      select: {
        source: true,
        medium: true,
        campaign: true,
        revenue: true,
        grossMargin: true,
      },
    }),
  ]);

  const eventCountByType = new Map(
    eventCounts.map((count) => [
      count.type as AnalyticsEventType,
      count._count._all,
    ]),
  );
  const aggregateInputs = analyticsEventTypes.map((eventType) => ({
    metric: eventType,
    count: eventCountByType.get(eventType) ?? 0,
    amount:
      eventType === "order_created"
        ? toNumber(orderRevenue._sum.total)
        : eventType === "payment_captured"
          ? toNumber(paymentRevenue._sum.amount)
          : 0,
  }));

  await Promise.all(
    aggregateInputs.map((aggregate) =>
      db.analyticsDailyAggregate.upsert({
        where: {
          date_metric_scope: {
            date,
            metric: aggregate.metric,
            scope: "site",
          },
        },
        create: {
          date,
          metric: aggregate.metric,
          scope: "site",
          count: aggregate.count,
          amount: aggregate.amount,
          metadata: {
            source: "analytics_daily_rollup",
            generatedAt: new Date().toISOString(),
          },
        },
        update: {
          count: aggregate.count,
          amount: aggregate.amount,
          metadata: {
            source: "analytics_daily_rollup",
            generatedAt: new Date().toISOString(),
          },
        },
      }),
    ),
  );

  await Promise.all(
    funnelSteps.map((step) =>
      db.funnelDailyMetric.upsert({
        where: { date_step: { date, step } },
        create: {
          date,
          step,
          count:
            step === "order_created"
              ? orderRevenue._count._all
              : step === "payment_captured"
                ? paymentRevenue._count._all
                : (eventCountByType.get(step) ?? 0),
          revenue:
            step === "order_created"
              ? toNumber(orderRevenue._sum.total)
              : step === "payment_captured"
                ? toNumber(paymentRevenue._sum.amount)
                : 0,
          metadata: { source: "analytics_daily_rollup" },
        },
        update: {
          count:
            step === "order_created"
              ? orderRevenue._count._all
              : step === "payment_captured"
                ? paymentRevenue._count._all
                : (eventCountByType.get(step) ?? 0),
          revenue:
            step === "order_created"
              ? toNumber(orderRevenue._sum.total)
              : step === "payment_captured"
                ? toNumber(paymentRevenue._sum.amount)
                : 0,
          metadata: { source: "analytics_daily_rollup" },
        },
      }),
    ),
  );

  const productMetrics = createProductMetricMap(productEvents, orderItems);

  await Promise.all(
    Array.from(productMetrics.values()).map((metric) =>
      db.productDailyMetric.upsert({
        where: { date_productId: { date, productId: metric.productId } },
        create: { date, ...metric },
        update: metric,
      }),
    ),
  );

  const hourlyMetrics = createHourlyMetricMap(rawEvents);
  const pageMetrics = createPageMetricMap(rawEvents, sessions);
  const campaignMetrics = createCampaignMetricMap(
    rawEvents,
    sessions,
    orderAttributions,
  );
  const biSnapshots = createBiKpiSnapshots({
    date,
    nextDate,
    metricTotals: eventCountByType,
    orderCount: orderRevenue._count._all,
    revenue: toNumber(orderRevenue._sum.total),
    paymentRevenue: toNumber(paymentRevenue._sum.amount),
  });

  await Promise.all(
    Array.from(hourlyMetrics.values()).map((metric) =>
      db.analyticsHourlyAggregate.upsert({
        where: {
          hour_metric_scope: {
            hour: metric.hour,
            metric: metric.metric,
            scope: metric.scope,
          },
        },
        create: metric,
        update: {
          count: metric.count,
          amount: metric.amount,
          metadata: metric.metadata,
        },
      }),
    ),
  );

  await Promise.all(
    Array.from(pageMetrics.values()).map((metric) =>
      db.pageDailyMetric.upsert({
        where: { date_path: { date, path: metric.path } },
        create: { date, ...metric },
        update: metric,
      }),
    ),
  );

  await Promise.all(
    Array.from(campaignMetrics.values()).map((metric) =>
      db.campaignDailyMetric.upsert({
        where: {
          date_source_medium_campaign: {
            date,
            source: metric.source,
            medium: metric.medium,
            campaign: metric.campaign,
          },
        },
        create: { date, ...metric },
        update: metric,
      }),
    ),
  );

  await Promise.all(
    biSnapshots.map((snapshot) =>
      db.bIKpiSnapshot.upsert({
        where: {
          granularity_periodStart_periodEnd_metric: {
            granularity: snapshot.granularity,
            periodStart: snapshot.periodStart,
            periodEnd: snapshot.periodEnd,
            metric: snapshot.metric,
          },
        },
        create: snapshot,
        update: {
          count: snapshot.count,
          value: snapshot.value,
          metadata: snapshot.metadata,
        },
      }),
    ),
  );

  return {
    date,
    skipped: false,
    aggregates: aggregateInputs.length,
    funnelSteps: funnelSteps.length,
    products: productMetrics.size,
    hourlyAggregates: hourlyMetrics.size,
    pages: pageMetrics.size,
    campaigns: campaignMetrics.size,
    biSnapshots: biSnapshots.length,
  };
}

export function startOfUtcDay(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);

  return next;
}

function createProductMetricMap(
  productEvents: Array<{
    productId: string | null;
    type: string;
    _count: { _all: number };
  }>,
  orderItems: Array<{
    quantity: number;
    unitPrice: Prisma.Decimal;
    variant: { productId: string };
  }>,
) {
  const metrics = new Map<
    string,
    {
      productId: string;
      views: number;
      clicks: number;
      addToCart: number;
      checkoutStarts: number;
      orders: number;
      revenue: number;
    }
  >();

  for (const event of productEvents) {
    if (!event.productId) continue;

    const metric = getOrCreateProductMetric(metrics, event.productId);
    const count = event._count._all;

    if (event.type === "product_view") metric.views += count;
    if (event.type === "product_click") metric.clicks += count;
    if (event.type === "add_to_cart") metric.addToCart += count;
    if (event.type === "checkout_started") metric.checkoutStarts += count;
    if (event.type === "order_created") metric.orders += count;
  }

  for (const item of orderItems) {
    const metric = getOrCreateProductMetric(metrics, item.variant.productId);

    metric.orders += item.quantity;
    metric.revenue += item.quantity * Number(item.unitPrice);
  }

  return metrics;
}

function getOrCreateProductMetric(
  metrics: Map<
    string,
    {
      productId: string;
      views: number;
      clicks: number;
      addToCart: number;
      checkoutStarts: number;
      orders: number;
      revenue: number;
    }
  >,
  productId: string,
) {
  const existing = metrics.get(productId);

  if (existing) return existing;

  const metric = {
    productId,
    views: 0,
    clicks: 0,
    addToCart: 0,
    checkoutStarts: 0,
    orders: 0,
    revenue: 0,
  };

  metrics.set(productId, metric);

  return metric;
}

function createHourlyMetricMap(
  events: Array<{
    type: string;
    occurredAt: Date;
  }>,
) {
  const metrics = new Map<
    string,
    {
      hour: Date;
      metric: string;
      scope: string;
      count: number;
      amount: number;
      metadata: Prisma.InputJsonValue;
    }
  >();

  for (const event of events) {
    const hour = startOfUtcHour(event.occurredAt);
    const key = `${hour.toISOString()}:${event.type}:site`;
    const metric = metrics.get(key) ?? {
      hour,
      metric: event.type,
      scope: "site",
      count: 0,
      amount: 0,
      metadata: {
        source: "analytics_hourly_rollup",
        generatedAt: new Date().toISOString(),
      },
    };

    metric.count += 1;
    metrics.set(key, metric);
  }

  return metrics;
}

function createPageMetricMap(
  events: Array<{
    type: string;
    path: string | null;
    title: string | null;
    visitorId: string | null;
    sessionId: string | null;
    sessionKeyHash: string | null;
    payload: Prisma.JsonValue | null;
  }>,
  sessions: Array<{
    id: string;
    visitorId: string | null;
    sessionKeyHash: string;
    entryPath: string | null;
    exitPath: string | null;
  }>,
) {
  const metrics = new Map<
    string,
    {
      path: string;
      title?: string;
      views: number;
      visitors: number;
      sessions: number;
      entrances: number;
      exits: number;
      ctaClicks: number;
      formErrors: number;
      avgScrollDepth: number;
      revenue: number;
    } & {
      visitorKeys: Set<string>;
      sessionKeys: Set<string>;
      scrollDepths: number[];
    }
  >();

  for (const event of events) {
    if (!event.path) continue;

    const metric = getOrCreatePageMetric(metrics, event.path);

    if (!metric.title && event.title) metric.title = event.title;
    if (event.type === "page_view" || event.type === "route_change") {
      metric.views += 1;
    }
    if (event.type === "cta_click") metric.ctaClicks += 1;
    if (event.type === "form_error") metric.formErrors += 1;

    const visitorKey = event.visitorId ?? event.sessionKeyHash;
    const sessionKey = event.sessionId ?? event.sessionKeyHash;

    if (visitorKey) metric.visitorKeys.add(visitorKey);
    if (sessionKey) metric.sessionKeys.add(sessionKey);

    if (event.type === "scroll_depth") {
      const depth = extractNumericPayloadValue(event.payload, "depth");

      if (depth !== null) metric.scrollDepths.push(depth);
    }
  }

  for (const session of sessions) {
    if (session.entryPath) {
      getOrCreatePageMetric(metrics, session.entryPath).entrances += 1;
    }
    if (session.exitPath) {
      getOrCreatePageMetric(metrics, session.exitPath).exits += 1;
    }
  }

  for (const metric of metrics.values()) {
    metric.visitors = metric.visitorKeys.size;
    metric.sessions = metric.sessionKeys.size;
    metric.avgScrollDepth =
      metric.scrollDepths.length > 0
        ? metric.scrollDepths.reduce((sum, depth) => sum + depth, 0) /
          metric.scrollDepths.length
        : 0;
  }

  return new Map(
    Array.from(metrics.entries()).map(([key, metric]) => [
      key,
      {
        path: metric.path,
        title: metric.title,
        views: metric.views,
        visitors: metric.visitors,
        sessions: metric.sessions,
        entrances: metric.entrances,
        exits: metric.exits,
        ctaClicks: metric.ctaClicks,
        formErrors: metric.formErrors,
        avgScrollDepth: metric.avgScrollDepth,
        revenue: metric.revenue,
      },
    ]),
  );
}

function createCampaignMetricMap(
  events: Array<{
    type: string;
    visitorId: string | null;
    sessionId: string | null;
    sessionKeyHash: string | null;
    utm: Prisma.JsonValue | null;
  }>,
  sessions: Array<{
    id: string;
    visitorId: string | null;
    sessionKeyHash: string;
    utm: Prisma.JsonValue | null;
  }>,
  orderAttributions: Array<{
    source: string | null;
    medium: string | null;
    campaign: string | null;
    revenue: Prisma.Decimal;
    grossMargin: Prisma.Decimal | null;
  }>,
) {
  const metrics = new Map<
    string,
    {
      source: string;
      medium: string;
      campaign: string;
      channel: string;
      visitors: number;
      sessions: number;
      orders: number;
      revenue: number;
      grossMargin: number;
      visitorKeys: Set<string>;
      sessionKeys: Set<string>;
    }
  >();

  for (const event of events) {
    const attribution = normalizeUtm(event.utm);
    const metric = getOrCreateCampaignMetric(metrics, attribution);
    const visitorKey = event.visitorId ?? event.sessionKeyHash;
    const sessionKey = event.sessionId ?? event.sessionKeyHash;

    if (visitorKey) metric.visitorKeys.add(visitorKey);
    if (sessionKey) metric.sessionKeys.add(sessionKey);
  }

  for (const session of sessions) {
    const attribution = normalizeUtm(session.utm);
    const metric = getOrCreateCampaignMetric(metrics, attribution);

    if (session.visitorId) metric.visitorKeys.add(session.visitorId);
    metric.sessionKeys.add(session.id);
  }

  for (const order of orderAttributions) {
    const metric = getOrCreateCampaignMetric(metrics, {
      source: order.source ?? "direct",
      medium: order.medium ?? "none",
      campaign: order.campaign ?? "(not set)",
    });

    metric.orders += 1;
    metric.revenue += Number(order.revenue);
    metric.grossMargin += order.grossMargin ? Number(order.grossMargin) : 0;
  }

  for (const metric of metrics.values()) {
    metric.visitors = metric.visitorKeys.size;
    metric.sessions = metric.sessionKeys.size;
  }

  return new Map(
    Array.from(metrics.entries()).map(([key, metric]) => [
      key,
      {
        source: metric.source,
        medium: metric.medium,
        campaign: metric.campaign,
        channel: metric.channel,
        visitors: metric.visitors,
        sessions: metric.sessions,
        orders: metric.orders,
        revenue: metric.revenue,
        grossMargin: metric.grossMargin,
      },
    ]),
  );
}

function createBiKpiSnapshots(input: {
  date: Date;
  nextDate: Date;
  metricTotals: Map<AnalyticsEventType, number>;
  orderCount: number;
  revenue: number;
  paymentRevenue: number;
}) {
  const pageViews = input.metricTotals.get("page_view") ?? 0;
  const conversionRate = pageViews > 0 ? input.orderCount / pageViews : 0;

  return [
    {
      granularity: "daily",
      periodStart: input.date,
      periodEnd: input.nextDate,
      metric: "page_views",
      count: pageViews,
      value: pageViews,
      metadata: { source: "analytics_bi_rollup" },
    },
    {
      granularity: "daily",
      periodStart: input.date,
      periodEnd: input.nextDate,
      metric: "orders",
      count: input.orderCount,
      value: input.orderCount,
      metadata: { source: "analytics_bi_rollup" },
    },
    {
      granularity: "daily",
      periodStart: input.date,
      periodEnd: input.nextDate,
      metric: "revenue",
      count: input.orderCount,
      value: input.revenue,
      metadata: { source: "analytics_bi_rollup" },
    },
    {
      granularity: "daily",
      periodStart: input.date,
      periodEnd: input.nextDate,
      metric: "captured_payment_revenue",
      count: input.metricTotals.get("payment_captured") ?? 0,
      value: input.paymentRevenue,
      metadata: { source: "analytics_bi_rollup" },
    },
    {
      granularity: "daily",
      periodStart: input.date,
      periodEnd: input.nextDate,
      metric: "conversion_rate",
      count: input.orderCount,
      value: conversionRate,
      metadata: { source: "analytics_bi_rollup" },
    },
  ];
}

function getOrCreatePageMetric(
  metrics: Map<
    string,
    {
      path: string;
      title?: string;
      views: number;
      visitors: number;
      sessions: number;
      entrances: number;
      exits: number;
      ctaClicks: number;
      formErrors: number;
      avgScrollDepth: number;
      revenue: number;
      visitorKeys: Set<string>;
      sessionKeys: Set<string>;
      scrollDepths: number[];
    }
  >,
  path: string,
) {
  const existing = metrics.get(path);

  if (existing) return existing;

  const metric = {
    path,
    title: undefined as string | undefined,
    views: 0,
    visitors: 0,
    sessions: 0,
    entrances: 0,
    exits: 0,
    ctaClicks: 0,
    formErrors: 0,
    avgScrollDepth: 0,
    revenue: 0,
    visitorKeys: new Set<string>(),
    sessionKeys: new Set<string>(),
    scrollDepths: [] as number[],
  };

  metrics.set(path, metric);

  return metric;
}

function getOrCreateCampaignMetric(
  metrics: Map<
    string,
    {
      source: string;
      medium: string;
      campaign: string;
      channel: string;
      visitors: number;
      sessions: number;
      orders: number;
      revenue: number;
      grossMargin: number;
      visitorKeys: Set<string>;
      sessionKeys: Set<string>;
    }
  >,
  attribution: { source: string; medium: string; campaign: string },
) {
  const key = `${attribution.source}:${attribution.medium}:${attribution.campaign}`;
  const existing = metrics.get(key);

  if (existing) return existing;

  const metric = {
    ...attribution,
    channel: `${attribution.source} / ${attribution.medium}`,
    visitors: 0,
    sessions: 0,
    orders: 0,
    revenue: 0,
    grossMargin: 0,
    visitorKeys: new Set<string>(),
    sessionKeys: new Set<string>(),
  };

  metrics.set(key, metric);

  return metric;
}

function normalizeUtm(value: Prisma.JsonValue | null) {
  const utm =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  const source =
    typeof utm.source === "string" && utm.source.trim()
      ? utm.source.trim()
      : "direct";
  const medium =
    typeof utm.medium === "string" && utm.medium.trim()
      ? utm.medium.trim()
      : "none";
  const campaign =
    typeof utm.campaign === "string" && utm.campaign.trim()
      ? utm.campaign.trim()
      : "(not set)";

  return {
    source: source.slice(0, 120),
    medium: medium.slice(0, 120),
    campaign: campaign.slice(0, 180),
  };
}

function extractNumericPayloadValue(
  value: Prisma.JsonValue | null,
  key: string,
) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const nestedValue = (value as Record<string, unknown>)[key];

  return typeof nestedValue === "number" && Number.isFinite(nestedValue)
    ? nestedValue
    : null;
}

function startOfUtcHour(date: Date) {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      date.getUTCHours(),
    ),
  );
}

function toNumber(value: Prisma.Decimal | null | undefined) {
  return value ? Number(value) : 0;
}
