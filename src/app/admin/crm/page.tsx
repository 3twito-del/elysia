import Link from "next/link";
import {
  AlertTriangle,
  ContactRound,
  Heart,
  ListTodo,
  Repeat,
  ShoppingBag,
  Users,
} from "lucide-react";

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
import { formatHebrewDateTime, formatPrice } from "~/lib/format";
import { getCrmOverview } from "~/server/services/crm";

export const metadata = {
  title: "CRM | Admin",
};

export const dynamic = "force-dynamic";

export default async function AdminCrmPage() {
  const access = await getAdminPageAccess("CRM_READ", "/admin/crm");

  if (access.denied) return <AdminForbidden {...access.denied} />;

  const crm = await getCrmOverview({ adminUserId: access.admin.id }).catch(
    (error: unknown) => {
      if (process.env.NODE_ENV === "development") {
        console.error("[admin] failed to load CRM", error);
      }

      return null;
    },
  );

  if (!crm) return <AdminDatabaseFallback />;

  return (
    <AdminShell
      active="crm"
      admin={access.admin}
      description="CRM 360 מותאם ל־Elysia: סגמנטים, לקוחות בסיכון, VIP, Wishlist, עגלות ומשימות follow-up."
      title="CRM"
    >
      <p className="text-muted-foreground mb-4 text-sm">
        צפייה ב־CRM נרשמת ל־AuditLog. עודכן{" "}
        <time dateTime={crm.freshness.generatedAt.toISOString()}>
          {formatHebrewDateTime(crm.freshness.generatedAt)}
        </time>
        .
      </p>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          detail={`${crm.counts.segments} סגמנטים פעילים`}
          icon={Users}
          label="לקוחות"
          value={String(crm.counts.customers)}
        />
        <MetricCard
          detail={`${crm.counts.overdueTasks} באיחור`}
          icon={ListTodo}
          label="משימות פתוחות"
          value={String(crm.counts.openTasks)}
        />
        <MetricCard
          detail={`${crm.counts.activeCarts} עגלות פעילות`}
          icon={Heart}
          label="Wishlist"
          value={String(crm.counts.wishlistCustomers)}
        />
        <MetricCard
          detail={`${crm.counts.openServiceRequests} פניות שירות`}
          icon={AlertTriangle}
          label="לקוחות בסיכון"
          value={String(crm.counts.atRisk)}
        />
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          detail={`ממוצע ${formatPrice(crm.kpis.averageLifetimeValue)}`}
          icon={Users}
          label="LTV מצטבר"
          value={formatPrice(crm.kpis.totalLifetimeValue)}
        />
        <MetricCard
          detail="ערך הזמנה ממוצע"
          icon={ShoppingBag}
          label="AOV"
          value={formatPrice(crm.kpis.averageOrderValue)}
        />
        <MetricCard
          detail={`${crm.kpis.customersWithOrders} לקוחות רוכשים`}
          icon={Repeat}
          label="רכישה חוזרת"
          value={`${crm.kpis.repeatPurchaseRate}%`}
        />
        <MetricCard
          detail={`${crm.counts.overdueTasks} משימות באיחור`}
          icon={ListTodo}
          label="משימות פתוחות"
          value={String(crm.counts.openTasks)}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <CustomerListCard title="VIP" customers={crm.vipCustomers} />
        <CustomerListCard
          title="כוונת רכישה גבוהה"
          customers={crm.highIntentCustomers}
        />
        <CustomerListCard
          title="לקוחות בסיכון נטישה"
          customers={crm.atRiskCustomers}
        />
        <CustomerListCard
          title="לקוחות רדומים"
          customers={crm.dormantCustomers}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <Card className="rounded-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ContactRound aria-hidden="true" className="size-5" />
              סגמנטים
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table className="min-w-[680px]">
              <TableHeader>
                <TableRow>
                  <TableHead>שם</TableHead>
                  <TableHead>סוג</TableHead>
                  <TableHead>חברים</TableHead>
                  <TableHead>תיאור</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {crm.segments.length === 0 ? (
                  <TableEmptyRow
                    colSpan={4}
                    description="סגמנטים יופיעו אחרי seed או אוטומציה."
                    icon={ContactRound}
                    title="אין סגמנטים"
                  />
                ) : (
                  crm.segments.map((segment) => (
                    <TableRow key={segment.id}>
                      <TableCell className="font-medium">
                        {segment.name}
                        <span className="text-muted-foreground block text-xs">
                          {segment.key}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {segment.isSystem ? "System" : "Custom"}
                        </Badge>
                      </TableCell>
                      <TableCell>{segment.members}</TableCell>
                      <TableCell>{segment.description ?? "-"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="rounded-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListTodo aria-hidden="true" className="size-5" />
              הערות אחרונות
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {crm.recentNotes.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                אין עדיין הערות לקוח.
              </p>
            ) : (
              crm.recentNotes.map((note) => (
                <div className="rounded-md border p-3" key={note.id}>
                  <div className="flex items-center justify-between gap-3">
                    <Link
                      className="font-medium underline-offset-4 hover:underline"
                      href={`/admin/customers/${note.customerId}`}
                    >
                      {note.customerName}
                    </Link>
                    <Badge variant="outline">{note.adminName}</Badge>
                  </div>
                  <p className="text-muted-foreground mt-2 text-sm leading-6">
                    {note.content}
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

const churnRiskLabel = {
  ACTIVE: "פעיל",
  WARNING: "מתקרר",
  HIGH: "סיכון גבוה",
  DORMANT: "רדום",
} as const;

const churnRiskVariant = {
  ACTIVE: "secondary",
  WARNING: "outline",
  HIGH: "default",
  DORMANT: "destructive",
} as const;

type ChurnRisk = keyof typeof churnRiskLabel;

function CustomerListCard({
  customers,
  title,
}: {
  customers: Array<{
    id: string;
    name: string;
    email: string | null;
    lifetimeValue: number;
    orderCount: number;
    wishlistItems: number;
    churnRisk: ChurnRisk;
    healthScore: number;
    nextBestAction: string;
  }>;
  title: string;
}) {
  return (
    <Card className="rounded-md">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2">
        {customers.length === 0 ? (
          <p className="text-muted-foreground text-sm">אין נתונים להצגה.</p>
        ) : (
          customers.map((customer) => (
            <div
              className="bg-background/70 grid gap-1 rounded-md border p-3"
              key={customer.id}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    className="truncate font-medium underline-offset-4 hover:underline"
                    href={`/admin/customers/${customer.id}`}
                  >
                    {customer.name}
                  </Link>
                  <p className="text-muted-foreground truncate text-xs">
                    {customer.email ?? "ללא אימייל"} · {customer.orderCount}{" "}
                    הזמנות · בריאות {customer.healthScore}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <Badge variant="outline">
                    {formatPrice(customer.lifetimeValue)}
                  </Badge>
                  <Badge variant={churnRiskVariant[customer.churnRisk]}>
                    {churnRiskLabel[customer.churnRisk]}
                  </Badge>
                </div>
              </div>
              <p className="text-muted-foreground text-xs leading-5">
                {customer.nextBestAction}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
