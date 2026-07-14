import Image from "next/image";
import Link from "next/link";
import { PackageCheck, Search, ShieldAlert } from "lucide-react";

import {
  AdminProductCreateForm,
  AdminProductCommerceForm,
  AdminProductStatusAction,
} from "../_components/admin-catalog-actions";
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
import { getProductStatusLabel } from "~/lib/commerce-labels";
import { formatPrice } from "~/lib/format";
import {
  type CatalogQualitySeverity,
  getCatalogQualitySnapshot,
} from "~/server/services/catalog-quality";
import { listAdminCatalog } from "~/server/services/admin-operations";
import { TRPCReactProvider } from "~/trpc/react";

const qualitySeverityLabel: Record<CatalogQualitySeverity, string> = {
  blocker: "חוסם",
  high: "גבוה",
  medium: "בינוני",
  info: "מידע",
};

const qualitySeverityBadgeVariant: Record<
  CatalogQualitySeverity,
  "destructive" | "secondary" | "outline"
> = {
  blocker: "destructive",
  high: "destructive",
  medium: "secondary",
  info: "outline",
};

export const metadata = {
  title: "Catalog | Admin",
};

export const dynamic = "force-dynamic";

type AdminCatalogPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const productStatuses = ["DRAFT", "ACTIVE", "ARCHIVED"] as const;

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function optionalParam(value: string | string[] | undefined) {
  const param = firstParam(value);

  return param && param.length > 0 ? param : undefined;
}

