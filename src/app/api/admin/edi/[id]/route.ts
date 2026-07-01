import { auth } from "~/server/auth";
import {
  getAdminFromSession,
  hasAdminPermission,
} from "~/server/auth/admin-access";
import { forbiddenJson, unauthorizedJson } from "~/server/http/api-response";
import { getEdiDocumentPayload } from "~/server/services/edi";

export const dynamic = "force-dynamic";

/** Downloads a generated EDI document as X12 text. Admin-gated (SYSTEM_CONFIG). */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) return unauthorizedJson("Unauthorized.");

  const admin = await getAdminFromSession(session);
  if (!admin || !hasAdminPermission(admin, "SYSTEM_CONFIG")) {
    return forbiddenJson("Forbidden.");
  }

  const { id } = await params;
  const doc = await getEdiDocumentPayload(id);
  if (!doc) return forbiddenJson("Not found.");

  const filename = `edi-${doc.docType}-${doc.reference ?? id}.edi`;
  return new Response(doc.payload, {
    headers: {
      "content-type": "application/edi-x12; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
}
