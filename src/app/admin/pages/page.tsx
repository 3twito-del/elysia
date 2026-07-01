import { FileText, LayoutTemplate, Plus } from "lucide-react";
import Link from "next/link";

import { AdminShell } from "../_components/admin-shell";
import { AdminForbidden } from "../_components/admin-states";
import { getAdminPageAccess } from "../_lib/access";
import {
  addBlockAction,
  createPageAction,
  deleteBlockAction,
  moveBlockAction,
  setPageStatusAction,
} from "./actions";
import { MetricCard } from "~/components/metric-card";
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
  BLOCK_TYPES,
  getLandingPagesSummary,
  getPageBlocks,
  listLandingPages,
} from "~/server/services/landing-pages";

export const metadata = {
  title: "עמודי נחיתה | Admin",
};

export const dynamic = "force-dynamic";

const blockTypeLabel: Record<string, string> = {
  HERO: "כותרת ראשית",
  TEXT: "טקסט",
  IMAGE: "תמונה",
  CTA: "קריאה לפעולה",
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminPagesPage({ searchParams }: PageProps) {
  const access = await getAdminPageAccess("BLOG_READ", "/admin/pages");

  if (access.denied) return <AdminForbidden {...access.denied} />;

  const summary = await getLandingPagesSummary().catch(() => ({ total: 0, published: 0 }));
  const pages = await listLandingPages().catch(() => []);

  const query = await searchParams;
  const selectedId =
    typeof query.page === "string" && pages.some((page) => page.id === query.page)
      ? query.page
      : undefined;
  const blocks = selectedId ? await getPageBlocks(selectedId).catch(() => []) : [];
  const selected = pages.find((page) => page.id === selectedId);

  return (
    <AdminShell
      active="pages"
      admin={access.admin}
      description="בונה עמודי נחיתה: הרכבת בלוקים (כותרת/טקסט/תמונה/CTA) ופרסום לכתובת ציבורית."
      title="עמודי נחיתה"
    >
      <div className="grid gap-5 md:grid-cols-2">
        <MetricCard
          detail={`${summary.published} פורסמו`}
          icon={LayoutTemplate}
          label="עמודים"
          value={String(summary.total)}
        />
        <MetricCard
          detail="בלוקים: כותרת · טקסט · תמונה · CTA"
          icon={FileText}
          label="בלוקים"
          value={String(BLOCK_TYPES.length)}
        />
      </div>

      <Card className="mt-6 rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutTemplate aria-hidden="true" className="size-5" />
            עמודים
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-[1fr_1.7fr]">
          <form action={createPageAction} className="grid gap-2">
            <Input name="title" placeholder="כותרת העמוד" required />
            <Button className="w-fit" size="sm" type="submit">
              <Plus aria-hidden="true" className="size-3" />
              צור עמוד
            </Button>
          </form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>עמוד</TableHead>
                <TableHead>בלוקים</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {pages.length === 0 ? (
                <TableEmptyRow
                  colSpan={3}
                  description="טרם נוצרו עמודים."
                  icon={LayoutTemplate}
                  title="אין עמודים"
                />
              ) : (
                pages.map((page) => (
                  <TableRow key={page.id}>
                    <TableCell className="text-sm">
                      <div className="font-medium">{page.title}</div>
                      <code className="text-muted-foreground text-xs" dir="ltr">
                        /p/{page.slug}
                      </code>
                      <Badge
                        className="mt-1"
                        variant={page.status === "PUBLISHED" ? "secondary" : "outline"}
                      >
                        {page.status === "PUBLISHED" ? "פורסם" : "טיוטה"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{page.blockCount}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/admin/pages?page=${page.id}`}>ערוך</Link>
                        </Button>
                        <form action={setPageStatusAction}>
                          <input name="pageId" type="hidden" value={page.id} />
                          <input
                            name="status"
                            type="hidden"
                            value={page.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED"}
                          />
                          <Button size="sm" type="submit" variant="ghost">
                            {page.status === "PUBLISHED" ? "בטל פרסום" : "פרסם"}
                          </Button>
                        </form>
                        {page.status === "PUBLISHED" ? (
                          <Button asChild size="sm" variant="ghost">
                            <a href={`/p/${page.slug}`} target="_blank" rel="noopener noreferrer">
                              צפה
                            </a>
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selected ? (
        <Card className="mt-6 rounded-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText aria-hidden="true" className="size-5" />
              בלוקים · {selected.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 lg:grid-cols-[1fr_1.7fr]">
            <form action={addBlockAction} className="grid gap-2">
              <input name="pageId" type="hidden" value={selected.id} />
              <select
                aria-label="סוג בלוק"
                autoComplete="off"
                className="glass-control h-10 rounded-md border px-3 text-sm"
                defaultValue="TEXT"
                name="type"
              >
                {BLOCK_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {blockTypeLabel[type] ?? type}
                  </option>
                ))}
              </select>
              <Input name="heading" placeholder="כותרת (רשות)" />
              <Input name="body" placeholder="טקסט (רשות)" />
              <Input dir="ltr" name="imageUrl" placeholder="קישור תמונה (רשות)" />
              <Input dir="ltr" name="linkUrl" placeholder="קישור CTA (רשות)" />
              <Button className="w-fit" size="sm" type="submit">
                הוסף בלוק
              </Button>
            </form>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>סוג</TableHead>
                  <TableHead>תוכן</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {blocks.length === 0 ? (
                  <TableEmptyRow
                    colSpan={3}
                    description="טרם נוספו בלוקים."
                    icon={FileText}
                    title="ריק"
                  />
                ) : (
                  blocks.map((block) => (
                    <TableRow key={block.id}>
                      <TableCell className="text-xs">
                        {blockTypeLabel[block.type] ?? block.type}
                      </TableCell>
                      <TableCell className="max-w-[14rem] truncate text-sm">
                        {block.heading ?? block.body ?? block.imageUrl ?? "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <form action={moveBlockAction}>
                            <input name="blockId" type="hidden" value={block.id} />
                            <input name="pageId" type="hidden" value={selected.id} />
                            <input name="direction" type="hidden" value="up" />
                            <Button size="sm" type="submit" variant="ghost">
                              ↑
                            </Button>
                          </form>
                          <form action={moveBlockAction}>
                            <input name="blockId" type="hidden" value={block.id} />
                            <input name="pageId" type="hidden" value={selected.id} />
                            <input name="direction" type="hidden" value="down" />
                            <Button size="sm" type="submit" variant="ghost">
                              ↓
                            </Button>
                          </form>
                          <form action={deleteBlockAction}>
                            <input name="blockId" type="hidden" value={block.id} />
                            <input name="pageId" type="hidden" value={selected.id} />
                            <Button size="sm" type="submit" variant="ghost">
                              מחק
                            </Button>
                          </form>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}
    </AdminShell>
  );
}
