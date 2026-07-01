import { Cable, FileCode2, FileDown } from "lucide-react";
import Link from "next/link";

import { AdminShell } from "../_components/admin-shell";
import {
  AdminDatabaseFallback,
  AdminForbidden,
} from "../_components/admin-states";
import { getAdminPageAccess } from "../_lib/access";
import { generateEdi850Action } from "./actions";
import { MetricCard } from "~/components/metric-card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { TableEmptyRow } from "~/components/ui/table-empty-row";
import { formatPrice } from "~/lib/format";
import {
  getEdiSummary,
  listEdiDocuments,
  listPurchaseOrdersForEdi,
} from "~/server/services/edi";

export const metadata = {
  title: "EDI | Admin",
};

export const dynamic = "force-dynamic";

export default async function AdminEdiPage() {
  const access = await getAdminPageAccess("SYSTEM_CONFIG", "/admin/edi");

  if (access.denied) return <AdminForbidden {...access.denied} />;

  const summary = await getEdiSummary().catch(() => null);

  if (!summary) return <AdminDatabaseFallback />;

  const [purchaseOrders, documents] = await Promise.all([
    listPurchaseOrdersForEdi().catch(() => []),
    listEdiDocuments().catch(() => []),
  ]);

  return (
    <AdminShell
      active="edi"
      admin={access.admin}
      description="EDI (X12): הפקת מסמכי 850 (הזמנת רכש) ו-810 (חשבונית) לשותפי סחר. מבנה 004010 — לאמת מול השותף."
      title="EDI"
    >
      <div className="grid gap-5 md:grid-cols-2">
        <MetricCard
          detail={`${summary.outbound} יוצאים`}
          icon={FileCode2}
          label="מסמכי EDI"
          value={String(summary.documents)}
        />
        <MetricCard
          detail="פורמט X12 004010"
          icon={Cable}
          label="פורמט"
          value="X12"
        />
      </div>

      <Card className="mt-6 rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cable aria-hidden="true" className="size-5" />
            הזמנות רכש → 850
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>הזמנה</TableHead>
                <TableHead>ספק</TableHead>
                <TableHead>סכום</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchaseOrders.length === 0 ? (
                <TableEmptyRow
                  colSpan={4}
                  description="אין הזמנות רכש."
                  icon={Cable}
                  title="אין הזמנות"
                />
              ) : (
                purchaseOrders.map((po) => (
                  <TableRow key={po.id}>
                    <TableCell className="text-sm">{po.poNumber}</TableCell>
                    <TableCell className="text-sm">{po.vendorName}</TableCell>
                    <TableCell className="text-sm">{formatPrice(po.total)}</TableCell>
                    <TableCell>
                      <form action={generateEdi850Action}>
                        <input name="purchaseOrderId" type="hidden" value={po.id} />
                        <Button size="sm" type="submit" variant="outline">
                          הפק 850
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="mt-6 rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCode2 aria-hidden="true" className="size-5" />
            מסמכי EDI שהופקו
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>סוג</TableHead>
                <TableHead>שותף</TableHead>
                <TableHead>אסמכתא</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.length === 0 ? (
                <TableEmptyRow
                  colSpan={4}
                  description="טרם הופקו מסמכי EDI."
                  icon={FileCode2}
                  title="אין מסמכים"
                />
              ) : (
                documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <Badge variant="secondary">{doc.docType}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{doc.partner ?? "—"}</TableCell>
                    <TableCell className="text-xs">{doc.reference ?? "—"}</TableCell>
                    <TableCell>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/api/admin/edi/${doc.id}`}>
                          <FileDown aria-hidden="true" className="size-3" />
                          הורד
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminShell>
  );
}
