import { Prisma } from "@prisma/client";

import { db } from "~/server/db";
import { getDataset, listDatasets } from "~/server/services/report-datasets";
import {
  aggregateRows,
  type Dimension,
  type Measure,
  type ReportResult,
  type SortSpec,
} from "~/server/services/report-engine";
import {
  describeCondition,
  validateRule,
} from "~/server/services/workflow-rules";

/**
 * Report Builder service (RPT, §4.Q). Validates a report against the semantic
 * layer, persists it, and runs it live: loads the dataset and aggregates with
 * the pure engine. Reports always agree with source data — no stale snapshots.
 */

const asJson = (value: unknown) => value as Prisma.InputJsonValue;

function parseKeys(value: Prisma.JsonValue | null | undefined): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string");
}

function parseSort(value: Prisma.JsonValue | null | undefined): SortSpec | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const node = value as Record<string, unknown>;
  if (typeof node.by !== "string") return undefined;
  return { by: node.by, dir: node.dir === "asc" ? "asc" : "desc" };
}

/** Validates chosen dimensions/measures against a dataset. Pure-ish. */
export function validateReportSpec(
  dataset: { dimensions: Dimension[]; measures: Measure[] },
  dimensionKeys: string[],
  measureKeys: string[],
): string[] {
  const errors: string[] = [];
  const dimSet = new Set(dataset.dimensions.map((dimension) => dimension.key));
  const measureSet = new Set(dataset.measures.map((measure) => measure.key));

  if (measureKeys.length === 0) errors.push("יש לבחור לפחות מדד אחד.");

  for (const key of dimensionKeys) {
    if (!dimSet.has(key)) errors.push(`ממד לא קיים במאגר: ${key}.`);
  }
  for (const key of measureKeys) {
    if (!measureSet.has(key)) errors.push(`מדד לא קיים במאגר: ${key}.`);
  }
  return errors;
}

/** Creates a report after validating it against the semantic layer. */
export async function createReport(input: {
  name: string;
  description?: string;
  datasetKey: string;
  dimensions: string[];
  measures: string[];
  filter?: unknown;
  sort?: SortSpec;
}) {
  if (!input.name.trim()) throw new Error("שם הדוח הוא שדה חובה.");

  const dataset = getDataset(input.datasetKey);
  if (!dataset) throw new Error("מאגר נתונים לא קיים.");

  const specErrors = validateReportSpec(dataset, input.dimensions, input.measures);
  if (specErrors.length > 0) throw new Error(specErrors.join(" "));

  const ruleErrors = validateRule(input.filter ?? null);
  if (ruleErrors.length > 0) throw new Error(ruleErrors.join(" "));

  return db.reportDefinition.create({
    data: {
      name: input.name.trim(),
      description: input.description,
      datasetKey: input.datasetKey,
      dimensions: asJson(input.dimensions),
      measures: asJson(input.measures),
      ...(input.filter != null ? { filter: asJson(input.filter) } : {}),
      ...(input.sort ? { sort: asJson(input.sort) } : {}),
    },
  });
}

export async function setReportActive(input: {
  reportId: string;
  isActive: boolean;
}) {
  return db.reportDefinition.update({
    where: { id: input.reportId },
    data: { isActive: input.isActive },
  });
}

export async function deleteReport(input: { reportId: string }) {
  return db.reportDefinition.delete({ where: { id: input.reportId } });
}

function resolveColumns<T extends { key: string }>(
  available: T[],
  chosen: string[],
): T[] {
  return chosen
    .map((key) => available.find((column) => column.key === key))
    .filter((column): column is T => Boolean(column));
}

export type RunReportResult = {
  id: string;
  name: string;
  datasetKey: string;
  datasetLabel: string;
  filterDescription: string;
  result: ReportResult;
};

/** Runs a saved report live against its dataset. */
export async function runReport(reportId: string): Promise<RunReportResult> {
  const report = await db.reportDefinition.findUnique({
    where: { id: reportId },
  });
  if (!report) throw new Error("דוח לא נמצא.");

  const dataset = getDataset(report.datasetKey);
  if (!dataset) throw new Error("מאגר הנתונים של הדוח אינו קיים.");

  const dimensions = resolveColumns(dataset.dimensions, parseKeys(report.dimensions));
  const measures = resolveColumns(dataset.measures, parseKeys(report.measures));
  const rows = await dataset.load();

  const result = aggregateRows({
    rows,
    dimensions,
    measures,
    filter: report.filter ?? undefined,
    sort: parseSort(report.sort),
  });

  await db.reportDefinition.update({
    where: { id: report.id },
    data: { lastRunAt: new Date() },
  });

  return {
    id: report.id,
    name: report.name,
    datasetKey: report.datasetKey,
    datasetLabel: dataset.label,
    filterDescription: describeCondition(report.filter),
    result,
  };
}

export async function listReports(limit = 30) {
  const reports = await db.reportDefinition.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      name: true,
      datasetKey: true,
      dimensions: true,
      measures: true,
      isActive: true,
      lastRunAt: true,
    },
  });

  return reports.map((report) => {
    const dataset = getDataset(report.datasetKey);
    return {
      id: report.id,
      name: report.name,
      datasetKey: report.datasetKey,
      datasetLabel: dataset?.label ?? report.datasetKey,
      dimensionCount: parseKeys(report.dimensions).length,
      measureCount: parseKeys(report.measures).length,
      isActive: report.isActive,
      lastRunAt: report.lastRunAt,
    };
  });
}

export async function getReportsSummary() {
  const [total, active] = await Promise.all([
    db.reportDefinition.count(),
    db.reportDefinition.count({ where: { isActive: true } }),
  ]);

  return { total, active, datasets: listDatasets().length };
}
