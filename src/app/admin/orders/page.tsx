import Link from "next/link";
import { ClipboardList, ExternalLink, Search } from "lucide-react";

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
import { formatHebrewDateTime, formatPrice } from "~/lib/format";
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

export default async function AdminOrdersPage({
  searchParams,
}: AdminOrdersPageProps) {
  const access = await getAdminPageAccess("ORDERS_READ", "/admin/orders");

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

  const showPhysicalBranches = data.physicalBranchesEnabled;
  const hasActiveFilters = [
    showPhysicalBranches && Boolean(params.branchId),
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
      description={
        showPhysicalBranches
          ? "ניהול הזמנות לפי סטטוס, מיקום פיזי, אופן מסירה ותאריך. כל טיפול עמוק מתבצע ממסך פרטי ההזמנה כדי לשמור על audit ותמונה תפעולית מלאה."
          : "ניהול הזמנות לפי סטטוס, משלוח ותאריך. כל טיפול עמוק מתבצע ממסך פרטי ההזמנה כדי לשמור על audit ותמונה תפעולית מלאה."
      }
      title="הזמנות"
    >
      <Card className="rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search aria-hidden="true" className="size-5" />
            סינון הזמנות
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            action="/admin/orders"
            className={
              showPhysicalBranches
                ? "grid gap-3 md:grid-cols-[1fr_repeat(4,160px)_auto_auto]"
                : "grid gap-3 md:grid-cols-[1fr_repeat(3,160px)_auto_auto]"
            }
          >
            <Input
              aria-label="חיפוש הזמנות"
              defaultValue={params.query}
              name="query"
              placeholder="מספר הזמנה, לקוח, אימייל או טלפון"
            />
            <select
              aria-label="סינון לפי סטטוס הזמנה"
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
            {showPhysicalBranches ? (
              <select
                aria-label="סינון לפי מיקום פיזי"
                className="glass-control h-11 rounded-md border px-3 text-sm"
                defaultValue={params.branchId ?? ""}
                name="branchId"
              >
                <option value="">כל המיקומים</option>
                {data.branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            ) : null}
            <select
              aria-label="סינון לפי אופן מסירה"
              className="glass-control h-11 rounded-md border px-3 text-sm"
              defaultValue={params.fulfillmentMethod ?? ""}
              name="fulfillmentMethod"
            >
              <option value="">כל המסירות</option>
              <option value="DELIVERY">משלוח</option>
              {showPhysicalBranches ? (
                <option value="PICKUP">תיאום הגעה</option>
              ) : null}
            </select>
            <select
              aria-label="מיון הזמנות"
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
          <p className="text-muted-foreground mt-3 text-xs leading-5">
            סטטוס, מסירה ומיקום מסננים את תור ההזמנות המקומיות. חיפוש חופשי כולל
            גם רשומות Shopify mirror לקריאה בלבד.
          </p>
        </CardContent>
      </Card>

      <Card className="mt-6 rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList aria-hidden="true" className="size-5" />
            תור עבודה
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AdminTableScrollHint />
          <Table className="min-w-[1120px]">
            <TableHeader>
              <TableRow>
                <TableHead>מספר</TableHead>
                <TableHead>מקור</TableHead>
                <TableHead>לקוח</TableHead>
                <TableHead>סכום</TableHead>
                <TableHead>סטטוס</TableHead>
                <TableHead>תשלום</TableHead>
                <TableHead>
                  {showPhysicalBranches ? "מיקום פיזי" : "שירות"}
                </TableHead>
                <TableHead>מסירה</TableHead>
                <TableHead>תאריך</TableHead>
                <TableHead>פעולה</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.length === 0 ? (
                <TableEmptyRow
                  action={
                    hasActiveFilters ? (
                      <Button asChild size="sm" variant="outline">
                        <Link href="/admin/orders">ניקוי סינון</Link>
                      </Button>
                    ) : undefined
                  }
                  colSpan={10}
                  description="שנו סינון או המתינו להזמנות חדשות מהאתר."
                  icon={ClipboardList}
                  title="אין הזמנות מתאימות"
                />
              ) : (
                data.items.map((order) => (
                  <TableRow data-testid="admin-local-order-row" key={order.id}>
                    <TableCell className="font-medium">
                      {order.orderNumber}
                    </TableCell>
                    <TableCell>
                      <div className="grid gap-1">
                        <Badge variant="secondary">{order.sourceLabel}</Badge>
                        <span className="text-muted-foreground text-xs">
                          {order.sourceDescription}
                        </span>
                      </div>
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
                        {showPhysicalBranches && order.branchCity ? (
                          <span className="text-muted-foreground text-xs">
                            {order.branchCity}
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getFulfillmentMethodLabel(order.fulfillmentMethod)}
                    </TableCell>
                    <TableCell>
                      {formatHebrewDateTime(order.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/admin/orders/${order.id}`}>
                          טיפול מקומי
                        </Link>
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
              branchId: showPhysicalBranches ? params.branchId : undefined,
              fulfillmentMethod: params.fulfillmentMethod,
              query: params.query,
              sort: params.sort,
              status: params.status,
            }}
          />
        </CardContent>
      </Card>

      {data.shopifyMirrors.length > 0 ? (
        <Card className="mt-6 rounded-md" data-testid="admin-shopify-mirrors">
          <CardHeader className="gap-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle>הזמנות ספק מ-Shopify</CardTitle>
              <Badge variant="outline">לצפייה בלבד</Badge>
            </div>
            <p className="text-muted-foreground text-sm leading-6">
              רשומות mirror לקריאה בלבד. Capture, refund ו-fulfillment להזמנות
              ספק מתבצעים ב-Shopify עד שתהיה אינטגרציית פעולות מלאה.
            </p>
          </CardHeader>
          <CardContent>
            <AdminTableScrollHint />
            <Table className="min-w-[1040px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Shopify</TableHead>
                  <TableHead>מקור</TableHead>
                  <TableHead>לקוח</TableHead>
                  <TableHead>סכום</TableHead>
                  <TableHead>תשלום</TableHead>
                  <TableHead>מילוי</TableHead>
                  <TableHead>ספק</TableHead>
                  <TableHead>תאריך</TableHead>
                  <TableHead>פעולה</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.shopifyMirrors.map((order) => (
                  <TableRow
                    data-testid="admin-shopify-mirror-row"
                    key={order.id}
                  >
                    <TableCell className="font-medium">
                      {order.shopifyOrderName ?? order.shopifyOrderId}
                    </TableCell>
                    <TableCell>
                      <div className="grid gap-1">
                        <Badge variant="secondary">{order.sourceLabel}</Badge>
                        {order.readOnly ? (
                          <Badge className="w-fit" variant="outline">
                            לקריאה בלבד
                          </Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>{order.customerEmail ?? "-"}</TableCell>
                    <TableCell>{formatPrice(order.total)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {order.financialStatusLabel}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {order.fulfillmentStatusLabel}
                      </Badge>
                    </TableCell>
                    <TableCell>{order.supplierKey ?? "shopify"}</TableCell>
                    <TableCell>
                      {formatHebrewDateTime(order.createdAt)}
                    </TableCell>
                    <TableCell>
                      {order.adminUrl ? (
                        <Button asChild size="sm" variant="outline">
                          <Link
                            href={order.adminUrl}
                            rel="noreferrer"
                            target="_blank"
                          >
                            פתיחה ב-Shopify
                            <ExternalLink
                              aria-hidden="true"
                              className="size-3.5"
                            />
                          </Link>
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-xs">
                          לקריאה בלבד
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : data.shopifyMirrorsHiddenByLocalFilters ? (
        <Card className="mt-6 rounded-md">
          <CardContent className="p-4">
            <p className="text-muted-foreground text-sm leading-6">
              רשומות Shopify mirror מוסתרות בזמן שסינוני סטטוס, מסירה או מיקום
              מקומיים פעילים. נקו את הסינון כדי להציג הזמנות ספק לקריאה בלבד.
            </p>
          </CardContent>
        </Card>
      ) : null}
    </AdminShell>
  );
}
