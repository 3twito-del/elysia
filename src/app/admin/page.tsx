import Link from "next/link";
import {
  Boxes,
  CalendarClock,
  ClipboardList,
  PackageCheck,
  PlugZap,
} from "lucide-react";

import { AdminShell } from "./_components/admin-shell";
import {
  AdminDatabaseFallback,
  AdminForbidden,
} from "./_components/admin-states";
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
import {
  getOrderStatusLabel,
  getPaymentStatusLabel,
} from "~/lib/commerce-labels";
import { formatHebrewDateTime, formatPrice } from "~/lib/format";
import { getAdminPageAccess } from "~/app/admin/_lib/access";
import { getAdminOperationsOverview } from "~/server/services/admin-operations";

export const metadata = {
  title: "Admin",
};

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const access = await getAdminPageAccess("ORDERS_READ", "/admin");

  if (access.denied) {
    return <AdminForbidden {...access.denied} />;
  }

  const overview = await getAdminOperationsOverview().catch(
    (error: unknown) => {
      if (process.env.NODE_ENV === "development") {
        console.error("[admin] failed to load overview", error);
      }

      return null;
    },
  );

  if (!overview) return <AdminDatabaseFallback />;

  const degradedIntegrations = overview.integrations.filter(
    (integration) => integration.status !== "configured",
  );

  return (
    <AdminShell
      active="overview"
      admin={access.admin}
      description="מרכז השליטה של צוות התפעול: הזמנות פתוחות, מלאי, עבודות רקע ואינטגרציות שנדרשות להפעלה מסחרית מלאה."
      title="סקירת תפעול"
    >
      <p
        className="text-muted-foreground mb-4 text-sm"
        data-testid="admin-overview-freshness"
      >
        נתוני הדשבורד נמשכו ממסד הנתונים בזמן{" "}
        <time dateTime={overview.freshness.generatedAt.toISOString()}>
          {formatHebrewDateTime(overview.freshness.generatedAt)}
        </time>
        .
      </p>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          detail={`${overview.activeProducts} פעילים מתוך כלל הקטלוג`}
          icon={PackageCheck}
          label="מוצרים"
          value={String(overview.products)}
        />
        <MetricCard
          detail={`${overview.inventoryReserved} יחידות שמורות להזמנות`}
          icon={Boxes}
          label="מלאי"
          value={String(overview.inventoryUnits)}
        />
        <MetricCard
          detail="הזמנות שדורשות טיפול, אישור או fulfillment"
          icon={ClipboardList}
          label="הזמנות פתוחות"
          value={String(overview.openOrders)}
        />
        <MetricCard
          detail={`${overview.failedOutbox} כשלו · ${overview.dueOutbox} ממתינות`}
          icon={CalendarClock}
          label="עבודות רקע"
          value={String(overview.pendingAppointments)}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_0.85fr]">
        <Card className="rounded-md">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2">
              <ClipboardList aria-hidden="true" className="size-5" />
              הזמנות אחרונות
            </CardTitle>
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/orders">כל ההזמנות</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table className="min-w-[720px]">
              <TableHeader>
                <TableRow>
                  <TableHead>מספר</TableHead>
                  <TableHead>לקוח</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead>תשלום</TableHead>
                  <TableHead>סכום</TableHead>
                  <TableHead>תאריך</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overview.latestOrders.length === 0 ? (
                  <TableEmptyRow
                    colSpan={6}
                    description="הזמנות חדשות יופיעו כאן לאחר שמירת בקשת הזמנה."
                    icon={ClipboardList}
                    title="אין הזמנות להצגה"
                  />
                ) : (
                  overview.latestOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        <Link
                          className="underline-offset-4 hover:underline"
                          href={`/admin/orders/${order.id}`}
                        >
                          {order.orderNumber}
                        </Link>
                      </TableCell>
                      <TableCell>{order.recipientName}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {getOrderStatusLabel(order.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getPaymentStatusLabel(order.paymentStatus)}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatPrice(order.total)}</TableCell>
                      <TableCell>
                        {formatHebrewDateTime(order.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="rounded-md">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2">
              <PlugZap aria-hidden="true" className="size-5" />
              אינטגרציות
            </CardTitle>
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/integrations">ניטור</Link>
            </Button>
          </CardHeader>
          <CardContent className="grid gap-3">
            {overview.integrations.map((integration) => (
              <div
                className="bg-background/70 rounded-md border p-3"
                key={integration.name}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{integration.name}</p>
                  <Badge
                    variant={
                      integration.status === "configured"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {integration.status}
                  </Badge>
                </div>
                <p className="text-muted-foreground mt-2 text-sm leading-6">
                  {integration.detail}
                </p>
              </div>
            ))}
            {degradedIntegrations.length > 0 ? (
              <p className="text-muted-foreground text-xs">
                {degradedIntegrations.length} אינטגרציות ממתינות להגדרה או
                rollout.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
