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
import { formatHebrewDateTime } from "~/lib/format";
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

export default async function AdminInventoryPage({
  searchParams,
}: AdminInventoryPageProps) {
  const access = await getAdminPageAccess("INVENTORY_READ", "/admin/inventory");

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

  const showPhysicalBranches = data.physicalBranchesEnabled;
  const hasActiveFilters = [
    showPhysicalBranches && Boolean(params.branchId),
    Boolean(params.query),
    params.sort !== "updated-desc",
    params.page > 1,
  ].some(Boolean);
  const activeFilterLabels = [
    params.query ? `חיפוש: ${params.query}` : null,
    showPhysicalBranches && params.branchId
      ? `מיקום: ${
          data.branches.find((branch) => branch.id === params.branchId)?.name ??
          "מיקום לא זמין"
        }`
      : null,
    params.sort !== "updated-desc"
      ? `מיון: ${getInventorySortLabel(params.sort)}`
      : null,
    params.page > 1 ? `עמוד ${params.page}` : null,
  ].filter((label): label is string => Boolean(label));
  const lowStockItems = data.items
    .filter((item) => item.sellable <= item.safetyStock)
    .slice(0, 3);
  const emptyTitle = hasActiveFilters
    ? "אין פריטי מלאי שמתאימים לסינון"
    : "אין פריטי מלאי";
  const emptyDescription = hasActiveFilters
    ? "לא נמצאו פריטי מלאי לפי הסינון הנוכחי. נקו סינון או שנו חיפוש כדי לחזור לרשימת המלאי המלאה."
    : "הגדירו מלאי דרך יצירת מוצר או עריכת מלאי כדי להתחיל מעקב.";

  return (
    <AdminShell
      active="inventory"
      admin={access.admin}
      description={
        showPhysicalBranches
          ? "ניהול מלאי לפי מיקום פיזי ווריאציה, כולל שמורות, safety stock ומלאי זמין למכירה."
          : "ניהול מלאי שירות אונליין לפי וריאציה, כולל שמורות, safety stock ומלאי זמין למכירה."
      }
      title={showPhysicalBranches ? "מלאי מיקומים" : "מלאי שירות"}
    >
      <TRPCReactProvider>
        <Card className="rounded-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search aria-hidden="true" className="size-5" />
              סינון מלאי
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              action="/admin/inventory"
              className={
                showPhysicalBranches
                  ? "grid gap-3 md:grid-cols-[1fr_180px_180px_auto_auto]"
                  : "grid gap-3 md:grid-cols-[1fr_180px_auto_auto]"
              }
            >
              <Input
                aria-label="חיפוש מלאי"
                defaultValue={params.query}
                name="query"
                placeholder={
                  showPhysicalBranches ? "מוצר, SKU או מיקום" : "מוצר או SKU"
                }
              />
              {showPhysicalBranches ? (
                <select
                  aria-label="סינון לפי מיקום פיזי"
                  autoComplete="off"
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
                aria-label="מיון מלאי"
                autoComplete="off"
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
            {hasActiveFilters ? (
              <div
                className="text-muted-foreground mt-4 flex flex-wrap items-center gap-2 text-sm"
                data-testid="admin-inventory-active-filters"
              >
                <span className="text-foreground font-medium">סינון פעיל</span>
                {activeFilterLabels.map((label) => (
                  <Badge key={label} variant="outline">
                    {label}
                  </Badge>
                ))}
                <Button asChild size="sm" variant="ghost">
                  <Link href="/admin/inventory">ניקוי סינון</Link>
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="mt-6 rounded-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Boxes aria-hidden="true" className="size-5" />
              מלאי
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockItems.length > 0 ? (
              <div
                className="mb-4 grid gap-3 rounded-md border border-[var(--glass-border)] p-3 text-sm"
                data-testid="admin-inventory-low-stock-recovery"
              >
                <div>
                  <p className="font-medium">פריטים לבדיקה תפעולית</p>
                  <p className="text-muted-foreground mt-1 leading-6">
                    הפריטים הבאים נמצאים במלאי זמין נמוך או מתחת למלאי הביטחון
                    ומופיעים כאן לפי הסינון הנוכחי.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {lowStockItems.map((item) => (
                    <Badge key={item.id} variant="outline">
                      {item.productName}: {getStockQuantityLabel(item.sellable)}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}
            <AdminTableScrollHint />
            <Table className="min-w-[1040px]">
              <TableHeader>
                <TableRow>
                  <TableHead>מוצר</TableHead>
                  <TableHead>
                    {showPhysicalBranches ? "מיקום פיזי" : "שירות"}
                  </TableHead>
                  <TableHead>כמות</TableHead>
                  <TableHead>שמורות</TableHead>
                  <TableHead>מלאי ביטחון</TableHead>
                  <TableHead>זמין</TableHead>
                  <TableHead>עודכן</TableHead>
                  <TableHead>עריכה</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.length === 0 ? (
                  <TableEmptyRow
                    action={
                      hasActiveFilters ? (
                        <Button asChild size="sm" variant="outline">
                          <Link href="/admin/inventory">ניקוי סינון</Link>
                        </Button>
                      ) : undefined
                    }
                    colSpan={8}
                    description={emptyDescription}
                    icon={Boxes}
                    title={emptyTitle}
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
                        {showPhysicalBranches && item.branchCity ? (
                          <span className="text-muted-foreground block text-xs">
                            {item.branchCity}
                          </span>
                        ) : null}
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
                      <TableCell>
                        {formatHebrewDateTime(item.updatedAt)}
                      </TableCell>
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
                branchId: showPhysicalBranches ? params.branchId : undefined,
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

function getInventorySortLabel(
  sort: "updated-desc" | "available-asc" | "available-desc",
) {
  switch (sort) {
    case "available-asc":
      return "זמין נמוך";
    case "available-desc":
      return "זמין גבוה";
    case "updated-desc":
      return "עודכן לאחרונה";
  }
}
