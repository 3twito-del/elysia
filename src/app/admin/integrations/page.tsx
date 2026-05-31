import Link from "next/link";
import { Activity, PlugZap } from "lucide-react";

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
import { formatOptionalHebrewDateTime } from "~/lib/format";
import {
  getAdminIntegrationStatuses,
  listAdminJobRuns,
  listAdminOutboxEvents,
} from "~/server/services/admin-operations";

const outboxStatuses = [
  "PENDING",
  "PUBLISHED",
  "PROCESSING",
  "PROCESSED",
  "FAILED",
] as const;

const jobRunStatuses = ["RUNNING", "COMPLETED", "FAILED", "SKIPPED"] as const;

export const metadata = {
  title: "Integrations | Admin",
};

export const dynamic = "force-dynamic";

type AdminIntegrationsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function optionalParam(value: string | string[] | undefined) {
  const param = firstParam(value);

  return param && param.length > 0 ? param : undefined;
}

function outboxStatusParam(value: string | string[] | undefined) {
  const param = firstParam(value);

  return outboxStatuses.includes(param as (typeof outboxStatuses)[number])
    ? (param as (typeof outboxStatuses)[number])
    : undefined;
}

function jobStatusParam(value: string | string[] | undefined) {
  const param = firstParam(value);

  return jobRunStatuses.includes(param as (typeof jobRunStatuses)[number])
    ? (param as (typeof jobRunStatuses)[number])
    : undefined;
}

