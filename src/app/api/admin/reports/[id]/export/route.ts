import { auth } from "~/server/auth";
import {
  getAdminFromSession,
  hasAdminPermission,
} from "~/server/auth/admin-access";
import { forbiddenJson, unauthorizedJson } from "~/server/http/api-response";
import { toCsv } from "~/server/services/report-engine";
import { buildReportXlsx } from "~/server/services/report-export";
import { runReport } from "~/server/services/reports";

export const dynamic = "force-dynamic";

/** Downloads a saved report as CSV or XLSX. Admin-gated (ANALYTICS_READ). */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) return unauthorizedJson("Unauthorized.");

  const admin = await getAdminFromSession(session);
  if (!admin || !hasAdminPermission(admin, "ANALYTICS_READ")) {
    return forbiddenJson("Forbidden.");
  }

  const { id } = await params;
  const format = new URL(req.url).searchParams.get("format") === "xlsx"
    ? "xlsx"
    : "csv";

  const report = await runReport(id).catch(() => null);
  if (!report) return forbiddenJson("Not found.");

  const safeName = report.name.replace(/[^\p{L}\p{N}_-]+/gu, "_").slice(0, 60);

  if (format === "xlsx") {
    const buffer = await buildReportXlsx(report.result, report.name);
    return new Response(buffer, {
      headers: {
        "content-type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "content-disposition": `attachment; filename="report-${safeName}.xlsx"`,
        "cache-control": "no-store",
      },
    });
  }

  // CSV with a UTF-8 BOM so Excel renders Hebrew correctly.
  const csv = `﻿${toCsv(report.result)}`;
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="report-${safeName}.csv"`,
      "cache-control": "no-store",
    },
  });
}
