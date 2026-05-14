import { notFound } from "next/navigation";
import {
  Boxes,
  ClipboardList,
  History,
  Mail,
  PackageCheck,
  RotateCcw,
  Truck,
  UserRound,
} from "lucide-react";

import { AdminOrderActions } from "../../_components/admin-order-actions";
import { AdminShell } from "../../_components/admin-shell";
import {
  AdminDatabaseFallback,
  AdminForbidden,
} from "../../_components/admin-states";
import { getAdminPageAccess } from "../../_lib/access";
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
import {
  getFulfillmentMethodLabel,
  getOrderStatusLabel,
  getPaymentStatusLabel,
  getReturnStatusLabel,
} from "~/lib/commerce-labels";
import { formatOptionalHebrewDateTime, formatPrice } from "~/lib/format";
import { getAdminOrderDetail } from "~/server/services/admin-operations";
import { TRPCReactProvider } from "~/trpc/react";

export const metadata = {
  title: "Order Detail | Admin",
};

export const dynamic = "force-dynamic";

type AdminOrderDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminOrderDetailPage({
  params,
}: AdminOrderDetailPageProps) {
  const access = await getAdminPageAccess("ORDERS_READ");

  if (access.denied) return <AdminForbidden {...access.denied} />;

  const { id } = await params;
  const order = await getAdminOrderDetail(id).catch((error: unknown) => {
    if (process.env.NODE_ENV === "development") {
      console.error("[admin] failed to load order detail", error);
    }

    return undefined;
  });

  if (order === undefined) return <AdminDatabaseFallback />;
  if (!order) notFound();

  return (
    <AdminShell
      active="orders"
      admin={access.admin}
      description="מסך עבודה מלא להזמנה אחת: סטטוס, תשלום, מסירה, החזרות, מלאי, אירועי outbox ו-audit."
      eyebrow={order.orderNumber}
      title={`טיפול בהזמנה ${order.orderNumber}`}
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <div className="grid gap-6">
          <Card className="rounded-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="size-5" />
                מצב הזמנה
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5">
              <div className="grid gap-3 md:grid-cols-4">
                <StatusFact
                  label="סטטוס"
                  value={getOrderStatusLabel(order.status)}
                />
                <StatusFact
                  label="מסירה"
                  value={getFulfillmentMethodLabel(order.fulfillmentMethod)}
                />
                <StatusFact
                  label="סכום"
                  value={formatPrice(order.totals.total)}
                />
                <StatusFact
                  label="נוצרה"
                  value={formatOptionalHebrewDateTime(order.createdAt)}
                />
              </div>
              <div className="grid gap-3 md:grid-cols-4">
                {order.timeline.map((event) => (
                  <div
                    className="bg-background/70 rounded-md border p-3"
                    key={event.label}
                  >
                    <p className="text-muted-foreground text-xs">
                      {event.label}
                    </p>
                    <p className="mt-1 text-sm font-medium">
                      {formatOptionalHebrewDateTime(event.at)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PackageCheck className="size-5" />
                פריטים ותשלום
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5">
              <Table className="min-w-[680px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>פריט</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>כמות</TableHead>
                    <TableHead>מחיר</TableHead>
                    <TableHead>סה״כ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.sku}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{formatPrice(item.unitPrice)}</TableCell>
                      <TableCell>
                        {formatPrice(item.unitPrice * item.quantity)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="bg-background/70 grid gap-2 rounded-md border p-4 text-sm sm:max-w-sm">
                <TotalRow label="ביניים" value={order.totals.subtotal} />
                <TotalRow label="הנחה" value={order.totals.discount} />
                <TotalRow label="משלוח" value={order.totals.shipping} />
                <TotalRow label="סה״כ" strong value={order.totals.total} />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {order.payments.map((payment) => (
                  <div
                    className="bg-background/70 rounded-md border p-3"
                    key={payment.id}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">{payment.provider}</p>
                      <Badge variant="secondary">
                        {getPaymentStatusLabel(payment.status)}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mt-2 text-sm">
                      {payment.providerStatus ?? "ללא סטטוס ספק"} ·{" "}
                      {formatPrice(payment.amount)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Boxes className="size-5" />
                מלאי, outbox ו-audit
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6">
              <OperationalList
                empty="אין שמירות מלאי פעילות להזמנה."
                icon={Boxes}
                title="שמירות מלאי"
              >
                {order.reservations.map((reservation) => (
                  <li
                    className="bg-background/70 rounded-md border p-3"
                    key={reservation.id}
                  >
                    <span className="font-medium">
                      {reservation.quantity} יח׳
                    </span>{" "}
                    · פג תוקף{" "}
                    {formatOptionalHebrewDateTime(reservation.expiresAt)} ·{" "}
                    שוחרר {formatOptionalHebrewDateTime(reservation.releasedAt)}
                  </li>
                ))}
              </OperationalList>
              <OperationalList
                empty="אין אירועי outbox להזמנה."
                icon={Mail}
                title="אירועי outbox"
              >
                {order.outboxEvents.map((event) => (
                  <li
                    className="bg-background/70 rounded-md border p-3"
                    key={event.id}
                  >
                    <span className="font-medium">{event.type}</span> ·{" "}
                    {event.status} · {event.attempts} ניסיונות
                    {event.lastError ? (
                      <p className="text-destructive mt-1 text-xs">
                        {event.lastError}
                      </p>
                    ) : null}
                  </li>
                ))}
              </OperationalList>
              <OperationalList
                empty="אין רשומות audit להזמנה."
                icon={History}
                title="Audit"
              >
                {order.auditLogs.map((log) => (
                  <li
                    className="bg-background/70 rounded-md border p-3"
                    key={log.id}
                  >
                    <span className="font-medium">{log.action}</span> ·{" "}
                    {log.adminName} ·{" "}
                    {formatOptionalHebrewDateTime(log.createdAt)}
                  </li>
                ))}
              </OperationalList>
            </CardContent>
          </Card>
        </div>

        <aside className="grid content-start gap-6">
          <Card className="rounded-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserRound className="size-5" />
                לקוח
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm">
              <p className="font-medium">{order.customer.name}</p>
              <p className="text-muted-foreground">{order.customer.email}</p>
              <p className="text-muted-foreground">{order.customer.phone}</p>
              {order.branch ? (
                <p className="text-muted-foreground mt-2">
                  {order.branch.name}, {order.branch.city}
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card className="rounded-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="size-5" />
                פעולות תפעול
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TRPCReactProvider>
                <AdminOrderActions
                  fulfillmentMethod={order.fulfillmentMethod}
                  orderId={order.id}
                  returns={order.returns}
                  shipment={order.shipments[0] ?? null}
                  status={order.status}
                />
              </TRPCReactProvider>
            </CardContent>
          </Card>

          <Card className="rounded-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RotateCcw className="size-5" />
                החזרות
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {order.returns.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  אין בקשות החזרה פתוחות.
                </p>
              ) : (
                order.returns.map((request) => (
                  <div
                    className="bg-background/70 rounded-md border p-3"
                    key={request.id}
                  >
                    <Badge variant="secondary">
                      {getReturnStatusLabel(request.status)}
                    </Badge>
                    <p className="mt-2 text-sm">{request.reason}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </AdminShell>
  );
}

function StatusFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-background/70 rounded-md border p-3">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}

function TotalRow({
  label,
  strong,
  value,
}: {
  label: string;
  strong?: boolean;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={strong ? "font-semibold" : "text-muted-foreground"}>
        {label}
      </span>
      <span className={strong ? "font-semibold" : undefined}>
        {formatPrice(value)}
      </span>
    </div>
  );
}

function OperationalList({
  children,
  empty,
  icon: Icon,
  title,
}: {
  children: React.ReactNode[];
  empty: string;
  icon: typeof Boxes;
  title: string;
}) {
  return (
    <section>
      <h3 className="mb-3 flex items-center gap-2 font-medium">
        <Icon className="size-4" />
        {title}
      </h3>
      {children.length > 0 ? (
        <ul className="grid gap-2 text-sm">{children}</ul>
      ) : (
        <p className="text-muted-foreground text-sm">{empty}</p>
      )}
    </section>
  );
}
