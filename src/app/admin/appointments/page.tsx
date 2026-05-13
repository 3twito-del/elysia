import Link from "next/link";
import { CalendarClock, Search } from "lucide-react";

import { AdminAppointmentActions } from "../_components/admin-appointment-actions";
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
import { getAppointmentStatusLabel } from "~/lib/commerce-labels";
import { listAdminAppointments } from "~/server/services/admin-operations";
import { TRPCReactProvider } from "~/trpc/react";

export const metadata = {
  title: "Appointments | Admin",
};

export const dynamic = "force-dynamic";

type AdminAppointmentsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const appointmentStatuses = [
  "REQUESTED",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
] as const;

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

export default async function AdminAppointmentsPage({
  searchParams,
}: AdminAppointmentsPageProps) {
  const access = await getAdminPageAccess("CUSTOMER_VIEW");

  if (access.denied) return <AdminForbidden {...access.denied} />;

  const query = await searchParams;
  const params = {
    branchId: optionalParam(query.branchId),
    page: Number(firstParam(query.page) ?? 1),
    pageSize: 25,
    query: optionalParam(query.query),
    sort:
      (firstParam(query.sort) as "starts-asc" | "starts-desc" | undefined) ??
      "starts-asc",
    status: optionalParam(query.status) as
      | (typeof appointmentStatuses)[number]
      | undefined,
  };
  const data = await listAdminAppointments(params).catch((error: unknown) => {
    if (process.env.NODE_ENV === "development") {
      console.error("[admin] failed to load appointments", error);
    }

    return null;
  });

  if (!data) return <AdminDatabaseFallback />;

  const hasActiveFilters = [
    Boolean(params.branchId),
    Boolean(params.query),
    params.sort !== "starts-asc",
    Boolean(params.status),
    params.page > 1,
  ].some(Boolean);

  return (
    <AdminShell
      active="appointments"
      admin={access.admin}
      description="תיאום, אישור וסגירת תורים בסניפים עם חיפוש לפי לקוח, טלפון, נושא וסניף."
      title="תורים"
    >
      <TRPCReactProvider>
        <Card className="rounded-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="size-5" />
              סינון תורים
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              action="/admin/appointments"
              className="grid gap-3 md:grid-cols-[1fr_repeat(3,160px)_auto_auto]"
            >
              <Input
                defaultValue={params.query}
                name="query"
                placeholder="שם, טלפון, אימייל או נושא"
              />
              <select
                className="glass-control h-11 rounded-md border px-3 text-sm"
                defaultValue={params.status ?? ""}
                name="status"
              >
                <option value="">כל הסטטוסים</option>
                {appointmentStatuses.map((status) => (
                  <option key={status} value={status}>
                    {getAppointmentStatusLabel(status)}
                  </option>
                ))}
              </select>
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
                <option value="starts-asc">קרובים תחילה</option>
                <option value="starts-desc">רחוקים תחילה</option>
              </select>
              <Button type="submit">סינון</Button>
              {hasActiveFilters ? (
                <Button asChild variant="outline">
                  <Link href="/admin/appointments">ניקוי</Link>
                </Button>
              ) : null}
            </form>
          </CardContent>
        </Card>

        <Card className="mt-6 rounded-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="size-5" />
              תורי סניף
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AdminTableScrollHint />
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow>
                  <TableHead>לקוח</TableHead>
                  <TableHead>סניף</TableHead>
                  <TableHead>נושא</TableHead>
                  <TableHead>תאריך</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead>פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.length === 0 ? (
                  <TableEmptyRow
                    colSpan={6}
                    description="תורים חדשים מהאתר יופיעו כאן לטיפול."
                    icon={CalendarClock}
                    title="אין תורים מתאימים"
                  />
                ) : (
                  data.items.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell>
                        <div className="grid gap-1">
                          <span>{appointment.name}</span>
                          <span className="text-muted-foreground text-xs">
                            {appointment.phone}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {appointment.branchName}, {appointment.branchCity}
                      </TableCell>
                      <TableCell>{appointment.topic}</TableCell>
                      <TableCell>{formatDate(appointment.startsAt)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {getAppointmentStatusLabel(appointment.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <AdminAppointmentActions
                          appointmentId={appointment.id}
                          status={appointment.status}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <AdminPagination
              basePath="/admin/appointments"
              pageInfo={data.pageInfo}
              searchParams={{
                branchId: params.branchId,
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
