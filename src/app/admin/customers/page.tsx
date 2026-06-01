import Link from "next/link";
import { Search, Users } from "lucide-react";

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
import { formatHebrewDate, formatPrice } from "~/lib/format";
import {
  listAdminCustomers,
  recordAdminCustomerDataAccess,
} from "~/server/services/admin-operations";

export const metadata = {
  title: "Customers | Admin",
};

export const dynamic = "force-dynamic";

type AdminCustomersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function optionalParam(value: string | string[] | undefined) {
  const param = firstParam(value);

  return param && param.length > 0 ? param : undefined;
}

export default async function AdminCustomersPage({
  searchParams,
}: AdminCustomersPageProps) {
  const access = await getAdminPageAccess("CUSTOMER_VIEW", "/admin/customers");

  if (access.denied) return <AdminForbidden {...access.denied} />;

  const query = await searchParams;
  const params = {
    page: Number(firstParam(query.page) ?? 1),
    pageSize: 25,
    query: optionalParam(query.query),
    sort:
      (firstParam(query.sort) as
        | "updated-desc"
        | "orders-desc"
        | "ltv-desc"
        | undefined) ?? "updated-desc",
  };
  const data = await listAdminCustomers(params).catch((error: unknown) => {
    if (process.env.NODE_ENV === "development") {
      console.error("[admin] failed to load customers", error);
    }

    return null;
  });

  if (!data) return <AdminDatabaseFallback />;

  await recordAdminCustomerDataAccess({
    adminUserId: access.admin.id,
    page: data.pageInfo.page,
    pageSize: data.pageInfo.pageSize,
    query: params.query,
    resultCount: data.items.length,
    totalItems: data.pageInfo.totalItems,
  }).catch((error: unknown) => {
    if (process.env.NODE_ENV === "development") {
      console.error("[admin] failed to audit customer access", error);
    }
  });

  const hasActiveFilters = [
    Boolean(params.query),
    params.sort !== "updated-desc",
    params.page > 1,
  ].some(Boolean);
  const activeFilterLabels = [
    params.query ? `חיפוש: ${params.query}` : null,
    params.sort !== "updated-desc"
      ? `מיון: ${getCustomerSortLabel(params.sort)}`
      : null,
    params.page > 1 ? `עמוד ${params.page}` : null,
  ].filter((label): label is string => Boolean(label));
  const emptyTitle = hasActiveFilters
    ? "אין לקוחות שמתאימים לסינון"
    : "אין לקוחות";
  const emptyDescription = hasActiveFilters
    ? "לא נמצאו לקוחות לפי הסינון הנוכחי. נקו סינון או שנו חיפוש כדי לחזור לרשימת הלקוחות המלאה."
    : "חשבונות לקוח יופיעו לאחר כניסה, תור או הזמנה.";

  return (
    <AdminShell
      active="customers"
      admin={access.admin}
      description="תצוגת שירות לקוחות לפי פרטי קשר, היסטוריית הזמנות, LTV, wishlist, כתובות ותורים."
      title="לקוחות"
    >
      <Card className="rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search aria-hidden="true" className="size-5" />
            סינון לקוחות
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            action="/admin/customers"
            className="grid gap-3 md:grid-cols-[1fr_180px_auto_auto]"
          >
            <Input
              aria-label="חיפוש לקוחות"
              defaultValue={params.query}
              name="query"
              placeholder="שם, אימייל או טלפון"
            />
            <select
              aria-label="מיון לקוחות"
              autoComplete="off"
              className="glass-control h-11 rounded-md border px-3 text-sm"
              defaultValue={params.sort}
              name="sort"
            >
              <option value="updated-desc">עודכנו לאחרונה</option>
              <option value="orders-desc">מספר הזמנות</option>
              <option value="ltv-desc">LTV גבוה</option>
            </select>
            <Button type="submit">סינון</Button>
            {hasActiveFilters ? (
              <Button asChild variant="outline">
                <Link href="/admin/customers">ניקוי</Link>
              </Button>
            ) : null}
          </form>
          {hasActiveFilters ? (
            <div
              className="text-muted-foreground mt-4 flex flex-wrap items-center gap-2 text-sm"
              data-testid="admin-customer-active-filters"
            >
              <span className="text-foreground font-medium">סינון פעיל</span>
              {activeFilterLabels.map((label) => (
                <Badge key={label} variant="outline">
                  {label}
                </Badge>
              ))}
              <Button asChild size="sm" variant="ghost">
                <Link href="/admin/customers">ניקוי סינון</Link>
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="mt-6 rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users aria-hidden="true" className="size-5" />
            לקוחות
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AdminTableScrollHint />
          <Table className="min-w-[860px]">
            <TableHeader>
              <TableRow>
                <TableHead>לקוח</TableHead>
                <TableHead>הזמנות</TableHead>
                <TableHead>פתוחות</TableHead>
                <TableHead>LTV</TableHead>
                <TableHead>מועדפים</TableHead>
                <TableHead>כתובות</TableHead>
                <TableHead>תורים</TableHead>
                <TableHead>עודכן</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.length === 0 ? (
                <TableEmptyRow
                  action={
                    hasActiveFilters ? (
                      <Button asChild size="sm" variant="outline">
                        <Link href="/admin/customers">ניקוי סינון</Link>
                      </Button>
                    ) : undefined
                  }
                  colSpan={8}
                  description={emptyDescription}
                  icon={Users}
                  title={emptyTitle}
                />
              ) : (
                data.items.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="grid gap-1">
                        <span className="font-medium">
                          {customer.name
                            ? customer.name
                            : (customer.email ?? "-")}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {customer.phone ?? customer.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{customer.orders}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{customer.openOrders}</Badge>
                    </TableCell>
                    <TableCell>{formatPrice(customer.lifetimeValue)}</TableCell>
                    <TableCell>{customer.wishlistItems}</TableCell>
                    <TableCell>{customer.addresses}</TableCell>
                    <TableCell>{customer.appointments}</TableCell>
                    <TableCell>
                      {formatHebrewDate(customer.updatedAt)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <AdminPagination
            basePath="/admin/customers"
            pageInfo={data.pageInfo}
            searchParams={{ query: params.query, sort: params.sort }}
          />
        </CardContent>
      </Card>
    </AdminShell>
  );
}

function getCustomerSortLabel(
  sort: "updated-desc" | "orders-desc" | "ltv-desc",
) {
  switch (sort) {
    case "orders-desc":
      return "מספר הזמנות";
    case "ltv-desc":
      return "LTV גבוה";
    case "updated-desc":
      return "עודכנו לאחרונה";
  }
}
