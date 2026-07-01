import { db } from "~/server/db";

/**
 * Anomaly detection (BI-004): flags spikes/drops in a metric time series using a
 * z-score threshold. The statistics are pure + unit-tested; the revenue series is
 * built from paid orders.
 */

export type SeriesPoint = { label: string; value: number };

/** Arithmetic mean. Pure. */
export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/** Population standard deviation. Pure. */
export function stdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const m = mean(values);
  const variance = mean(values.map((v) => (v - m) ** 2));
  return Math.sqrt(variance);
}

export type Anomaly = {
  label: string;
  value: number;
  z: number;
  direction: "SPIKE" | "DROP";
};

/** Points whose z-score exceeds the threshold. Pure. */
export function detectAnomalies(
  series: SeriesPoint[],
  zThreshold = 2,
): Anomaly[] {
  const values = series.map((point) => point.value);
  const m = mean(values);
  const sd = stdDev(values);
  if (sd === 0) return [];
  return series
    .map((point) => {
      const z = Math.round(((point.value - m) / sd) * 100) / 100;
      return {
        label: point.label,
        value: point.value,
        z,
        direction: z >= 0 ? ("SPIKE" as const) : ("DROP" as const),
      };
    })
    .filter((point) => Math.abs(point.z) >= zThreshold);
}

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Daily paid-order revenue series + detected anomalies for a window. */
export async function getRevenueAnomalies(input: { days?: number; zThreshold?: number } = {}) {
  const days = input.days ?? 30;
  const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const orders = await db.order.findMany({
    where: {
      paidAt: { gte: from },
      status: { in: ["PAID", "PREPARING", "READY_FOR_PICKUP", "SHIPPED", "COMPLETED"] },
    },
    select: { paidAt: true, total: true },
  });

  const byDay = new Map<string, number>();
  for (const order of orders) {
    if (!order.paidAt) continue;
    const key = dayKey(order.paidAt);
    byDay.set(key, Math.round((byDay.get(key) ?? 0) + Number(order.total)));
  }

  const series: SeriesPoint[] = [...byDay.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const anomalies = detectAnomalies(series, input.zThreshold ?? 2);
  return { series, anomalies, average: Math.round(mean(series.map((p) => p.value))) };
}
