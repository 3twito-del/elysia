import { db } from "~/server/db";
import { startOfUtcDay } from "~/server/services/analytics-rollups";

export async function getAdminInsightsOverview(
  input: {
    rangeDays?: number;
  } = {},
) {
  const rangeDays = input.rangeDays ?? 30;
  const to = startOfUtcDay(new Date());
  const exclusiveTo = new Date(to);
  exclusiveTo.setUTCDate(exclusiveTo.getUTCDate() + 1);
  const from = new Date(exclusiveTo);
  from.setUTCDate(from.getUTCDate() - rangeDays);

  const [
    aggregates,
    funnel,
    productMetrics,
    rawFallback,
    searches,
    pathEvents,
  ] = await Promise.all([
    db.analyticsDailyAggregate.findMany({
      where: { date: { gte: from, lt: exclusiveTo }, scope: "site" },
      orderBy: { date: "asc" },
    }),
    db.funnelDailyMetric.findMany({
      where: { date: { gte: from, lt: exclusiveTo } },
    }),
    db.productDailyMetric.findMany({
      where: { date: { gte: from, lt: exclusiveTo } },
      orderBy: [{ revenue: "desc" }, { views: "desc" }],
      take: 20,
      include: { product: true },
    }),
    db.analyticsEvent.groupBy({
      by: ["type"],
      where: { occurredAt: { gte: from, lt: exclusiveTo } },
      _count: { _all: true },
    }),
    db.searchEvent.groupBy({
      by: ["query", "resultCount"],
      where: { createdAt: { gte: from, lt: exclusiveTo } },
      _count: { _all: true },
      orderBy: { _count: { query: "desc" } },
      take: 20,
    }),
    db.analyticsEvent.findMany({
      where: {
        occurredAt: { gte: from, lt: exclusiveTo },
      },
      select: { path: true, utm: true },
      take: 1_000,
    }),
  ]);

  const metricTotals = aggregateMetricTotals(aggregates, rawFallback);
  const orderCount = metricTotals.order_created.count;
  const revenue = metricTotals.order_created.amount;
  const pageViews = metricTotals.page_view.count;
  const conversionRate = pageViews > 0 ? orderCount / pageViews : 0;
  const averageOrderValue = orderCount > 0 ? revenue / orderCount : 0;

  return {
    range: { from, to: exclusiveTo, days: rangeDays },
    kpis: {
      pageViews,
      productViews: metricTotals.product_view.count,
      addToCart: metricTotals.add_to_cart.count,
      checkouts: metricTotals.checkout_started.count,
      orders: orderCount,
      revenue,
      averageOrderValue,
      conversionRate,
      capturedPayments: metricTotals.payment_captured.amount,
    },
    funnel: aggregateFunnel(funnel, metricTotals),
    topProducts: aggregateProductMetrics(productMetrics),
    searches: {
      top: searches
        .filter((search) => search.resultCount > 0)
        .map((search) => ({
          query: search.query,
          resultCount: search.resultCount,
          count: search._count._all,
        }))
        .slice(0, 10),
      noResult: searches
        .filter((search) => search.resultCount === 0)
        .map((search) => ({
          query: search.query,
          count: search._count._all,
        }))
        .slice(0, 10),
    },
    paths: aggregatePaths(pathEvents),
    utmChannels: aggregateUtmChannels(pathEvents),
    freshness: { generatedAt: new Date(), source: "aggregate-tables" as const },
  };
}

const fallbackMetricKeys = [
  "page_view",
  "product_view",
  "product_click",
  "search_performed",
  "wishlist_add",
  "add_to_cart",
  "checkout_started",
  "order_created",
  "payment_captured",
] as const;

