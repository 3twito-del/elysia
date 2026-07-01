import { auth } from "~/server/auth";
import {
  getAdminFromSession,
  hasAdminPermission,
} from "~/server/auth/admin-access";
import { forbiddenJson, unauthorizedJson } from "~/server/http/api-response";
import { getReportRunCsv } from "~/server/services/report-schedules";

export const dynamic = "force-dynamic";

/** Downloads a captured scheduled-report run as CSV. Admin-gated (ANALYTICS_READ). */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) return unauthorizedJson("Unauthorized.");

  const admin = await getAdminFromSession(session);
  if (!admin || !hasAdminPermission(admin, "ANALYTICS_READ")) {
    return forbiddenJson("Forbidden.");
  }

  const { id } = await params;
  const run = await getReportRunCsv(id);
  if (!run) return forbiddenJson("Not found.");

  const safeName = run.reportName.replace(/[^\p{L}\p{N}_-]+/gu, "_").slice(0, 60);
  // UTF-8 BOM so Excel renders Hebrew correctly.
  return new Response(`﻿${run.csv}`, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="report-run-${safeName}.csv"`,
      "cache-control": "no-store",
    },
  });
}
