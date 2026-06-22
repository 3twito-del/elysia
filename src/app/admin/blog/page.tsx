import Link from "next/link";
import { FileText, Search } from "lucide-react";

import {
  AdminBlogPostCreateForm,
  AdminBlogTaxonomyForms,
} from "../_components/admin-blog-actions";
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
import { hasAdminPermission } from "~/server/auth/admin-access";
import { listAdminBlogPosts } from "~/server/services/admin-blog";
import { TRPCReactProvider } from "~/trpc/react";

export const metadata = {
  title: "Blog | Admin",
};

export const dynamic = "force-dynamic";

type AdminBlogPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const blogStatuses = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function optionalParam(value: string | string[] | undefined) {
  const param = firstParam(value);

  return param && param.length > 0 ? param : undefined;
}

export default async function AdminBlogPage({
  searchParams,
}: AdminBlogPageProps) {
  const access = await getAdminPageAccess("BLOG_READ", "/admin/blog");

  if (access.denied) return <AdminForbidden {...access.denied} />;

  const query = await searchParams;
  const params = {
    page: Number(firstParam(query.page) ?? 1),
    pageSize: 20,
    query: optionalParam(query.query),
    sort:
      (firstParam(query.sort) as
        | "updated-desc"
        | "published-desc"
        | "title-asc"
        | undefined) ?? "updated-desc",
    status: optionalParam(query.status) as
      | (typeof blogStatuses)[number]
      | undefined,
  };
  const blog = await listAdminBlogPosts(params).catch((error: unknown) => {
    if (process.env.NODE_ENV === "development") {
      console.error("[admin] failed to load blog", error);
    }

    return null;
  });

  if (!blog) return <AdminDatabaseFallback />;

  const canWrite = hasAdminPermission(access.admin, "BLOG_WRITE");
  const hasActiveFilters = [
    Boolean(params.query),
    params.page > 1,
    params.sort !== "updated-desc",
    Boolean(params.status),
  ].some(Boolean);

  return (
    <AdminShell
      active="blog"
      admin={access.admin}
      description="ניהול מאמרים, טיוטות, SEO, קטגוריות, תגיות ומוצרים קשורים למגזין Elysia."
      title="מגזין"
    >
      <TRPCReactProvider>
        <Card className="rounded-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search aria-hidden="true" className="size-5" />
              חיפוש וסינון
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              action="/admin/blog"
              className="grid gap-3 md:grid-cols-[1fr_160px_160px_auto_auto]"
            >
              <Input
                aria-label="חיפוש מאמרים"
                defaultValue={params.query}
                name="query"
                placeholder="כותרת, slug או תקציר"
              />
              <select
                aria-label="סינון סטטוס מאמר"
                autoComplete="off"
                className="glass-control h-11 rounded-md border px-3 text-sm"
                defaultValue={params.status ?? ""}
                name="status"
              >
                <option value="">כל הסטטוסים</option>
                {blogStatuses.map((status) => (
                  <option key={status} value={status}>
                    {getBlogStatusLabel(status)}
                  </option>
                ))}
              </select>
              <select
                aria-label="מיון מאמרים"
                autoComplete="off"
                className="glass-control h-11 rounded-md border px-3 text-sm"
                defaultValue={params.sort}
                name="sort"
              >
                <option value="updated-desc">עודכן לאחרונה</option>
                <option value="published-desc">פורסם לאחרונה</option>
                <option value="title-asc">כותרת א-ת</option>
              </select>
              <Button type="submit">סינון</Button>
              {hasActiveFilters ? (
                <Button asChild variant="outline">
                  <Link href="/admin/blog">ניקוי</Link>
                </Button>
              ) : null}
            </form>
          </CardContent>
        </Card>

        {canWrite ? (
          <>
            <Card className="mt-6 rounded-md">
              <CardHeader>
                <CardTitle>כותבים, קטגוריות ותגיות</CardTitle>
              </CardHeader>
              <CardContent>
                <AdminBlogTaxonomyForms />
              </CardContent>
            </Card>

            <Card className="mt-6 rounded-md">
              <CardHeader>
                <CardTitle>יצירת מאמר</CardTitle>
              </CardHeader>
              <CardContent>
                <AdminBlogPostCreateForm options={blog} />
              </CardContent>
            </Card>
          </>
        ) : null}

        <Card className="mt-6 rounded-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText aria-hidden="true" className="size-5" />
              מאמרים
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AdminTableScrollHint />
            <Table className="min-w-[920px]">
              <TableHeader>
                <TableRow>
                  <TableHead>מאמר</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead>קטגוריה</TableHead>
                  <TableHead>תגיות</TableHead>
                  <TableHead>פרסום</TableHead>
                  <TableHead>פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {blog.posts.length === 0 ? (
                  <TableEmptyRow
                    action={
                      hasActiveFilters ? (
                        <Button asChild size="sm" variant="outline">
                          <Link href="/admin/blog">ניקוי סינון</Link>
                        </Button>
                      ) : undefined
                    }
                    colSpan={6}
                    description="צרו מאמר ראשון או שנו את הסינון."
                    icon={FileText}
                    title="אין מאמרים מתאימים"
                  />
                ) : (
                  blog.posts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell>
                        <div className="grid min-w-72 gap-1">
                          <Link
                            className="font-medium underline-offset-4 hover:underline"
                            href={`/admin/blog/${post.id}`}
                          >
                            {post.title}
                          </Link>
                          <span className="text-muted-foreground text-xs">
                            {post.slug}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {getBlogStatusLabel(post.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>{post.categoryName ?? "ללא"}</TableCell>
                      <TableCell>{post.tagNames.join(", ") || "ללא"}</TableCell>
                      <TableCell>{formatDate(post.publishedAt)}</TableCell>
                      <TableCell>
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/admin/blog/${post.id}`}>עריכה</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <AdminPagination
              basePath="/admin/blog"
              pageInfo={blog.pageInfo}
              searchParams={{
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

function getBlogStatusLabel(status: string) {
  if (status === "PUBLISHED") return "פורסם";
  if (status === "ARCHIVED") return "ארכיון";

  return "טיוטה";
}

function formatDate(value: Date | null) {
  if (!value) return "לא פורסם";

  return new Intl.DateTimeFormat("he-IL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}
