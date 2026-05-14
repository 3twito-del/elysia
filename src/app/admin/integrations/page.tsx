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

export default async function AdminIntegrationsPage({
  searchParams,
}: AdminIntegrationsPageProps) {
  const access = await getAdminPageAccess("SYSTEM_CONFIG");

  if (access.denied) return <AdminForbidden {...access.denied} />;

  const query = await searchParams;
  const outboxParams = {
    page: Number(firstParam(query.page) ?? 1),
    pageSize: 15,
    query: optionalParam(query.query),
  };
  const [outbox, jobs] = await Promise.all([
    listAdminOutboxEvents(outboxParams),
    listAdminJobRuns({ page: 1, pageSize: 10 }),
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
    outboxParams.page > 1,
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
                  <PlugZap className="size-4" />
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
              <Activity className="size-5" />
              Outbox
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              action="/admin/integrations"
              className="mb-4 grid gap-2 sm:grid-cols-[1fr_auto_auto]"
            >
              <Input
                defaultValue={outboxParams.query}
                name="query"
                placeholder="חיפוש לפי סוג, סטטוס או מזהה"
              />
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
                    colSpan={5}
                    description="אירועים עסקיים יופיעו לאחר יצירת הזמנות, עדכון מלאי או הודעות."
                    icon={Activity}
                    title="אין אירועי outbox"
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
              searchParams={{ query: outboxParams.query }}
            />
          </CardContent>
        </Card>

        <Card className="rounded-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="size-5" />
              Job runs
            </CardTitle>
          </CardHeader>
          <CardContent>
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
                    colSpan={5}
                    description="ריצות jobs יופיעו לאחר cron או עיבוד outbox."
                    icon={Activity}
                    title="אין ריצות jobs"
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
