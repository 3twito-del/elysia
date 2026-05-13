import Link from "next/link";
import { ClipboardList, Search } from "lucide-react";

import { AdminShell } from "../_components/admin-shell";
import {
  AdminDatabaseFallback,
  AdminForbidden,
} from "../_components/admin-states";
import {
  AdminPagination,
  AdminTableScrollHint,
} from "../_components/admin-table-tools";
import { getAdminPageAccess } from "../_lib/access";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
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
  getFulfillmentMethodLabel,
  getOrderStatusLabel,
  getPaymentStatusLabel,
} from "~/lib/commerce-labels";
import { formatPrice } from "~/lib/format";
import { listAdminOrders } from "~/server/services/admin-operations";

export const metadata = {
  title: "Orders | Admin",
};

export const dynamic = "force-dynamic";

type AdminOrdersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const orderStatuses = [
  "PENDING_PAYMENT",
  "PAID",
  "PREPARING",
  "READY_FOR_PICKUP",
  "SHIPPED",
  "COMPLETED",
  "CANCELLED",
  "REFUNDED",
] as const;

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function optionalParam(value: string | string[] | undefined) {
  const param = firstParam(value);

  return param && param.length > 0 ? param : undefined;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("he-IL", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export default async function AdminOrdersPage({
  searchParams,
}: AdminOrdersPageProps) {
  const access = await getAdminPageAccess("ORDERS_READ");

  if (access.denied) return <AdminForbidden {...access.denied} />;

  const query = await searchParams;
  const params = {
    branchId: optionalParam(query.branchId),
    fulfillmentMethod: optionalParam(query.fulfillmentMethod) as
      | "DELIVERY"
      | "PICKUP"
      | undefined,
    page: Number(firstParam(query.page) ?? 1),
    pageSize: 20,
    query: optionalParam(query.query),
    sort:
      (firstParam(query.sort) as
        | "created-desc"
        | "created-asc"
        | "total-desc"
        | "total-asc"
        | undefined) ?? "created-desc",
    status: optionalParam(query.status) as
      | (typeof orderStatuses)[number]
      | undefined,
  };
  const data = await listAdminOrders(params).catch((error: unknown) => {
    if (process.env.NODE_ENV === "development") {
      console.error("[admin] failed to load orders", error);
    }

    return null;
  });

  if (!data) return <AdminDatabaseFallback />;

  const hasActiveFilters = [
    Boolean(params.branchId),
    Boolean(params.fulfillmentMethod),
    Boolean(params.query),
    params.sort !== "created-desc",
    Boolean(params.status),
    params.page > 1,
  ].some(Boolean);

  return (
    <AdminShell
      active="orders"
      admin={access.admin}
      description="ניהול הזמנות לפי סטטוס, סניף, אופן מסירה ותאריך. כל טיפול עמוק מתבצע ממסך פרטי ההזמנה כדי לשמור על audit ותמונה תפעולית מלאה."
      title="הזמנות"
    >
      <Card className="rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="size-5" />
            סינון הזמנות
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            action="/admin/orders"
            className="grid gap-3 md:grid-cols-[1fr_repeat(4,160px)_auto_auto]"
          >
            <Input
              defaultValue={params.query}
              name="query"
              placeholder="מספר הזמנה, לקוח, אימייל או טלפון"
            />
            <select
              className="glass-control h-11 rounded-md border px-3 text-sm"
              defaultValue={params.status ?? ""}
              name="status"
            >
              <option value="">כל הסטטוסים</option>
              {orderStatuses.map((status) => (
                <option key={status} value={status}>
                  {getOrderStatusLabel(status)}
                </option>
              ))}
            </select>
            <select
              className="glass-control h-11 rounded-md border px-3 text-sm"
              defaultValue={params.branchId ?? ""}
              name="branchId"
            >
              <option value="">כל הסניפים</option>
              {data.branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
            <select
              className="glass-control h-11 rounded-md border px-3 text-sm"
              defaultValue={params.fulfillmentMethod ?? ""}
              name="fulfillmentMethod"
            >
              <option value="">כל המסירות</option>
              <option value="DELIVERY">משלוח</option>
              <option value="PICKUP">איסוף</option>
            </select>
            <select
              className="glass-control h-11 rounded-md border px-3 text-sm"
              defaultValue={params.sort}
              name="sort"
            >
              <option value="created-desc">חדשות תחילה</option>
              <option value="created-asc">ישנות תחילה</option>
              <option value="total-desc">סכום גבוה</option>
              <option value="total-asc">סכום נמוך</option>
            </select>
            <Button type="submit">סינון</Button>
            {hasActiveFilters ? (
              <Button asChild variant="outline">
                <Link href="/admin/orders">ניקוי</Link>
              </Button>
            ) : null}
          </form>
        </CardContent>
      </Card>

      <Card className="mt-6 rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="size-5" />
            תור עבודה
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AdminTableScrollHint />
          <Table className="min-w-[1040px]">
            <TableHeader>
              <TableRow>
                <TableHead>מספר</TableHead>
                <TableHead>לקוח</TableHead>
                <TableHead>סכום</TableHead>
                <TableHead>סטטוס</TableHead>
                <TableHead>תשלום</TableHead>
                <TableHead>סניף</TableHead>
                <TableHead>מסירה</TableHead>
                <TableHead>תאריך</TableHead>
                <TableHead>פעולה</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.length === 0 ? (
                <TableEmptyRow
                  colSpan={9}
                  description="שנו סינון או המתינו להזמנות חדשות מהאתר."
                  icon={ClipboardList}
                  title="אין הזמנות מתאימות"
                />
              ) : (
                data.items.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      {order.orderNumber}
                    </TableCell>
                    <TableCell>
                      <div className="grid gap-1">
                        <span>{order.recipientName}</span>
                        <span className="text-muted-foreground text-xs">
                          {order.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{formatPrice(order.total)}</TableCell>
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
                    <TableCell>
                      <div className="grid gap-1">
                        <span>{order.branchName}</span>
                        <span className="text-muted-foreground text-xs">
                          {order.branchCity}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getFulfillmentMethodLabel(order.fulfillmentMethod)}
                    </TableCell>
                    <TableCell>{formatDate(order.createdAt)}</TableCell>
                    <TableCell>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/admin/orders/${order.id}`}>טיפול</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <AdminPagination
            basePath="/admin/orders"
            pageInfo={data.pageInfo}
            searchParams={{
              branchId: params.branchId,
              fulfillmentMethod: params.fulfillmentMethod,
              query: params.query,
              sort: params.sort,
              status: params.status,
            }}
          />
        </CardContent>
      </Card>
    </AdminShell>
  );
}
