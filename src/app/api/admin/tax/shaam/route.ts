import { auth } from "~/server/auth";
import {
  getAdminFromSession,
  hasAdminPermission,
} from "~/server/auth/admin-access";
import { forbiddenJson, unauthorizedJson } from "~/server/http/api-response";
import { getShaamExportForPeriod } from "~/server/services/shaam-export";

export const dynamic = "force-dynamic";

/**
 * Downloads the Israeli uniform-structure (מבנה אחיד) export for a month.
 * `?year=YYYY&month=M&file=bkmvdata|ini`. Admin-gated (FINANCE_READ).
 */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return unauthorizedJson("Unauthorized.");

  const admin = await getAdminFromSession(session);
  if (!admin || !hasAdminPermission(admin, "FINANCE_READ")) {
    return forbiddenJson("Forbidden.");
  }

  const url = new URL(req.url);
  const now = new Date();
  const year = Number(url.searchParams.get("year")) || now.getUTCFullYear();
  const month = Number(url.searchParams.get("month")) || now.getUTCMonth() + 1;
  const file = url.searchParams.get("file") === "ini" ? "ini" : "bkmvdata";

  const result = await getShaamExportForPeriod({ year, month });
  const content = file === "ini" ? result.ini : result.bkmvdata;
  const filename = `${file.toUpperCase()}-${year}${String(month).padStart(2, "0")}.txt`;

  return new Response(content, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
}