export default async function AdminIntegrationsPage({
  searchParams,
}: AdminIntegrationsPageProps) {
  const access = await getAdminPageAccess(
    "SYSTEM_CONFIG",
    "/admin/integrations",
  );

  if (access.denied) return <AdminForbidden {...access.denied} />;

  const query = await searchParams;
  const outboxParams = {
    page: Number(firstParam(query.page) ?? 1),
    pageSize: 15,
    query: optionalParam(query.query),
    status: outboxStatusParam(query.outboxStatus),
  };
  const jobParams = {
    page: 1,
    pageSize: 10,
    query: optionalParam(query.jobQuery),
    status: jobStatusParam(query.jobStatus),
  };
  const [outbox, jobs] = await Promise.all([
    listAdminOutboxEvents(outboxParams),
    listAdminJobRuns(jobParams),
  ]).catch((error: unknown) => {
    if (process.env.NODE_ENV === "development") {
      console.error("[admin] failed to load integrations", error);
    }

    return [null, null] as const;
  });

  if (!outbox || !jobs) return <AdminDatabaseFallback />;

  const integrations = getAdminIntegrationStatuses();
  const hasActiveOutboxFilters = [
    Boolean(outboxParams.query),
    Boolean(outboxParams.status),
    outboxParams.page > 1,
  ].some(Boolean);
  const hasActiveJobFilters = [
    Boolean(jobParams.query),
    Boolean(jobParams.status),
  ].some(Boolean);

  return (
    <AdminShell
      active="integrations"
      admin={access.admin}
      description="Code-first status for payments, email, search, jobs and platform controls. Live rollout depends on provider secrets and Vercel access."
      title="אינטגרציות ועבודות"
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {integrations.map((integration) => (
          <Card className="rounded-md" key={integration.name}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-3 text-base">
                <span className="flex items-center gap-2">
                  <PlugZap aria-hidden="true" className="size-4" />
                  {integration.name}
                </span>
                <Badge
                  variant={
                    integration.status === "configured"
                      ? "secondary"
                      : "outline"
                  }
                >
                  {integration.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <p className="text-muted-foreground leading-6">
                {integration.detail}
              </p>
              <div className="flex flex-wrap gap-2">
                {integration.capabilities.map((capability) => (
                  <Badge key={capability} variant="outline">
                    {capability}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card className="rounded-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity aria-hidden="true" className="size-5" />
              Outbox
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              action="/admin/integrations"
              className="mb-4 grid gap-2 sm:grid-cols-[1fr_160px_auto_auto]"
            >
              <Input
                aria-label="חיפוש Outbox"
                defaultValue={outboxParams.query}
                name="query"
                placeholder="חיפוש לפי סוג או מזהה"
              />
              <select
                aria-label="סינון סטטוס Outbox"
                className="glass-control h-11 rounded-md border px-3 text-sm"
                defaultValue={outboxParams.status ?? ""}
                name="outboxStatus"
              >
                <option value="">כל הסטטוסים</option>
                {outboxStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <Button type="submit">סינון</Button>
              {hasActiveOutboxFilters ? (
                <Button asChild variant="outline">
                  <Link href="/admin/integrations">ניקוי</Link>
                </Button>
              ) : null}
            </form>
            <AdminTableScrollHint />
            <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow>
                  <TableHead>סוג</TableHead>
                  <TableHead>Aggregate</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead>ניסיונות</TableHead>
                  <TableHead>זמין</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {outbox.items.length === 0 ? (
                  <TableEmptyRow
                    action={
                      hasActiveOutboxFilters ? (
                        <Button asChild size="sm" variant="outline">
                          <Link href="/admin/integrations">ניקוי סינון</Link>
                        </Button>
                      ) : undefined
                    }
                    colSpan={5}
                    description={
                      hasActiveOutboxFilters
                        ? "שנו חיפוש או סטטוס, או נקו כדי לחזור לכל אירועי ה-outbox."
                        : "אירועים עסקיים יופיעו לאחר יצירת הזמנות, עדכון מלאי או הודעות."
                    }
                    icon={Activity}
                    title={
                      hasActiveOutboxFilters
                        ? "אין אירועי outbox מתאימים"
                        : "אין אירועי outbox"
                    }
                  />
                ) : (
                  outbox.items.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium">
                        {event.type}
                      </TableCell>
                      <TableCell>
                        {event.aggregateType ?? "-"} ·{" "}
                        {event.aggregateId ?? "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{event.status}</Badge>
                      </TableCell>
                      <TableCell>{event.attempts}</TableCell>
                      <TableCell>
                        {formatOptionalHebrewDateTime(event.availableAt)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <AdminPagination
              basePath="/admin/integrations"
              pageInfo={outbox.pageInfo}
              searchParams={{
                outboxStatus: outboxParams.status,
                query: outboxParams.query,
              }}
            />
          </CardContent>
        </Card>

        <Card className="rounded-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity aria-hidden="true" className="size-5" />
              Job runs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              action="/admin/integrations"
              className="mb-4 grid gap-2 sm:grid-cols-[1fr_160px_auto_auto]"
            >
              <Input
                aria-label="חיפוש Job runs"
                defaultValue={jobParams.query}
                name="jobQuery"
                placeholder="חיפוש לפי שם job"
              />
              <select
                aria-label="סינון סטטוס Job runs"
                className="glass-control h-11 rounded-md border px-3 text-sm"
                defaultValue={jobParams.status ?? ""}
                name="jobStatus"
              >
                <option value="">כל הסטטוסים</option>
                {jobRunStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <Button type="submit">סינון</Button>
              {hasActiveJobFilters ? (
                <Button asChild variant="outline">
                  <Link href="/admin/integrations">ניקוי</Link>
                </Button>
              ) : null}
            </form>
            <AdminTableScrollHint />
            <Table className="min-w-[680px]">
              <TableHeader>
                <TableRow>
                  <TableHead>שם</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead>ניסיונות</TableHead>
                  <TableHead>התחיל</TableHead>
                  <TableHead>הסתיים</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.items.length === 0 ? (
                  <TableEmptyRow
                    action={
                      hasActiveJobFilters ? (
                        <Button asChild size="sm" variant="outline">
                          <Link href="/admin/integrations">ניקוי סינון</Link>
                        </Button>
                      ) : undefined
                    }
                    colSpan={5}
                    description={
                      hasActiveJobFilters
                        ? "שנו חיפוש או סטטוס, או נקו כדי לחזור לריצות האחרונות."
                        : "ריצות jobs יופיעו לאחר cron או עיבוד outbox. המסך מציג רק פעולות שכבר נרשמו."
                    }
                    icon={Activity}
                    title={
                      hasActiveJobFilters
                        ? "אין ריצות jobs מתאימות"
                        : "אין ריצות jobs"
                    }
                  />
                ) : (
                  jobs.items.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium">{job.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{job.status}</Badge>
                      </TableCell>
                      <TableCell>{job.attempts}</TableCell>
                      <TableCell>
                        {formatOptionalHebrewDateTime(job.startedAt)}
                      </TableCell>
                      <TableCell>
                        {formatOptionalHebrewDateTime(job.finishedAt)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