function aggregateMetricTotals(
  aggregates: Array<{ metric: string; count: number; amount: unknown }>,
  rawFallback: Array<{ type: string; _count: { _all: number } }>,
) {
  const totals = Object.fromEntries(
    fallbackMetricKeys.map((key) => [key, { count: 0, amount: 0 }]),
  ) as Record<
    (typeof fallbackMetricKeys)[number],
    { count: number; amount: number }
  >;

  if (aggregates.length > 0) {
    for (const aggregate of aggregates) {
      if (aggregate.metric in totals) {
        totals[aggregate.metric as keyof typeof totals].count +=
          aggregate.count;
        totals[aggregate.metric as keyof typeof totals].amount += Number(
          aggregate.amount,
        );
      }
    }

    return totals;
  }

  for (const raw of rawFallback) {
    if (raw.type in totals) {
      totals[raw.type as keyof typeof totals].count += raw._count._all;
    }
  }

  return totals;
}

function aggregateFunnel(
  funnel: Array<{ step: string; count: number; revenue: unknown }>,
  metricTotals: Record<string, { count: number; amount: number }>,
) {
  const steps = [
    "page_view",
    "product_view",
    "add_to_cart",
    "checkout_started",
    "order_created",
    "payment_captured",
  ];

  return steps.map((step) => {
    const aggregate = funnel.filter((item) => item.step === step);
    const count =
      aggregate.length > 0
        ? aggregate.reduce((sum, item) => sum + item.count, 0)
        : (metricTotals[step]?.count ?? 0);
    const revenue =
      aggregate.length > 0
        ? aggregate.reduce((sum, item) => sum + Number(item.revenue), 0)
        : (metricTotals[step]?.amount ?? 0);

    return { step, count, revenue };
  });
}

function aggregateProductMetrics(
  metrics: Array<{
    productId: string;
    views: number;
    clicks: number;
    addToCart: number;
    checkoutStarts: number;
    orders: number;
    revenue: unknown;
    product: { name: string; slug: string; sku: string };
  }>,
) {
  const byProduct = new Map<
    string,
    {
      productId: string;
      name: string;
      slug: string;
      sku: string;
      views: number;
      clicks: number;
      addToCart: number;
      checkoutStarts: number;
      orders: number;
      revenue: number;
    }
  >();

  for (const metric of metrics) {
    const existing = byProduct.get(metric.productId) ?? {
      productId: metric.productId,
      name: metric.product.name,
      slug: metric.product.slug,
      sku: metric.product.sku,
      views: 0,
      clicks: 0,
      addToCart: 0,
      checkoutStarts: 0,
      orders: 0,
      revenue: 0,
    };

    existing.views += metric.views;
    existing.clicks += metric.clicks;
    existing.addToCart += metric.addToCart;
    existing.checkoutStarts += metric.checkoutStarts;
    existing.orders += metric.orders;
    existing.revenue += Number(metric.revenue);
    byProduct.set(metric.productId, existing);
  }

  return Array.from(byProduct.values())
    .sort(
      (first, second) =>
        second.revenue - first.revenue || second.views - first.views,
    )
    .slice(0, 10);
}

function aggregatePaths(events: Array<{ path: string | null }>) {
  const counts = new Map<string, number>();

  for (const event of events) {
    if (!event.path) continue;

    counts.set(event.path, (counts.get(event.path) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([path, count]) => ({ path, count }))
    .sort((first, second) => second.count - first.count)
    .slice(0, 10);
}

function aggregateUtmChannels(events: Array<{ utm: unknown }>) {
  const counts = new Map<string, number>();

  for (const event of events) {
    const utm =
      event.utm && typeof event.utm === "object" && !Array.isArray(event.utm)
        ? (event.utm as Record<string, unknown>)
        : {};
    const source =
      typeof utm.source === "string" && utm.source.trim()
        ? utm.source
        : "direct";
    const medium =
      typeof utm.medium === "string" && utm.medium.trim() ? utm.medium : "none";
    const channel = `${source} / ${medium}`;

    counts.set(channel, (counts.get(channel) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([channel, count]) => ({ channel, count }))
    .sort((first, second) => second.count - first.count)
    .slice(0, 10);
}
