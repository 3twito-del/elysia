import { auth } from "~/server/auth";
import {
  getAdminFromSession,
  hasAdminPermission,
} from "~/server/auth/admin-access";
import { forbiddenJson, unauthorizedJson } from "~/server/http/api-response";
import { getForm856 } from "~/server/services/israeli-tax";

export const dynamic = "force-dynamic";

function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** Downloads the annual form-856 withholding report as CSV. Admin-gated. */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return unauthorizedJson("Unauthorized.");

  const admin = await getAdminFromSession(session);
  if (!admin || !hasAdminPermission(admin, "FINANCE_READ")) {
    return forbiddenJson("Forbidden.");
  }

  const url = new URL(req.url);
  const year = Number(url.searchParams.get("year")) || new Date().getUTCFullYear();
  const report = await getForm856(year);

  const rows = [
    ["vendor", "gross_paid", "withheld_tax"].join(","),
    ...report.rows.map((row) =>
      [row.vendorName, row.grossPaid, row.withheld].map((cell) => csvCell(String(cell))).join(","),
    ),
    ["TOTAL", report.totalGross, report.totalWithheld].join(","),
  ].join("\n");

  return new Response(rows, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="form856-${year}.csv"`,
      "cache-control": "no-store",
    },
  });
}
