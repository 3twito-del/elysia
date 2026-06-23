import { CreditCard, Landmark, ReceiptText, TrendingUp } from "lucide-react";

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
  formatHebrewDate,
  formatHebrewDateTime,
  formatPrice,
} from "~/lib/format";
import { getFinanceOverview } from "~/server/services/finance";

export const metadata = {
  title: "Finance | Admin",
};

export const dynamic = "force-dynamic";

export default async function AdminFinancePage() {
  const access = await getAdminPageAccess("FINANCE_READ", "/admin/finance");

  if (access.denied) return <AdminForbidden {...access.denied} />;

  const finance = await getFinanceOverview({
    adminUserId: access.admin.id,
  }).catch((error: unknown) => {
    if (process.env.NODE_ENV === "development") {
      console.error("[admin] failed to load finance", error);
    }

    return null;
  });

  if (!finance) return <AdminDatabaseFallback />;

  return (
    <AdminShell
      active="finance"
      admin={access.admin}
      description="Ledger תפעולי: הכנסות, תשלומים, COGS, gross margin, refunds ונתונים מוכנים לייצוא חשבונאי."
      title="Finance"
    >
      <p className="text-muted-foreground mb-4 text-sm">
        לא מחליף הנהלת חשבונות חוקית. צפייה ב־Finance נרשמת ל־AuditLog. טווח{" "}
        {formatHebrewDate(finance.range.from)}–
        {formatHebrewDate(finance.range.to)}.
      </p>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          detail={`${finance.kpis.orderCount} הזמנות`}
          icon={Landmark}
          label="Revenue"
          value={formatPrice(finance.kpis.revenue)}
        />
        <MetricCard
          detail={`${finance.kpis.capturedPaymentCount} תשלומים נקלטו`}
          icon={CreditCard}
          label="Captured"
          value={formatPrice(finance.kpis.capturedPayments)}
        />
        <MetricCard
          detail={`Rate ${formatPercent(finance.kpis.grossMarginRate)}`}
          icon={TrendingUp}
          label="Gross margin"
          value={formatPrice(finance.kpis.grossMargin)}
        />
        <MetricCard
          detail={`${finance.kpis.refundCount} refunds`}
          icon={ReceiptText}
          label="COGS / Refunds"
          value={`${formatPrice(finance.kpis.cogs)} / ${formatPrice(finance.kpis.refunds)}`}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <Card className="rounded-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ReceiptText aria-hidden="true" className="size-5" />
              Ledger
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table className="min-w-[840px]">
              <TableHeader>
                <TableRow>
                  <TableHead>תאריך</TableHead>
                  <TableHead>סוג</TableHead>
                  <TableHead>קטגוריה</TableHead>
                  <TableHead>מקור</TableHead>
                  <TableHead>Debit</TableHead>
                  <TableHead>Credit</TableHead>
                  <TableHead>תיאור</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {finance.ledgerEntries.length === 0 ? (
                  <TableEmptyRow
                    colSpan={7}
                    description="Ledger יופיע לאחר סנכרון תשלומים/הזמנות."
                    icon={ReceiptText}
                    title="אין ledger entries"
                  />
                ) : (
                  finance.ledgerEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{formatHebrewDate(entry.entryDate)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{entry.type}</Badge>
                      </TableCell>
                      <TableCell>{entry.category}</TableCell>
                      <TableCell>{entry.source}</TableCell>
                      <TableCell>
                        {entry.debit == null ? "-" : formatPrice(entry.debit)}
                      </TableCell>
                      <TableCell>
                        {entry.credit == null ? "-" : formatPrice(entry.credit)}
                      </TableCell>
                      <TableCell>{entry.description ?? "-"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="rounded-md">
          <CardHeader>
            <CardTitle>Top orders</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {finance.topOrders.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                אין הזמנות בטווח הנבחר.
              </p>
            ) : (
              finance.topOrders.map((order) => (
                <div className="rounded-md border p-3" key={order.id}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{order.orderNumber}</p>
                    <Badge variant="secondary">
                      {formatPrice(order.total)}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mt-1 text-sm">
                    COGS {formatPrice(order.cogs)} · margin{" "}
                    {formatPrice(order.grossMargin)} ·{" "}
                    {formatHebrewDateTime(order.createdAt)}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}