export default async function AdminCatalogPage({
  searchParams,
}: AdminCatalogPageProps) {
  const access = await getAdminPageAccess("CATALOG_READ", "/admin/catalog");

  if (access.denied) return <AdminForbidden {...access.denied} />;

  const query = await searchParams;
  const params = {
    categoryId: optionalParam(query.categoryId),
    page: Number(firstParam(query.page) ?? 1),
    pageSize: 20,
    query: optionalParam(query.query),
    sort:
      (firstParam(query.sort) as
        | "updated-desc"
        | "name-asc"
        | "price-desc"
        | "price-asc"
        | undefined) ?? "updated-desc",
    status: optionalParam(query.status) as
      | (typeof productStatuses)[number]
      | undefined,
  };
  const catalog = await listAdminCatalog(params).catch((error: unknown) => {
    if (process.env.NODE_ENV === "development") {
      console.error("[admin] failed to load catalog", error);
    }

    return null;
  });

  if (!catalog) return <AdminDatabaseFallback />;

  // The quality rollup is a supplementary reporting surface, not the primary
  // catalog-management job of this page — a failure here must never block the
  // product list/search/create tools above from rendering.
  const quality = await getCatalogQualitySnapshot().catch((error: unknown) => {
    if (process.env.NODE_ENV === "development") {
      console.error("[admin] failed to load catalog quality snapshot", error);
    }

    return null;
  });

  const hasActiveFilters = [
    Boolean(params.categoryId),
    Boolean(params.query),
    params.sort !== "updated-desc",
    Boolean(params.status),
    params.page > 1,
  ].some(Boolean);

  return (
    <AdminShell
      active="catalog"
      admin={access.admin}
      description="ניהול מוצרים, סטטוסים, מחירים בסיסיים ויצירת מוצרי תפעול. מלאי מפורט מנוהל במסך המלאי."
      title="קטלוג"
    >
      <TRPCReactProvider>
        {quality ? (
          <Card className="rounded-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert aria-hidden="true" className="size-5" />
                איכות קטלוג
                <Badge variant={quality.report.ready ? "secondary" : "destructive"}>
                  {quality.report.ready ? "מוכן לפרסום" : "לא מוכן לפרסום"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-4">
                <div className="glass-inset rounded-md border p-3">
                  <dt className="text-muted-foreground text-xs">מוצרים שנבדקו</dt>
                  <dd className="text-xl font-semibold">
                    {quality.report.productCount}
                  </dd>
                </div>
                <div className="glass-inset rounded-md border p-3">
                  <dt className="text-muted-foreground text-xs">מוכנים לפרסום</dt>
                  <dd className="text-xl font-semibold">
                    {quality.report.publishReadyCount}
                  </dd>
                </div>
                <div className="glass-inset rounded-md border p-3">
                  <dt className="text-muted-foreground text-xs">חסימות ברמת מוצר</dt>
                  <dd className="text-destructive text-xl font-semibold">
                    {quality.report.totalBlockers}
                  </dd>
                </div>
                <div className="glass-inset rounded-md border p-3">
                  <dt className="text-muted-foreground text-xs">
                    ממצאים בחומרה גבוהה
                  </dt>
                  <dd className="text-xl font-semibold">
                    {quality.report.totalHigh}
                  </dd>
                </div>
              </dl>

              {quality.report.findingBreakdown.length > 0 ? (
                <div className="mt-6">
                  <h3 className="mb-2 text-sm font-medium">ממצאים לפי בעלים</h3>
                  <AdminTableScrollHint />
                  <Table className="min-w-[760px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>חומרה</TableHead>
                        <TableHead>קוד ממצא</TableHead>
                        <TableHead>כמות</TableHead>
                        <TableHead>מוצרים מושפעים</TableHead>
                        <TableHead>בעלים אחראי</TableHead>
                        <TableHead>מוצרים לדוגמה</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quality.report.findingBreakdown.map((finding) => (
                        <TableRow key={finding.code}>
                          <TableCell>
                            <Badge
                              variant={qualitySeverityBadgeVariant[finding.severity]}
                            >
                              {qualitySeverityLabel[finding.severity]}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {finding.code}
                          </TableCell>
                          <TableCell>{finding.count}</TableCell>
                          <TableCell>{finding.affectedProducts}</TableCell>
                          <TableCell>{finding.ownerRole}</TableCell>
                          <TableCell className="text-muted-foreground text-xs">
                            {finding.sampleProducts.join(", ") || "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : null}

              {quality.report.classBreakdown.length > 0 ? (
                <div className="mt-6">
                  <h3 className="mb-2 text-sm font-medium">
                    ממצאים לפי סוג מוצר
                  </h3>
                  <AdminTableScrollHint />
                  <Table className="min-w-[560px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>סוג מוצר</TableHead>
                        <TableHead>מוצרים</TableHead>
                        <TableHead>מוכנים לפרסום</TableHead>
                        <TableHead>חסימות</TableHead>
                        <TableHead>חומרה גבוהה</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quality.report.classBreakdown.map((group) => (
                        <TableRow key={group.productClass}>
                          <TableCell className="font-mono text-xs">
                            {group.productClass}
                          </TableCell>
                          <TableCell>{group.products}</TableCell>
                          <TableCell>{group.publishReady}</TableCell>
                          <TableCell className="text-destructive">
                            {group.blockers}
                          </TableCell>
                          <TableCell>{group.high}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        <Card className="mt-6 rounded-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search aria-hidden="true" className="size-5" />
              חיפוש וסינון
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              action="/admin/catalog"
              className="grid gap-3 md:grid-cols-[1fr_repeat(3,160px)_auto_auto]"
            >
              <Input
                aria-label="חיפוש מוצרים"
                defaultValue={params.query}
                name="query"
                placeholder="שם מוצר, SKU או slug"
              />
              <select
                aria-label="סינון לפי סטטוס מוצר"
                autoComplete="off"
                className="glass-control h-11 rounded-md border px-3 text-sm"
                defaultValue={params.status ?? ""}
                name="status"
              >
                <option value="">כל הסטטוסים</option>
                {productStatuses.map((status) => (
                  <option key={status} value={status}>
                    {getProductStatusLabel(status)}
                  </option>
                ))}
              </select>
              <select
                aria-label="סינון לפי קטגוריה"
                autoComplete="off"
                className="glass-control h-11 rounded-md border px-3 text-sm"
                defaultValue={params.categoryId ?? ""}
                name="categoryId"
              >
                <option value="">כל הקטגוריות</option>
                {catalog.categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <select
                aria-label="מיון מוצרים"
                autoComplete="off"
                className="glass-control h-11 rounded-md border px-3 text-sm"
                defaultValue={params.sort}
                name="sort"
              >
                <option value="updated-desc">עודכן לאחרונה</option>
                <option value="name-asc">שם א-ת</option>
                <option value="price-desc">מחיר גבוה</option>
                <option value="price-asc">מחיר נמוך</option>
              </select>
              <Button type="submit">סינון</Button>
              {hasActiveFilters ? (
                <Button asChild variant="outline">
                  <Link href="/admin/catalog">ניקוי</Link>
                </Button>
              ) : null}
            </form>
          </CardContent>
        </Card>

        <Card className="mt-6 rounded-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PackageCheck aria-hidden="true" className="size-5" />
              יצירת מוצר
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AdminProductCreateForm catalog={catalog} />
          </CardContent>
        </Card>

        <Card className="mt-6 rounded-md">
          <CardHeader>
            <CardTitle>מוצרים</CardTitle>
          </CardHeader>
          <CardContent>
            <AdminTableScrollHint />
            <Table className="min-w-[920px]">
              <TableHeader>
                <TableRow>
                  <TableHead>מוצר</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead>קטגוריה</TableHead>
                  <TableHead>חומר</TableHead>
                  <TableHead>מחיר</TableHead>
                  <TableHead>וריאציות</TableHead>
                  <TableHead>פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {catalog.products.length === 0 ? (
                  <TableEmptyRow
                    action={
                      hasActiveFilters ? (
                        <Button asChild size="sm" variant="outline">
                          <Link href="/admin/catalog">ניקוי סינון</Link>
                        </Button>
                      ) : undefined
                    }
                    colSpan={7}
                    description="שנו סינון או צרו מוצר ראשון."
                    icon={PackageCheck}
                    title="אין מוצרים מתאימים"
                  />
                ) : (
                  catalog.products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex min-w-64 items-center gap-3">
                          <span className="bg-muted relative size-12 shrink-0 overflow-hidden rounded-md border">
                            <Image
                              alt=""
                              className="object-cover"
                              fill
                              sizes="48px"
                              src={product.image}
                            />
                          </span>
                          <div className="grid min-w-0 gap-1">
                            <Link
                              className="truncate font-medium underline-offset-4 hover:underline"
                              href={`/product/${product.slug}`}
                            >
                              {product.name}
                            </Link>
                            <span className="text-muted-foreground text-xs">
                              {product.sku}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {getProductStatusLabel(product.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>{product.categoryName}</TableCell>
                      <TableCell>{product.materialName}</TableCell>
                      <TableCell>{formatPrice(product.basePrice)}</TableCell>
                      <TableCell>{product.variants.length}</TableCell>
                      <TableCell>
                        <AdminProductStatusAction
                          publishBlockers={product.publishBlockers}
                          productId={product.id}
                          status={product.status}
                        />
                        <AdminProductCommerceForm product={product} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <AdminPagination
              basePath="/admin/catalog"
              pageInfo={catalog.pageInfo}
              searchParams={{
                categoryId: params.categoryId,
                query: params.query,
                sort: params.sort,
                status: params.status,
              }}
            />
          </CardContent>
        </Card>
      </TRPCReactProvider>
    </AdminShell>
  );
}
