import Link from "next/link";
import {
  CalendarClock,
  ContactRound,
  Heart,
  History,
  ListTodo,
  ShoppingBag,
} from "lucide-react";

import { AdminShell } from "../../_components/admin-shell";
import {
  AdminDatabaseFallback,
  AdminForbidden,
} from "../../_components/admin-states";
import { getAdminPageAccess } from "../../_lib/access";
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
import { formatHebrewDateTime, formatPrice } from "~/lib/format";
import { getCustomer360Profile } from "~/server/services/crm";

export const metadata = {
  title: "Customer 360 | Admin",
};

export const dynamic = "force-dynamic";

type AdminCustomerProfilePageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminCustomerProfilePage({
  params,
}: AdminCustomerProfilePageProps) {
  const { id } = await params;
  const access = await getAdminPageAccess("CRM_READ", `/admin/customers/${id}`);

  if (access.denied) return <AdminForbidden {...access.denied} />;

  const profile = await getCustomer360Profile({
    adminUserId: access.admin.id,
    customerId: id,
  }).catch((error: unknown) => {
    if (process.env.NODE_ENV === "development") {
      console.error("[admin] failed to load customer profile", error);
    }

    return undefined;
  });

  if (typeof profile === "undefined") return <AdminDatabaseFallback />;

  if (!profile) {
    return (
      <AdminShell
        active="crm"
        admin={access.admin}
        description="פרופיל לקוח לא נמצא."
        title="Customer 360"
      >
        <Card className="rounded-md">
          <CardContent className="grid gap-3 p-6">
            <p className="font-medium">לא נמצא לקוח עם מזהה זה.</p>
            <Button asChild className="w-fit" variant="outline">
              <Link href="/admin/crm">חזרה ל־CRM</Link>
            </Button>
          </CardContent>
        </Card>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      active="crm"
      admin={access.admin}
      description="פרופיל 360 ללקוח: רכישות, wishlist, שירות, תורים, consent, notes/tasks ו־timeline תפעולי."
      title={profile.customer.name}
    >
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Button asChild size="sm" variant="outline">
          <Link href="/admin/crm">CRM</Link>
        </Button>
        <Badge variant="secondary">
          {profile.customer.email ?? "ללא אימייל"}
        </Badge>
        <Badge variant="outline">{profile.customer.phone ?? "ללא טלפון"}</Badge>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          detail={`AOV ${formatPrice(profile.metric?.averageOrderValue ?? 0)}`}
          icon={ShoppingBag}
          label="LTV"
          value={formatPrice(profile.metric?.lifetimeValue ?? 0)}
        />
        <MetricCard
          detail={`${profile.orders.length} הזמנות נטענו לפרופיל`}
          icon={ShoppingBag}
          label="הזמנות"
          value={String(profile.metric?.orderCount ?? profile.orders.length)}
        />
        <MetricCard
          detail="פריטים שמורים"
          icon={Heart}
          label="Wishlist"
          value={String(profile.wishlist.length)}
        />
        <MetricCard
          detail={`${profile.serviceRequests.length} פניות · ${profile.appointments.length} תורים`}
          icon={CalendarClock}
          label="שירות"
          value={String(
            (profile.metric?.serviceRequests ?? 0) +
              (profile.metric?.appointments ?? 0),
          )}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <Card className="rounded-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History aria-hidden="true" className="size-5" />
              Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {profile.timeline.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                אין timeline להצגה.
              </p>
            ) : (
              profile.timeline.slice(0, 25).map((event) => (
                <div
                  className="rounded-md border p-3"
                  key={`${event.kind}-${event.id}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{event.label}</p>
                    <Badge variant="outline">{event.kind}</Badge>
                  </div>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {formatHebrewDateTime(event.at)}
                  </p>
                  {event.kind === "analytics" ? (
                    <code className="text-muted-foreground mt-2 block overflow-hidden rounded border p-2 text-xs text-ellipsis">
                      {JSON.stringify(event.detail)}
                    </code>
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Card className="rounded-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ContactRound aria-hidden="true" className="size-5" />
                סגמנטים ו־consent
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="flex flex-wrap gap-2">
                {profile.segments.length === 0 ? (
                  <Badge variant="outline">ללא סגמנט</Badge>
                ) : (
                  profile.segments.map((segment) => (
                    <Badge key={segment.id} variant="secondary">
                      {segment.name}
                    </Badge>
                  ))
                )}
              </div>
              <div className="text-muted-foreground grid gap-1 text-sm">
                <p>
                  Push marketing: {profile.consent.pushMarketing ? "כן" : "לא"}
                </p>
                <p>
                  Push transactional:{" "}
                  {profile.consent.pushTransactional ? "כן" : "לא"}
                </p>
                <p>Subscriptions: {profile.consent.pushSubscriptions}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListTodo aria-hidden="true" className="size-5" />
                Notes / tasks
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {[...profile.tasks, ...profile.notes].length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  אין משימות או הערות.
                </p>
              ) : (
                <>
                  {profile.tasks.map((task) => (
                    <div className="rounded-md border p-3" key={task.id}>
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium">{task.title}</p>
                        <Badge variant="outline">{task.status}</Badge>
                      </div>
                      <p className="text-muted-foreground mt-1 text-sm">
                        {task.description ?? "ללא פירוט"}
                      </p>
                    </div>
                  ))}
                  {profile.notes.map((note) => (
                    <div className="rounded-md border p-3" key={note.id}>
                      <p className="font-medium">{note.adminName}</p>
                      <p className="text-muted-foreground mt-1 text-sm">
                        {note.content}
                      </p>
                    </div>
                  ))}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="mt-6 rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag aria-hidden="true" className="size-5" />
            רכישות
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table className="min-w-[760px]">
            <TableHeader>
              <TableRow>
                <TableHead>מספר</TableHead>
                <TableHead>סטטוס</TableHead>
                <TableHead>תשלום</TableHead>
                <TableHead>פריטים</TableHead>
                <TableHead>סה״כ</TableHead>
                <TableHead>נוצר</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profile.orders.length === 0 ? (
                <TableEmptyRow
                  colSpan={6}
                  description="אין הזמנות להצגה."
                  icon={ShoppingBag}
                  title="אין רכישות"
                />
              ) : (
                profile.orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      <Link
                        className="underline-offset-4 hover:underline"
                        href={`/admin/orders/${order.id}`}
                      >
                        {order.orderNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{order.status}</TableCell>
                    <TableCell>{order.paymentStatus}</TableCell>
                    <TableCell>{order.itemCount}</TableCell>
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
    </AdminShell>
  );
}
