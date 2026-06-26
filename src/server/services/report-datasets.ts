import { db } from "~/server/db";
import type { DatasetRow, Dimension, Measure } from "~/server/services/report-engine";

/**
 * The semantic layer (BI-002 / RPT-001): curated datasets that define their
 * dimensions and measures once, so every report speaks the same metrics. Each
 * dataset flattens its source tables into plain rows for the pure aggregation
 * engine. Loaders are capped to keep ad-hoc reporting responsive.
 */

export type Dataset = {
  key: string;
  label: string;
  description: string;
  dimensions: Dimension[];
  measures: Measure[];
  load: () => Promise<DatasetRow[]>;
};

const ORDER_SCAN_LIMIT = 10000;
const LEDGER_SCAN_LIMIT = 20000;

/** First-of-month bucket `YYYY-MM` for a date. Pure. */
export function monthOf(date: Date | null | undefined): string {
  if (!date) return "—";
  return date.toISOString().slice(0, 7);
}

const ordersDataset: Dataset = {
  key: "orders",
  label: "הזמנות",
  description: "מכירות לפי סטטוס, אופן אספקה, סניף וחודש.",
  dimensions: [
    { key: "status", label: "סטטוס", field: "status" },
    { key: "fulfillment", label: "אופן אספקה", field: "fulfillment" },
    { key: "branch", label: "סניף", field: "branch" },
    { key: "month", label: "חודש", field: "month" },
  ],
  measures: [
    { key: "count", label: "מספר הזמנות", agg: "COUNT" },
    { key: "revenue", label: "הכנסה", agg: "SUM", field: "total", format: "CURRENCY" },
    { key: "discount", label: "הנחות", agg: "SUM", field: "discount", format: "CURRENCY" },
    { key: "aov", label: "ממוצע להזמנה", agg: "AVG", field: "total", format: "CURRENCY" },
  ],
  load: async () => {
    const orders = await db.order.findMany({
      take: ORDER_SCAN_LIMIT,
      orderBy: { createdAt: "desc" },
      select: {
        status: true,
        fulfillmentMethod: true,
        branchId: true,
        total: true,
        discountTotal: true,
        createdAt: true,
      },
    });
    return orders.map((order) => ({
      status: order.status,
      fulfillment: order.fulfillmentMethod,
      branch: order.branchId ?? "ללא סניף",
      month: monthOf(order.createdAt),
      total: Number(order.total),
      discount: Number(order.discountTotal),
    }));
  },
};

const ledgerDataset: Dataset = {
  key: "ledger",
  label: "ספר ראשי",
  description: "תנועות יומן לפי סוג חשבון, חשבון, מקור וחודש.",
  dimensions: [
    { key: "accountType", label: "סוג חשבון", field: "accountType" },
    { key: "account", label: "חשבון", field: "account" },
    { key: "source", label: "מקור", field: "source" },
    { key: "month", label: "חודש", field: "month" },
  ],
  measures: [
    { key: "debit", label: 'חובה', agg: "SUM", field: "debit", format: "CURRENCY" },
    { key: "credit", label: "זכות", agg: "SUM", field: "credit", format: "CURRENCY" },
    { key: "lines", label: "תנועות", agg: "COUNT" },
  ],
  load: async () => {
    const lines = await db.journalLine.findMany({
      take: LEDGER_SCAN_LIMIT,
      orderBy: { id: "desc" },
      select: {
        debit: true,
        credit: true,
        account: { select: { type: true, code: true, name: true } },
        journalEntry: { select: { source: true, entryDate: true, status: true } },
      },
    });
    return lines
      .filter((line) => line.journalEntry.status === "POSTED")
      .map((line) => ({
        accountType: line.account.type,
        account: `${line.account.code} ${line.account.name}`,
        source: line.journalEntry.source,
        month: monthOf(line.journalEntry.entryDate),
        debit: Number(line.debit),
        credit: Number(line.credit),
      }));
  },
};

export const DATASETS: Record<string, Dataset> = {
  orders: ordersDataset,
  ledger: ledgerDataset,
};

export function getDataset(key: string): Dataset | undefined {
  return DATASETS[key];
}

/** Dataset metadata (no loaders) for the builder UI. */
export function listDatasets() {
  return Object.values(DATASETS).map((dataset) => ({
    key: dataset.key,
    label: dataset.label,
    description: dataset.description,
    dimensions: dataset.dimensions,
    measures: dataset.measures,
  }));
}
