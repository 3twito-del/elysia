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
    };
  }

  const [eventCounts, orderRevenue, paymentRevenue, productEvents, orderItems] =
    await Promise.all([
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

  return {
    date,
    skipped: false,
    aggregates: aggregateInputs.length,
    funnelSteps: funnelSteps.length,
    products: productMetrics.size,
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

function toNumber(value: Prisma.Decimal | null | undefined) {
  return value ? Number(value) : 0;
}
