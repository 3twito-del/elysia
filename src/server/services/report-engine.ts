import { toDisplayString } from "~/lib/stringify";
import { evaluateCondition } from "~/server/services/workflow-rules";

/**
 * Pure aggregation engine for the Report Builder (RPT, §4.Q). It groups a flat
 * dataset by chosen dimensions and rolls up measures, optionally filtering rows
 * with the shared workflow rule engine. No DB access here — datasets are loaded
 * by report-datasets.ts and fed in, keeping the whole thing unit-testable.
 */

export type DatasetRow = Record<string, unknown>;

export const AGGREGATIONS = [
  "SUM",
  "COUNT",
  "AVG",
  "MIN",
  "MAX",
  "COUNT_DISTINCT",
] as const;

export type Aggregation = (typeof AGGREGATIONS)[number];

export const MEASURE_FORMATS = ["NUMBER", "CURRENCY", "PERCENT"] as const;
export type MeasureFormat = (typeof MEASURE_FORMATS)[number];

export type Dimension = { key: string; label: string; field: string };
export type Measure = {
  key: string;
  label: string;
  agg: Aggregation;
  field?: string;
  format?: MeasureFormat;
};

export type SortSpec = { by: string; dir: "asc" | "desc" };

export type ReportGroup = {
  key: string;
  dimensions: Record<string, unknown>;
  measures: Record<string, number>;
};

export type ReportResult = {
  dimensions: Dimension[];
  measures: Measure[];
  rows: ReportGroup[];
  totals: Record<string, number>;
  rowCount: number;
};

function toNumber(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Rolls up a single measure over a set of rows. Pure. */
export function aggregateMeasure(rows: DatasetRow[], measure: Measure): number {
  if (measure.agg === "COUNT") return rows.length;

  const field = measure.field;
  if (!field) return 0;

  if (measure.agg === "COUNT_DISTINCT") {
    const seen = new Set<string>();
    for (const row of rows) {
      const value = row[field];
      if (value !== undefined && value !== null) seen.add(toDisplayString(value));
    }
    return seen.size;
  }

  const values = rows.map((row) => toNumber(row[field]));
  if (measure.agg === "MIN") return values.length ? Math.min(...values) : 0;
  if (measure.agg === "MAX") return values.length ? Math.max(...values) : 0;

  const sum = values.reduce((acc, value) => acc + value, 0);
  if (measure.agg === "AVG") return values.length ? round2(sum / values.length) : 0;
  return round2(sum); // SUM
}

function groupKeyOf(row: DatasetRow, dimensions: Dimension[]): string {
  return dimensions
    .map((dimension) => toDisplayString(row[dimension.field]) || "—")
    .join(" │ ");
}

/**
 * Groups rows by dimensions and aggregates each measure per group, plus grand
 * totals over the filtered set. With no dimensions, produces a single total row.
 */
export function aggregateRows(input: {
  rows: DatasetRow[];
  dimensions: Dimension[];
  measures: Measure[];
  filter?: unknown;
  sort?: SortSpec;
}): ReportResult {
  const { dimensions, measures } = input;

  const filtered =
    input.filter == null
      ? input.rows
      : input.rows.filter((row) => evaluateCondition(input.filter, row));

  const buckets = new Map<string, { dims: Record<string, unknown>; rows: DatasetRow[] }>();
  for (const row of filtered) {
    const key = dimensions.length ? groupKeyOf(row, dimensions) : "ALL";
    let bucket = buckets.get(key);
    if (!bucket) {
      const dims: Record<string, unknown> = {};
      for (const dimension of dimensions) dims[dimension.key] = row[dimension.field] ?? "—";
      bucket = { dims, rows: [] };
      buckets.set(key, bucket);
    }
    bucket.rows.push(row);
  }

  let rows: ReportGroup[] = [...buckets.entries()].map(([key, bucket]) => {
    const measureValues: Record<string, number> = {};
    for (const measure of measures) {
      measureValues[measure.key] = aggregateMeasure(bucket.rows, measure);
    }
    return { key, dimensions: bucket.dims, measures: measureValues };
  });

  rows = sortGroups(rows, input.sort, dimensions, measures);

  const totals: Record<string, number> = {};
  for (const measure of measures) {
    totals[measure.key] = aggregateMeasure(filtered, measure);
  }

  return { dimensions, measures, rows, totals, rowCount: filtered.length };
}

function sortGroups(
  rows: ReportGroup[],
  sort: SortSpec | undefined,
  dimensions: Dimension[],
  measures: Measure[],
): ReportGroup[] {
  const measureKeys = new Set(measures.map((measure) => measure.key));
  const dimensionKeys = new Set(dimensions.map((dimension) => dimension.key));

  // Default: by the first measure descending, else by the first dimension.
  const by =
    sort?.by ??
    (measures[0]?.key ?? dimensions[0]?.key ?? "");
  const dir = sort?.dir ?? (measureKeys.has(by) ? "desc" : "asc");
  if (!by) return rows;

  const sorted = [...rows].sort((a, b) => {
    if (measureKeys.has(by)) {
      return (a.measures[by] ?? 0) - (b.measures[by] ?? 0);
    }
    if (dimensionKeys.has(by)) {
      return toDisplayString(a.dimensions[by]).localeCompare(
        toDisplayString(b.dimensions[by]),
        "he",
      );
    }
    return 0;
  });

  return dir === "desc" ? sorted.reverse() : sorted;
}

/** Formats a measure value for display. Pure. */
export function formatMeasure(value: number, format?: MeasureFormat): string {
  if (format === "CURRENCY") {
    return `₪${value.toLocaleString("he-IL", { maximumFractionDigits: 2 })}`;
  }
  if (format === "PERCENT") {
    return `${value.toLocaleString("he-IL", { maximumFractionDigits: 1 })}%`;
  }
  return value.toLocaleString("he-IL", { maximumFractionDigits: 2 });
}

/** Renders a result as CSV (RPT-003, lightweight export). Pure. */
export function toCsv(result: ReportResult): string {
  const header = [
    ...result.dimensions.map((dimension) => dimension.label),
    ...result.measures.map((measure) => measure.label),
  ];
  const lines = [header.map(csvCell).join(",")];

  for (const row of result.rows) {
    const cells = [
      ...result.dimensions.map((dimension) => toDisplayString(row.dimensions[dimension.key])),
      ...result.measures.map((measure) => String(row.measures[measure.key] ?? 0)),
    ];
    lines.push(cells.map(csvCell).join(","));
  }

  const totalsRow = [
    ...result.dimensions.map((_, index) => (index === 0 ? "סה\"כ" : "")),
    ...result.measures.map((measure) => String(result.totals[measure.key] ?? 0)),
  ];
  lines.push(totalsRow.map(csvCell).join(","));

  return lines.join("\n");
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}
