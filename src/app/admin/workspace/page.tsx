import { BookOpen, Megaphone, Search } from "lucide-react";

import { AdminShell } from "../_components/admin-shell";
import {
  AdminDatabaseFallback,
  AdminForbidden,
} from "../_components/admin-states";
import { getAdminPageAccess } from "../_lib/access";
import {
  createAnnouncementAction,
  createArticleAction,
  expireAnnouncementAction,
  pinAnnouncementAction,
  setArticleStatusAction,
} from "./actions";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { formatHebrewDate } from "~/lib/format";
import { listActiveAnnouncements } from "~/server/services/announcements";
import { listArticles } from "~/server/services/knowledge-base";

export const metadata = {
  title: "מרחב עבודה | Admin",
};

export const dynamic = "force-dynamic";

type WorkspacePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  const param = Array.isArray(value) ? value[0] : value;
  return param && param.length > 0 ? param.trim() : undefined;
}

const articleStatusLabel: Record<string, string> = {
  DRAFT: "טיוטה",
  PUBLISHED: "פורסם",
  ARCHIVED: "בארכיון",
};

const articleStatusVariant: Record<
  string,
  "secondary" | "outline" | "destructive"
> = {
  DRAFT: "outline",
  PUBLISHED: "secondary",
  ARCHIVED: "destructive",
};

const severityLabel: Record<string, string> = {
  INFO: "מידע",
  WARNING: "אזהרה",
  CRITICAL: "קריטי",
};

const severityVariant: Record<string, "secondary" | "outline" | "destructive"> =
  {
    INFO: "outline",
    WARNING: "secondary",
    CRITICAL: "destructive",
  };

export default async function AdminWorkspacePage({
  searchParams,
}: WorkspacePageProps) {
  const access = await getAdminPageAccess("ERP_READ", "/admin/workspace");

  if (access.denied) return <AdminForbidden {...access.denied} />;

  const kbQuery = firstParam((await searchParams).kb);

  const [articles, announcements] = await Promise.all([
    listArticles({ query: kbQuery }).catch(() => null),
    listActiveAnnouncements().catch(() => []),
  ]);

  if (!articles) return <AdminDatabaseFallback />;

  return (
    <AdminShell
      active="workspace"
      admin={access.admin}
      description="מרחב העבודה הפנימי: בסיס ידע (Wiki) והודעות צוות — חלק מ'לעולם לא לצאת מהמערכת'."
      title="מרחב עבודה"
    >
      <Card className="rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone aria-hidden="true" className="size-5" />
            הודעות צוות (Announcements)
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
          <form action={createAnnouncementAction} className="grid gap-3">
            <Input name="title" placeholder="כותרת ההודעה" required />
            <Textarea name="body" placeholder="תוכן" required rows={3} />
            <div className="flex items-center gap-2">
              <select
                aria-label="חומרה"
                autoComplete="off"
                className="glass-control h-10 rounded-md border px-3 text-sm"
                defaultValue="INFO"
                name="severity"
              >
                <option value="INFO">מידע</option>
                <option value="WARNING">אזהרה</option>
                <option value="CRITICAL">קריטי</option>
              </select>
              <label className="flex items-center gap-1.5 text-sm">
                <input name="isPinned" type="checkbox" value="1" />
                נעוץ
              </label>
            </div>
            <Button className="w-fit" type="submit">
              פרסם הודעה
            </Button>
          </form>

          <div className="grid gap-2">
            {announcements.length === 0 ? (
              <p className="text-muted-foreground text-sm">אין הודעות פעילות.</p>
            ) : (
              announcements.map((announcement) => (
                <div
                  className="rounded-md border p-3"
                  key={announcement.id}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="flex items-center gap-2 font-medium">
                      {announcement.isPinned ? <span>📌</span> : null}
                      {announcement.title}
                    </span>
                    <div className="flex items-center gap-1">
                      <Badge
                        variant={
                          severityVariant[announcement.severity] ?? "outline"
                        }
                      >
                        {severityLabel[announcement.severity] ??
                          announcement.severity}
                      </Badge>
                      <form action={pinAnnouncementAction}>
                        <input
                          name="announcementId"
                          type="hidden"
                          value={announcement.id}
                        />
                        <input
                          name="isPinned"
                          type="hidden"
                          value={announcement.isPinned ? "0" : "1"}
                        />
                        <Button size="sm" type="submit" variant="ghost">
                          {announcement.isPinned ? "שחרר" : "נעץ"}
                        </Button>
                      </form>
                      <form action={expireAnnouncementAction}>
                        <input
                          name="announcementId"
                          type="hidden"
                          value={announcement.id}
                        />
                        <Button size="sm" type="submit" variant="ghost">
                          הסר
                        </Button>
                      </form>
                    </div>
                  </div>
                  <p className="text-muted-foreground mt-2 text-sm leading-6">
                    {announcement.body}
                  </p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6 rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen aria-hidden="true" className="size-5" />
            בסיס ידע (Knowledge Base)
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
          <form action={createArticleAction} className="grid gap-3">
            <p className="text-muted-foreground text-sm">
              מאמר נוצר כטיוטה. פרסום הופך אותו לזמין כ-Wiki הצוות.
            </p>
            <Input name="title" placeholder="כותרת המאמר" required />
            <Input name="category" placeholder="קטגוריה (רשות)" />
            <Textarea name="body" placeholder="תוכן המאמר" required rows={4} />
            <Button className="w-fit" type="submit">
              צור מאמר
            </Button>
          </form>

          <div className="grid gap-3">
            <form className="flex gap-2">
              <Input
                className="max-w-xs"
                defaultValue={kbQuery ?? ""}
                name="kb"
                placeholder="חיפוש במאגר…"
              />
              <Button type="submit" variant="outline">
                <Search aria-hidden="true" className="size-4" />
                חפש
              </Button>
            </form>

            {articles.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                {kbQuery ? "לא נמצאו מאמרים." : "טרם נוצרו מאמרים."}
              </p>
            ) : (
              articles.map((article) => (
                <div className="rounded-md border p-3" key={article.id}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{article.title}</span>
                    <div className="flex items-center gap-1">
                      {article.category ? (
                        <Badge variant="outline">{article.category}</Badge>
                      ) : null}
                      <Badge
                        variant={
                          articleStatusVariant[article.status] ?? "outline"
                        }
                      >
                        {articleStatusLabel[article.status] ?? article.status}
                      </Badge>
                      <form action={setArticleStatusAction}>
                        <input
                          name="articleId"
                          type="hidden"
                          value={article.id}
                        />
                        <input
                          name="status"
                          type="hidden"
                          value={
                            article.status === "PUBLISHED"
                              ? "ARCHIVED"
                              : "PUBLISHED"
                          }
                        />
                        <Button size="sm" type="submit" variant="ghost">
                          {article.status === "PUBLISHED" ? "ארכב" : "פרסם"}
                        </Button>
                      </form>
                    </div>
                  </div>
                  <p className="text-muted-foreground mt-2 line-clamp-3 text-sm leading-6">
                    {article.body}
                  </p>
                  <p className="text-muted-foreground mt-2 text-xs">
                    עודכן {formatHebrewDate(article.updatedAt)}
                  </p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </AdminShell>
  );
}
