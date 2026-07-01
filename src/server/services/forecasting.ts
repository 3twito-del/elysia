import { db } from "~/server/db";

/**
 * Revenue forecasting (BI-004): projects a daily revenue series forward using a
 * least-squares linear trend, with a moving-average baseline. All the maths are
 * pure + unit-tested; the series is built from paid orders.
 */

export type SeriesPoint = { label: string; value: number };

/** Simple moving average of the last `window` values. Pure. */
export function movingAverage(values: number[], window: number): number {
  if (values.length === 0 || window <= 0) return 0;
  const slice = values.slice(-window);
  return slice.reduce((sum, v) => sum + v, 0) / slice.length;
}

/**
 * Least-squares linear trend over x = 0..n-1. Returns slope + intercept.
 * A single point has zero slope; empty input is flat at zero. Pure.
 */
export function linearTrend(values: number[]): {
  slope: number;
  intercept: number;
} {
  const n = values.length;
  if (n === 0) return { slope: 0, intercept: 0 };
  if (n === 1) return { slope: 0, intercept: values[0]! };

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  for (let i = 0; i < n; i += 1) {
    sumX += i;
    sumY += values[i]!;
    sumXY += i * values[i]!;
    sumXX += i * i;
  }
  const denominator = n * sumXX - sumX * sumX;
  if (denominator === 0) return { slope: 0, intercept: sumY / n };

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

/**
 * Projects `horizon` future points from the linear trend of `values`, clamped at
 * zero and rounded. Returns an array of length `horizon`. Pure.
 */
export function forecastNext(values: number[], horizon: number): number[] {
  const steps = Math.max(0, Math.trunc(horizon));
  if (steps === 0) return [];
  const { slope, intercept } = linearTrend(values);
  const n = values.length;
  const out: number[] = [];
  for (let i = 0; i < steps; i += 1) {
    const projected = intercept + slope * (n + i);
    out.push(Math.max(0, Math.round(projected)));
  }
  return out;
}

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Builds the daily paid-order revenue series for a window (oldest → newest). */
async function getDailyRevenueSeries(days: number): Promise<SeriesPoint[]> {
  const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const orders = await db.order.findMany({
    where: {
      paidAt: { gte: from },
      status: {
        in: ["PAID", "PREPARING", "READY_FOR_PICKUP", "SHIPPED", "COMPLETED"],
      },
    },
    select: { paidAt: true, total: true },
  });

  const byDay = new Map<string, number>();
  for (const order of orders) {
    if (!order.paidAt) continue;
    const key = dayKey(order.paidAt);
    byDay.set(key, Math.round((byDay.get(key) ?? 0) + Number(order.total)));
  }

  return [...byDay.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

/** Historical daily revenue plus a forward forecast over `horizon` days. */
export async function getRevenueForecast(
  input: { days?: number; horizon?: number } = {},
) {
  const days = input.days ?? 30;
  const horizon = input.horizon ?? 7;

  const series = await getDailyRevenueSeries(days);
  const values = series.map((point) => point.value);
  const projected = forecastNext(values, horizon);

  const lastLabel = series.at(-1)?.label ?? dayKey(new Date());
  const lastDate = new Date(`${lastLabel}T00:00:00.000Z`);
  const forecast: SeriesPoint[] = projected.map((value, index) => {
    const date = new Date(lastDate.getTime() + (index + 1) * 24 * 60 * 60 * 1000);
    return { label: dayKey(date), value };
  });

  const { slope } = linearTrend(values);
  return {
    series,
    forecast,
    trendSlope: Math.round(slope),
    baseline: Math.round(movingAverage(values, 7)),
    projectedTotal: projected.reduce((sum, v) => sum + v, 0),
  };
}
