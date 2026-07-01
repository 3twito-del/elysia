import { CopyCheck, Users } from "lucide-react";

import { AdminShell } from "../_components/admin-shell";
import {
  AdminDatabaseFallback,
  AdminForbidden,
} from "../_components/admin-states";
import { getAdminPageAccess } from "../_lib/access";
import { MetricCard } from "~/components/metric-card";
import { Badge } from "~/components/ui/badge";
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
import {
  getDuplicateCustomerCandidates,
  getMdmSummary,
} from "~/server/services/mdm";

export const metadata = { title: "MDM | Admin" };

export const dynamic = "force-dynamic";

function label(customer: { email: string | null; firstName: string | null; lastName: string | null }) {
  const name = `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim();
  if (name.length > 0) return name;
  return customer.email ?? "לקוח";
}

export default async function AdminMdmPage() {
  const access = await getAdminPageAccess("CUSTOMER_VIEW", "/admin/mdm");
  if (access.denied) return <AdminForbidden {...access.denied} />;

  const summary = await getMdmSummary().catch(() => null);
  if (!summary) return <AdminDatabaseFallback />;

  const candidates = await getDuplicateCustomerCandidates().catch(() => []);

  return (
    <AdminShell
      active="mdm"
      admin={access.admin}
      description="ניהול נתוני-אב: זיהוי כפילויות לקוחות (golden record) לבדיקה ידנית — ללא מיזוג הרסני."
      title="נתוני-אב (MDM)"
    >
      <div className="grid gap-5 md:grid-cols-2">
        <MetricCard detail="לקוחות במערכת" icon={Users} label="לקוחות" value={String(summary.customers)} />
        <MetricCard
          detail="זוגות חשודים ככפילות"
          icon={CopyCheck}
          label="כפילויות"
          value={String(summary.duplicateCandidates)}
        />
      </div>

      <Card className="mt-6 rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CopyCheck aria-hidden="true" className="size-5" />
            מועמדים לכפילות
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{"רשומה א'"}</TableHead>
                <TableHead>{"רשומה ב'"}</TableHead>
                <TableHead>סיבה</TableHead>
                <TableHead>ביטחון</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {candidates.length === 0 ? (
                <TableEmptyRow
                  colSpan={4}
                  description="לא נמצאו כפילויות חשודות."
                  icon={CopyCheck}
                  title="נקי"
                />
              ) : (
                candidates.map((pair) => (
                  <TableRow key={`${pair.a.id}-${pair.b.id}`}>
                    <TableCell className="text-sm">
                      <div>{label(pair.a)}</div>
                      <div className="text-muted-foreground text-xs">{pair.a.email ?? pair.a.phone ?? "—"}</div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div>{label(pair.b)}</div>
                      <div className="text-muted-foreground text-xs">{pair.b.email ?? pair.b.phone ?? "—"}</div>
                    </TableCell>
                    <TableCell className="text-xs">{pair.reason}</TableCell>
                    <TableCell>
                      <Badge variant={pair.score >= 0.95 ? "destructive" : "outline"}>
                        {Math.round(pair.score * 100)}%
                      </Badge>
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
