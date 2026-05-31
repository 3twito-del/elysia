import Link from "next/link";
import type { ComponentProps } from "react";
import {
  Headset,
  Mail,
  MapPin,
  Paperclip,
  Phone,
  Search,
  Settings,
} from "lucide-react";

import {
  updateServiceRequestAdminAction,
  updateServiceSettingsAdminAction,
  upsertContactTopicAdminAction,
  upsertServiceBranchAdminAction,
} from "./actions";
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
import { Label } from "~/components/ui/label";
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
import { formatHebrewDateTime } from "~/lib/format";
import {
  getServiceContactPreferenceLabel,
  getServiceRequestStatusLabel,
  serviceRequestStatuses,
} from "~/lib/service-validation";
import { hasAdminPermission } from "~/server/auth/admin-access";
import {
  getAdminServiceConfiguration,
  listAdminServiceRequests,
} from "~/server/services/service";

export const metadata = {
  title: "Service | Admin",
};

export const dynamic = "force-dynamic";

type AdminServicePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function optionalParam(value: string | string[] | undefined) {
  const param = firstParam(value);

  return param && param.length > 0 ? param : undefined;
}

export default async function AdminServicePage({
  searchParams,
}: AdminServicePageProps) {
  const access = await getAdminPageAccess("CUSTOMER_VIEW", "/admin/service");

  if (access.denied) return <AdminForbidden {...access.denied} />;

  const query = await searchParams;
  const params = {
    page: Number(firstParam(query.page) ?? 1),
    pageSize: 20,
    query: optionalParam(query.query),
    status: optionalParam(query.status) as
      | (typeof serviceRequestStatuses)[number]
      | undefined,
    topicId: optionalParam(query.topicId),
  };
  const [requests, configuration] = await Promise.all([
    listAdminServiceRequests(params),
    getAdminServiceConfiguration(),
  ]).catch((error: unknown) => {
    if (process.env.NODE_ENV === "development") {
      console.error("[admin] failed to load service page", error);
    }

    return [null, null] as const;
  });

  if (!requests || !configuration) return <AdminDatabaseFallback />;

  const canManageSettings = hasAdminPermission(access.admin, "SYSTEM_CONFIG");
  const hasActiveFilters = [
    Boolean(params.query),
    Boolean(params.status),
    Boolean(params.topicId),
    params.page > 1,
  ].some(Boolean);

  return (
    <AdminShell
      active="service"
      admin={access.admin}
      description="ניהול פניות שירות, פרטי קשר ציבוריים ותשתית מיקומים פיזיים שנשארת כבויה עד אישור מפורש."
      title="שירות לקוחות"
    >
      <div className="grid gap-6">
        <Card className="rounded-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search aria-hidden="true" className="size-5" />
              סינון פניות
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              action="/admin/service"
              className="grid gap-3 md:grid-cols-[1fr_180px_220px_auto_auto]"
            >
              <Input
                aria-label="חיפוש פניות שירות"
                defaultValue={params.query}
                name="query"
                placeholder="שם, טלפון, אימייל, הזמנה או תוכן"
              />
              <select
                aria-label="סינון לפי סטטוס"
                className="glass-control h-11 rounded-md border px-3 text-sm"
                defaultValue={params.status ?? ""}
                name="status"
              >
                <option value="">כל הסטטוסים</option>
                {serviceRequestStatuses.map((status) => (
                  <option key={status} value={status}>
                    {getServiceRequestStatusLabel(status)}
                  </option>
                ))}
              </select>
              <select
                aria-label="סינון לפי נושא"
                className="glass-control h-11 rounded-md border px-3 text-sm"
                defaultValue={params.topicId ?? ""}
                name="topicId"
              >
                <option value="">כל הנושאים</option>
                {requests.topics.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.label}
                  </option>
                ))}
              </select>
              <Button type="submit">סינון</Button>
              {hasActiveFilters ? (
                <Button asChild variant="outline">
                  <Link href="/admin/service">ניקוי</Link>
                </Button>
              ) : null}
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Headset aria-hidden="true" className="size-5" />
              פניות שירות
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AdminTableScrollHint />
            <Table className="min-w-[1180px]">
              <TableHeader>
                <TableRow>
                  <TableHead>לקוח</TableHead>
                  <TableHead>נושא</TableHead>
                  <TableHead>פנייה</TableHead>
                  <TableHead>קבצים</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead>טיפול</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.items.length === 0 ? (
                  <TableEmptyRow
                    action={
                      hasActiveFilters ? (
                        <Button asChild size="sm" variant="outline">
                          <Link href="/admin/service">ניקוי סינון</Link>
                        </Button>
                      ) : undefined
                    }
                    colSpan={6}
                    description="פניות מהטופס הציבורי יופיעו כאן לטיפול ומעקב."
                    icon={Headset}
                    title="אין פניות שירות"
                  />
                ) : (
                  requests.items.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="align-top">
                        <div className="grid min-w-56 gap-1 text-sm">
                          <span className="font-medium">{request.name}</span>
                          <a
                            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                            href={`tel:${request.phone}`}
                          >
                            <Phone aria-hidden="true" className="size-3.5" />
                            {request.phone}
                          </a>
                          <a
                            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                            href={`mailto:${request.email}`}
                          >
                            <Mail aria-hidden="true" className="size-3.5" />
                            {request.email}
                          </a>
                          <span className="text-muted-foreground text-xs">
                            {formatHebrewDateTime(request.createdAt)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="grid gap-2">
                          <Badge className="w-fit" variant="secondary">
                            {request.topicLabel}
                          </Badge>
                          <span className="text-muted-foreground text-xs">
                            {getServiceContactPreferenceLabel(
                              request.preferredContact,
                            )}
                          </span>
                          {request.preferredContactTime ? (
                            <span className="text-muted-foreground text-xs">
                              {request.preferredContactTime}
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="grid max-w-md gap-2 text-sm">
                          {request.orderNumber ? (
                            <span>הזמנה: {request.orderNumber}</span>
                          ) : null}
                          {request.productReference ? (
                            <span>מוצר: {request.productReference}</span>
                          ) : null}
                          <p className="text-muted-foreground leading-6 whitespace-pre-wrap">
                            {request.message}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="grid gap-2">
                          {request.attachments.length === 0 ? (
                            <span className="text-muted-foreground text-sm">
                              ללא קבצים
                            </span>
                          ) : (
                            request.attachments.map((attachment) =>
                              attachment.url ? (
                                <Button
                                  asChild
                                  className="h-9 justify-start gap-2"
                                  key={attachment.id}
                                  variant="outline"
                                >
                                  <a
                                    href={attachment.url}
                                    rel="noreferrer"
                                    target="_blank"
                                  >
                                    <Paperclip
                                      aria-hidden="true"
                                      className="size-4"
                                    />
                                    {attachment.filename}
                                  </a>
                                </Button>
                              ) : (
                                <Badge key={attachment.id} variant="outline">
                                  {attachment.filename}
                                </Badge>
                              ),
                            )
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <Badge variant="secondary">
                          {getServiceRequestStatusLabel(request.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="align-top">
                        <form
                          action={updateServiceRequestAdminAction}
                          className="grid min-w-64 gap-2"
                        >
                          <input
                            name="serviceRequestId"
                            type="hidden"
                            value={request.id}
                          />
                          <select
                            aria-label="עדכון סטטוס פנייה"
                            className="glass-control h-10 rounded-md border px-3 text-sm"
                            defaultValue={request.status}
                            name="status"
                          >
                            {serviceRequestStatuses.map((status) => (
                              <option key={status} value={status}>
                                {getServiceRequestStatusLabel(status)}
                              </option>
                            ))}
                          </select>
                          <Textarea
                            defaultValue={request.adminNotes ?? ""}
                            name="adminNotes"
                            placeholder="הערת טיפול פנימית"
                          />
                          <Button size="sm" type="submit">
                            שמירה
                          </Button>
                        </form>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <AdminPagination
              basePath="/admin/service"
              pageInfo={requests.pageInfo}
              searchParams={{
                query: params.query,
                status: params.status,
                topicId: params.topicId,
              }}
            />
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <Card className="rounded-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings aria-hidden="true" className="size-5" />
                הגדרות שירות
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                action={updateServiceSettingsAdminAction}
                className="grid gap-4"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field
                    defaultValue={configuration.settings.displayPhone}
                    disabled={!canManageSettings}
                    dir="ltr"
                    inputMode="tel"
                    label="טלפון להצגה"
                    name="displayPhone"
                  />
                  <Field
                    defaultValue={configuration.settings.phoneE164}
                    disabled={!canManageSettings}
                    dir="ltr"
                    inputMode="tel"
                    label="טלפון בינלאומי"
                    name="phoneE164"
                  />
                </div>
                <Field
                  defaultValue={configuration.settings.serviceEmail}
                  disabled={!canManageSettings}
                  dir="ltr"
                  label="מייל שירות"
                  name="serviceEmail"
                  type="email"
                />
                <label className="glass-inset flex min-h-11 items-center gap-3 rounded-md border px-3 text-sm">
                  <input
                    defaultChecked={
                      configuration.settings.physicalBranchesEnabled
                    }
                    disabled={!canManageSettings}
                    name="physicalBranchesEnabled"
                    type="checkbox"
                  />
                  הפעלת תצוגת מיקומים פיזיים באתר ובאדמין
                </label>
                <Button disabled={!canManageSettings} type="submit">
                  שמירת הגדרות
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="rounded-md">
            <CardHeader>
              <CardTitle>נושאי פנייה</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              {configuration.topics.map((topic) => (
                <form
                  action={upsertContactTopicAdminAction}
                  className="glass-inset grid gap-3 rounded-md border p-3 md:grid-cols-[1fr_1fr_120px_auto]"
                  key={topic.id}
                >
                  <input name="id" type="hidden" value={topic.id} />
                  <Field
                    defaultValue={topic.label}
                    disabled={!canManageSettings}
                    label="שם"
                    name="label"
                  />
                  <Field
                    defaultValue={topic.slug}
                    disabled={!canManageSettings}
                    dir="ltr"
                    label="Slug"
                    name="slug"
                  />
                  <Field
                    defaultValue={topic.sortOrder}
                    disabled={!canManageSettings}
                    label="סדר"
                    name="sortOrder"
                    type="number"
                  />
                  <label className="flex items-end gap-2 pb-2 text-sm">
                    <input
                      defaultChecked={topic.isActive}
                      disabled={!canManageSettings}
                      name="isActive"
                      type="checkbox"
                    />
                    פעיל
                  </label>
                  <div className="md:col-span-2">
                    <Field
                      defaultValue={topic.description ?? ""}
                      disabled={!canManageSettings}
                      label="תיאור"
                      name="description"
                    />
                  </div>
                  <div>
                    <Field
                      defaultValue={topic.recipientEmail ?? ""}
                      disabled={!canManageSettings}
                      dir="ltr"
                      label="מייל יעד"
                      name="recipientEmail"
                      type="email"
                    />
                  </div>
                  <Button
                    className="self-end"
                    disabled={!canManageSettings}
                    type="submit"
                  >
                    עדכון
                  </Button>
                </form>
              ))}

              <form
                action={upsertContactTopicAdminAction}
                className="border-border grid gap-3 rounded-md border border-dashed p-3 md:grid-cols-[1fr_1fr_120px_auto]"
              >
                <Field
                  disabled={!canManageSettings}
                  label="נושא חדש"
                  name="label"
                />
                <Field
                  disabled={!canManageSettings}
                  dir="ltr"
                  label="Slug"
                  name="slug"
                />
                <Field
                  defaultValue={100}
                  disabled={!canManageSettings}
                  label="סדר"
                  name="sortOrder"
                  type="number"
                />
                <label className="flex items-end gap-2 pb-2 text-sm">
                  <input
                    defaultChecked
                    disabled={!canManageSettings}
                    name="isActive"
                    type="checkbox"
                  />
                  פעיל
                </label>
                <div className="md:col-span-2">
                  <Field
                    disabled={!canManageSettings}
                    label="תיאור"
                    name="description"
                  />
                </div>
                <Field
                  disabled={!canManageSettings}
                  dir="ltr"
                  label="מייל יעד"
                  name="recipientEmail"
                  type="email"
                />
                <Button
                  className="self-end"
                  disabled={!canManageSettings}
                  type="submit"
                >
                  יצירה
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {configuration.settings.physicalBranchesEnabled && canManageSettings ? (
          <Card className="rounded-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin aria-hidden="true" className="size-5" />
                תצורת מיקומים פיזיים
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              {configuration.branches.map((branch) => (
                <BranchForm branch={branch} key={branch.id} />
              ))}
              <BranchForm />
            </CardContent>
          </Card>
        ) : null}
      </div>
    </AdminShell>
  );
}

function Field({
  label,
  ...props
}: {
  label: string;
} & ComponentProps<typeof Input>) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={String(props.name)}>{label}</Label>
      <Input id={String(props.name)} {...props} />
    </div>
  );
}

function BranchForm({
  branch,
}: {
  branch?: {
    address: string;
    city: string;
    id: string;
    isActive: boolean;
    isApproved: boolean;
    isPublic: boolean;
    name: string;
    openingHours: unknown;
    phone: string;
    services: string[];
    slug: string;
    sortOrder: number;
    whatsapp: string | null;
  };
}) {
  return (
    <form
      action={upsertServiceBranchAdminAction}
      className="glass-inset grid gap-3 rounded-md border p-3 lg:grid-cols-4"
    >
      {branch ? <input name="id" type="hidden" value={branch.id} /> : null}
      <Field defaultValue={branch?.name ?? ""} label="שם" name="name" />
      <Field
        defaultValue={branch?.slug ?? ""}
        dir="ltr"
        label="Slug"
        name="slug"
      />
      <Field defaultValue={branch?.city ?? ""} label="עיר" name="city" />
      <Field
        defaultValue={branch?.sortOrder ?? 100}
        label="סדר"
        name="sortOrder"
        type="number"
      />
      <Field
        defaultValue={branch?.address ?? ""}
        label="כתובת"
        name="address"
      />
      <Field
        defaultValue={branch?.phone ?? ""}
        dir="ltr"
        inputMode="tel"
        label="טלפון"
        name="phone"
      />
      <Field
        defaultValue={branch?.whatsapp ?? ""}
        dir="ltr"
        inputMode="tel"
        label="וואטסאפ"
        name="whatsapp"
      />
      <div className="grid grid-cols-3 gap-3 self-end pb-2 text-sm">
        <label className="flex items-center gap-2">
          <input
            defaultChecked={branch?.isApproved ?? false}
            name="isApproved"
            type="checkbox"
          />
          מאושר
        </label>
        <label className="flex items-center gap-2">
          <input
            defaultChecked={branch?.isPublic ?? false}
            name="isPublic"
            type="checkbox"
          />
          ציבורי
        </label>
        <label className="flex items-center gap-2">
          <input
            defaultChecked={branch?.isActive ?? true}
            name="isActive"
            type="checkbox"
          />
          פעיל
        </label>
      </div>
      <div className="lg:col-span-2">
        <Label htmlFor={`opening-${branch?.id ?? "new"}`}>שעות פעילות</Label>
        <Textarea
          defaultValue={formatOpeningHoursForEdit(branch?.openingHours)}
          id={`opening-${branch?.id ?? "new"}`}
          name="openingHoursText"
        />
      </div>
      <div className="lg:col-span-2">
        <Label htmlFor={`services-${branch?.id ?? "new"}`}>שירותים</Label>
        <Textarea
          defaultValue={branch?.services.join("\n") ?? ""}
          id={`services-${branch?.id ?? "new"}`}
          name="servicesText"
        />
      </div>
      <Button className="lg:col-span-4" type="submit">
        {branch ? "עדכון מיקום" : "יצירת מיקום"}
      </Button>
    </form>
  );
}

function formatOpeningHoursForEdit(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";

  const record = value as Record<string, unknown>;

  if (typeof record.note === "string") return record.note;

  return Object.entries(record)
    .map(([key, item]) => `${key}: ${String(item)}`)
    .join("\n");
}
