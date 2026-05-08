import { History, Search } from "lucide-react";

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
import { listAdminAuditLogs } from "~/server/services/admin-operations";

export const metadata = {
  title: "Audit | Admin",
};

export const dynamic = "force-dynamic";

type AdminAuditPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

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

export default async function AdminAuditPage({
  searchParams,
}: AdminAuditPageProps) {
  const access = await getAdminPageAccess("SYSTEM_CONFIG");

  if (access.denied) return <AdminForbidden {...access.denied} />;

  const query = await searchParams;
  const params = {
    entity: optionalParam(query.entity),
    page: Number(firstParam(query.page) ?? 1),
    pageSize: 30,
    query: optionalParam(query.query),
    sort:
      (firstParam(query.sort) as "created-desc" | "created-asc" | undefined) ??
      "created-desc",
  };
  const data = await listAdminAuditLogs(params).catch((error: unknown) => {
    if (process.env.NODE_ENV === "development") {
      console.error("[admin] failed to load audit logs", error);
    }

    return null;
  });

  if (!data) return <AdminDatabaseFallback />;

  return (
    <AdminShell
      active="audit"
      admin={access.admin}
      description="רישום פעולות אדמין ותהליכים תפעוליים, כולל מזהי entity ומטא־דאטה לחקירה."
      title="Audit log"
    >
      <Card className="rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="size-5" />
            סינון Audit
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            action="/admin/audit"
            className="grid gap-3 md:grid-cols-[1fr_160px_160px_auto]"
          >
            <Input
              defaultValue={params.query}
              name="query"
              placeholder="פעולה, entity, מזהה או אדמין"
            />
            <Input
              defaultValue={params.entity}
              name="entity"
              placeholder="Entity"
            />
            <select
              className="glass-control h-11 rounded-md border px-3 text-sm"
              defaultValue={params.sort}
              name="sort"
            >
              <option value="created-desc">חדשות תחילה</option>
              <option value="created-asc">ישנות תחילה</option>
            </select>
            <Button type="submit">סינון</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-6 rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="size-5" />
            אירועים
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AdminTableScrollHint />
          <Table className="min-w-[980px]">
            <TableHeader>
              <TableRow>
                <TableHead>פעולה</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>אדמין</TableHead>
                <TableHead>תאריך</TableHead>
                <TableHead>מטא־דאטה</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.length === 0 ? (
                <TableEmptyRow
                  colSpan={5}
                  description="פעולות אדמין יופיעו לאחר שינויים בהזמנות, קטלוג, מלאי ותורים."
                  icon={History}
                  title="אין אירועי audit"
                />
              ) : (
                data.items.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{log.action}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.entity}</Badge>
                      <span className="text-muted-foreground ms-2 text-xs">
                        {log.entityId}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="grid gap-1">
                        <span>{log.adminName}</span>
                        <span className="text-muted-foreground text-xs">
                          {log.adminEmail ?? "system"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(log.createdAt)}</TableCell>
                    <TableCell className="max-w-sm">
                      <code className="text-muted-foreground line-clamp-2 text-xs break-all">
                        {JSON.stringify(log.metadata ?? {})}
                      </code>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <AdminPagination
            basePath="/admin/audit"
            pageInfo={data.pageInfo}
            searchParams={{
              entity: params.entity,
              query: params.query,
              sort: params.sort,
            }}
          />
        </CardContent>
      </Card>
    </AdminShell>
  );
}
