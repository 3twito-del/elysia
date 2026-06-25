import {
  BookOpen,
  CalendarClock,
  CheckSquare,
  FileText,
  Megaphone,
  Search,
} from "lucide-react";

import { AdminShell } from "../_components/admin-shell";
import {
  AdminDatabaseFallback,
  AdminForbidden,
} from "../_components/admin-states";
import { getAdminPageAccess } from "../_lib/access";
import {
  archiveDocumentAction,
  cancelBookingAction,
  createAnnouncementAction,
  createApprovalRequestAction,
  createArticleAction,
  createBookingAction,
  createDocumentAction,
  createResourceAction,
  decideApprovalRequestAction,
  expireAnnouncementAction,
  pinAnnouncementAction,
  requestSignatureAction,
  setArticleStatusAction,
  signDocumentAction,
} from "./actions";
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
import { Textarea } from "~/components/ui/textarea";
import {
  formatHebrewDate,
  formatHebrewDateTime,
  formatPrice,
} from "~/lib/format";
import { listActiveAnnouncements } from "~/server/services/announcements";
import {
  getApprovalSummary,
  listApprovalRequests,
} from "~/server/services/approvals";
import {
  getDocumentSummary,
  listDocuments,
} from "~/server/services/document-management";
import { listArticles } from "~/server/services/knowledge-base";
import {
  listResources,
  listUpcomingBookings,
} from "~/server/services/resource-booking";

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

  const [articles, announcements, documents, docSummary, approvals, approvalSummary] =
    await Promise.all([
      listArticles({ query: kbQuery }).catch(() => null),
      listActiveAnnouncements().catch(() => []),
      listDocuments().catch(() => []),
      getDocumentSummary().catch(() => null),
      listApprovalRequests().catch(() => []),
      getApprovalSummary().catch(() => null),
    ]);

  const [resources, bookings] = await Promise.all([
    listResources().catch(() => []),
    listUpcomingBookings().catch(() => []),
  ]);

  if (!articles) return <AdminDatabaseFallback />;

  const docSignatureLabel: Record<string, string> = {
    NONE: "—",
    PENDING: "ממתין לחתימה",
    SIGNED: "נחתם",
  };

  const approvalStatusLabel: Record<string, string> = {
    PENDING: "ממתין",
    APPROVED: "אושר",
    REJECTED: "נדחה",
  };

  const approvalStatusVariant: Record<
    string,
    "secondary" | "outline" | "destructive"
  > = {
    PENDING: "outline",
    APPROVED: "secondary",
    REJECTED: "destructive",
  };

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

      <Card className="mt-6 rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <FileText aria-hidden="true" className="size-5" />
              ניהול מסמכים (Documents)
            </span>
            {docSummary ? (
              <span className="text-muted-foreground text-sm font-normal">
                {docSummary.active} פעילים · {docSummary.pendingSignatures}{" "}
                ממתינים לחתימה
              </span>
            ) : null}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
          <form action={createDocumentAction} className="grid gap-3">
            <p className="text-muted-foreground text-sm">
              רישום מסמך (קישור/URL) עם מחזור חתימה NONE → ממתין → נחתם.
            </p>
            <Input name="name" placeholder="שם המסמך" required />
            <Input name="url" placeholder="קישור (URL)" required />
            <Input name="category" placeholder="קטגוריה (רשות)" />
            <Button className="w-fit" type="submit">
              רשום מסמך
            </Button>
          </form>

          <div className="grid gap-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>מס׳</TableHead>
                  <TableHead>שם</TableHead>
                  <TableHead>חתימה</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.length === 0 ? (
                  <TableEmptyRow
                    colSpan={4}
                    description="טרם נרשמו מסמכים."
                    icon={FileText}
                    title="אין מסמכים"
                  />
                ) : (
                  documents.map((document) => (
                    <TableRow key={document.id}>
                      <TableCell className="whitespace-nowrap font-mono text-xs">
                        {document.documentNumber}
                      </TableCell>
                      <TableCell className="max-w-[12rem] truncate text-sm">
                        <a
                          className="underline-offset-4 hover:underline"
                          href={document.url}
                          rel="noreferrer"
                          target="_blank"
                        >
                          {document.name}
                        </a>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            document.signatureStatus === "SIGNED"
                              ? "secondary"
                              : document.signatureStatus === "PENDING"
                                ? "outline"
                                : "outline"
                          }
                        >
                          {docSignatureLabel[document.signatureStatus] ??
                            document.signatureStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {document.status === "ACTIVE" ? (
                          <div className="flex gap-1">
                            {document.signatureStatus === "NONE" ? (
                              <form action={requestSignatureAction}>
                                <input
                                  name="documentId"
                                  type="hidden"
                                  value={document.id}
                                />
                                <Button size="sm" type="submit" variant="ghost">
                                  בקש חתימה
                                </Button>
                              </form>
                            ) : null}
                            {document.signatureStatus === "PENDING" ? (
                              <form action={signDocumentAction}>
                                <input
                                  name="documentId"
                                  type="hidden"
                                  value={document.id}
                                />
                                <Button
                                  size="sm"
                                  type="submit"
                                  variant="outline"
                                >
                                  חתום
                                </Button>
                              </form>
                            ) : null}
                            <form action={archiveDocumentAction}>
                              <input
                                name="documentId"
                                type="hidden"
                                value={document.id}
                              />
                              <Button size="sm" type="submit" variant="ghost">
                                ארכב
                              </Button>
                            </form>
                          </div>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6 rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <CheckSquare aria-hidden="true" className="size-5" />
              בקשות אישור (Approvals)
            </span>
            {approvalSummary ? (
              <span className="text-muted-foreground text-sm font-normal">
                {approvalSummary.pending} ממתינות ·{" "}
                {formatPrice(approvalSummary.pendingAmount)}
              </span>
            ) : null}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
          <form action={createApprovalRequestAction} className="grid gap-3">
            <p className="text-muted-foreground text-sm">
              בקשת אישור גנרית (לכל מודול). מאשר/דוחה מכריע אותה.
            </p>
            <Input name="title" placeholder="כותרת הבקשה" required />
            <Input name="amount" placeholder="סכום (רשות)" step="0.01" type="number" />
            <Input name="notes" placeholder="הערות (רשות)" />
            <Button className="w-fit" type="submit">
              הגש בקשה
            </Button>
          </form>

          <div className="grid gap-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>מס׳</TableHead>
                  <TableHead>כותרת</TableHead>
                  <TableHead className="text-left">סכום</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvals.length === 0 ? (
                  <TableEmptyRow
                    colSpan={5}
                    description="טרם הוגשו בקשות אישור."
                    icon={CheckSquare}
                    title="אין בקשות"
                  />
                ) : (
                  approvals.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="whitespace-nowrap font-mono text-xs">
                        {request.requestNumber}
                      </TableCell>
                      <TableCell className="max-w-[12rem] truncate text-sm">
                        {request.title}
                      </TableCell>
                      <TableCell className="text-left">
                        {request.amount != null
                          ? formatPrice(request.amount)
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            approvalStatusVariant[request.status] ?? "outline"
                          }
                        >
                          {approvalStatusLabel[request.status] ?? request.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {request.status === "PENDING" ? (
                          <div className="flex gap-1">
                            <form action={decideApprovalRequestAction}>
                              <input
                                name="requestId"
                                type="hidden"
                                value={request.id}
                              />
                              <input
                                name="decision"
                                type="hidden"
                                value="APPROVED"
                              />
                              <Button size="sm" type="submit" variant="outline">
                                אשר
                              </Button>
                            </form>
                            <form action={decideApprovalRequestAction}>
                              <input
                                name="requestId"
                                type="hidden"
                                value={request.id}
                              />
                              <input
                                name="decision"
                                type="hidden"
                                value="REJECTED"
                              />
                              <Button size="sm" type="submit" variant="ghost">
                                דחה
                              </Button>
                            </form>
                          </div>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6 rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarClock aria-hidden="true" className="size-5" />
            שיבוץ משאבים (Resources)
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
          <div className="grid gap-5">
            <form action={createResourceAction} className="grid gap-2">
              <p className="text-muted-foreground text-sm">
                משאב לשיבוץ (חדר/ציוד/עובד). שיבוצים חופפים נדחים אוטומטית.
              </p>
              <Input name="name" placeholder="שם המשאב" required />
              <select
                aria-label="סוג"
                autoComplete="off"
                className="glass-control h-10 rounded-md border px-3 text-sm"
                defaultValue="ROOM"
                name="kind"
              >
                <option value="ROOM">חדר</option>
                <option value="EQUIPMENT">ציוד</option>
                <option value="STAFF">עובד</option>
              </select>
              <Button className="w-fit" size="sm" type="submit">
                צור משאב
              </Button>
            </form>

            <form
              action={createBookingAction}
              className="grid gap-2 border-t pt-4"
            >
              <select
                aria-label="משאב"
                autoComplete="off"
                className="glass-control h-10 rounded-md border px-3 text-sm"
                defaultValue=""
                name="resourceId"
                required
              >
                <option disabled value="">
                  בחר משאב…
                </option>
                {resources.map((resource) => (
                  <option key={resource.id} value={resource.id}>
                    {resource.name}
                  </option>
                ))}
              </select>
              <Input name="title" placeholder="כותרת השיבוץ" required />
              <div className="grid grid-cols-2 gap-2">
                <Input aria-label="התחלה" name="startsAt" type="datetime-local" />
                <Input aria-label="סיום" name="endsAt" type="datetime-local" />
              </div>
              <Button className="w-fit" size="sm" type="submit">
                שבץ
              </Button>
            </form>
          </div>

          <div className="grid gap-2">
            <span className="text-muted-foreground text-sm">שיבוצים קרובים</span>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>משאב</TableHead>
                  <TableHead>כותרת</TableHead>
                  <TableHead>מתי</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.length === 0 ? (
                  <TableEmptyRow
                    colSpan={4}
                    description="אין שיבוצים קרובים."
                    icon={CalendarClock}
                    title="אין שיבוצים"
                  />
                ) : (
                  bookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="text-sm">
                        {booking.resourceName}
                      </TableCell>
                      <TableCell className="max-w-[10rem] truncate text-sm">
                        {booking.title}
                      </TableCell>
                      <TableCell className="text-xs">
                        {formatHebrewDateTime(booking.startsAt)}
                      </TableCell>
                      <TableCell>
                        <form action={cancelBookingAction}>
                          <input
                            name="bookingId"
                            type="hidden"
                            value={booking.id}
                          />
                          <Button size="sm" type="submit" variant="ghost">
                            בטל
                          </Button>
                        </form>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </AdminShell>
  );
}
