import Image from "next/image";
import Link from "next/link";
import { Boxes, Search } from "lucide-react";

import { AdminInventoryEditor } from "../_components/admin-catalog-actions";
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
import { getStockQuantityLabel } from "~/lib/commerce-labels";
import { listAdminInventory } from "~/server/services/admin-operations";
import { TRPCReactProvider } from "~/trpc/react";

export const metadata = {
  title: "Inventory | Admin",
};

export const dynamic = "force-dynamic";

type AdminInventoryPageProps = {
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
  return new Intl.DateTimeFormat("he-IL", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export default async function AdminInventoryPage({
  searchParams,
}: AdminInventoryPageProps) {
  const access = await getAdminPageAccess("INVENTORY_READ");

  if (access.denied) return <AdminForbidden {...access.denied} />;

  const query = await searchParams;
  const params = {
    branchId: optionalParam(query.branchId),
    page: Number(firstParam(query.page) ?? 1),
    pageSize: 25,
    query: optionalParam(query.query),
    sort:
      (firstParam(query.sort) as
        | "updated-desc"
        | "available-asc"
        | "available-desc"
        | undefined) ?? "updated-desc",
  };
  const data = await listAdminInventory(params).catch((error: unknown) => {
    if (process.env.NODE_ENV === "development") {
      console.error("[admin] failed to load inventory", error);
    }

    return null;
  });

  if (!data) return <AdminDatabaseFallback />;

  const hasActiveFilters = [
    Boolean(params.branchId),
    Boolean(params.query),
    params.sort !== "updated-desc",
    params.page > 1,
  ].some(Boolean);

  return (
    <AdminShell
      active="inventory"
      admin={access.admin}
      description="ניהול מלאי לפי סניף ווריאציה, כולל שמורות, safety stock ומלאי זמין למכירה."
      title="מלאי סניפים"
    >
      <TRPCReactProvider>
        <Card className="rounded-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="size-5" />
              סינון מלאי
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              action="/admin/inventory"
              className="grid gap-3 md:grid-cols-[1fr_180px_180px_auto_auto]"
            >
              <Input
                defaultValue={params.query}
                name="query"
                placeholder="מוצר, SKU או סניף"
              />
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
                defaultValue={params.sort}
                name="sort"
              >
                <option value="updated-desc">עודכן לאחרונה</option>
                <option value="available-asc">זמין נמוך</option>
                <option value="available-desc">זמין גבוה</option>
              </select>
              <Button type="submit">סינון</Button>
              {hasActiveFilters ? (
                <Button asChild variant="outline">
                  <Link href="/admin/inventory">ניקוי</Link>
                </Button>
              ) : null}
            </form>
          </CardContent>
        </Card>

        <Card className="mt-6 rounded-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Boxes className="size-5" />
              מלאי
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AdminTableScrollHint />
            <Table className="min-w-[1040px]">
              <TableHeader>
                <TableRow>
                  <TableHead>מוצר</TableHead>
                  <TableHead>סניף</TableHead>
                  <TableHead>כמות</TableHead>
                  <TableHead>שמורות</TableHead>
                  <TableHead>Safety</TableHead>
                  <TableHead>זמין</TableHead>
                  <TableHead>עודכן</TableHead>
                  <TableHead>עריכה</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.length === 0 ? (
                  <TableEmptyRow
                    colSpan={8}
                    description="שנו סינון או הגדירו מלאי דרך יצירת מוצר/עריכת מלאי."
                    icon={Boxes}
                    title="אין פריטי מלאי"
                  />
                ) : (
                  data.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex min-w-64 items-center gap-3">
                          <span className="bg-muted relative size-12 shrink-0 overflow-hidden rounded-md border">
                            <Image
                              alt=""
                              className="object-cover"
                              fill
                              sizes="48px"
                              src={item.productImage}
                            />
                          </span>
                          <div className="grid min-w-0 gap-1">
                            <Link
                              className="truncate font-medium underline-offset-4 hover:underline"
                              href={`/product/${item.productSlug}`}
                            >
                              {item.productName}
                            </Link>
                            <span className="text-muted-foreground text-xs">
                              {item.variant.sku}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.branchName}
                        <span className="text-muted-foreground block text-xs">
                          {item.branchCity}
                        </span>
                      </TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.reserved}</TableCell>
                      <TableCell>{item.safetyStock}</TableCell>
                      <TableCell>
                        <Badge
                          variant={item.sellable > 0 ? "secondary" : "outline"}
                        >
                          {getStockQuantityLabel(item.sellable)}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(item.updatedAt)}</TableCell>
                      <TableCell>
                        <AdminInventoryEditor
                          branchId={item.branchId}
                          quantity={item.quantity}
                          safetyStock={item.safetyStock}
                          variant={item.variant}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <AdminPagination
              basePath="/admin/inventory"
              pageInfo={data.pageInfo}
              searchParams={{
                branchId: params.branchId,
                query: params.query,
                sort: params.sort,
              }}
            />
          </CardContent>
        </Card>
      </TRPCReactProvider>
    </AdminShell>
  );
}
