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
import { formatPrice } from "~/lib/format";
import { listAdminCustomers } from "~/server/services/admin-operations";

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

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("he-IL", { dateStyle: "short" }).format(date);
}

export default async function AdminCustomersPage({
  searchParams,
}: AdminCustomersPageProps) {
  const access = await getAdminPageAccess("CUSTOMER_VIEW");

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
            <Search className="size-5" />
            סינון לקוחות
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            action="/admin/customers"
            className="grid gap-3 md:grid-cols-[1fr_180px_auto]"
          >
            <Input
              defaultValue={params.query}
              name="query"
              placeholder="שם, אימייל או טלפון"
            />
            <select
              className="glass-control h-11 rounded-md border px-3 text-sm"
              defaultValue={params.sort}
              name="sort"
            >
              <option value="updated-desc">עודכנו לאחרונה</option>
              <option value="orders-desc">מספר הזמנות</option>
              <option value="ltv-desc">LTV גבוה</option>
            </select>
            <Button type="submit">סינון</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-6 rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-5" />
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
                  colSpan={8}
                  description="חשבונות לקוח יופיעו לאחר כניסה, תור או הזמנה."
                  icon={Users}
                  title="אין לקוחות מתאימים"
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
                    <TableCell>{formatDate(customer.updatedAt)}</TableCell>
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
