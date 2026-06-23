import Link from "next/link";
import { Play } from "lucide-react";

import { AdminShell } from "../../_components/admin-shell";
import {
  AdminDatabaseFallback,
  AdminForbidden,
} from "../../_components/admin-states";
import { getAdminPageAccess } from "../../_lib/access";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { TableEmptyRow } from "~/components/ui/table-empty-row";
import { formatHebrewDateTime } from "~/lib/format";
import { listRecentReplaySessions } from "~/server/services/analytics-replay";

export const metadata = {
  title: "Replay Archive | Admin",
};

export const dynamic = "force-dynamic";

export default async function AnalyticsReplayArchivePage() {
  const access = await getAdminPageAccess(
    "ANALYTICS_READ",
    "/admin/insights/replay",
  );

  if (access.denied) return <AdminForbidden {...access.denied} />;

  const sessions = await listRecentReplaySessions({ take: 50 }).catch(
    (error: unknown) => {
      if (process.env.NODE_ENV === "development") {
        console.error("[admin] failed to load replay sessions", error);
      }

      return null;
    },
  );

  if (!sessions) return <AdminDatabaseFallback />;

  return (
    <AdminShell
      active="insights"
      admin={access.admin}
      description="Replay נשמר first-party ב־Postgres, ללא replay במסכי admin וללא ערכי input/תשלום."
      title="Replay Archive"
    >
      <Card className="rounded-md">
        <CardHeader>
          <CardTitle>Sessions אחרונים עם replay</CardTitle>
        </CardHeader>
        <CardContent>
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow>
                <TableHead>Session</TableHead>
                <TableHead>Entry</TableHead>
                <TableHead>Exit</TableHead>
                <TableHead>Chunks</TableHead>
                <TableHead>Events</TableHead>
                <TableHead>Last seen</TableHead>
                <TableHead>Open</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.length === 0 ? (
                <TableEmptyRow
                  colSpan={7}
                  description="כאשר replay chunks ייקלטו, הם יופיעו כאן."
                  icon={Play}
                  title="אין replay sessions עדיין"
                />
              ) : (
                sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-mono text-xs">
                      {session.id.slice(0, 12)}
                    </TableCell>
                    <TableCell>{session.entryPath ?? "—"}</TableCell>
                    <TableCell>{session.exitPath ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {session._count.replayChunks}
                      </Badge>
                    </TableCell>
                    <TableCell>{session._count.events}</TableCell>
                    <TableCell>
                      {formatHebrewDateTime(session.lastSeenAt)}
                    </TableCell>
                    <TableCell>
                      <Link
                        className="underline underline-offset-4"
                        href={`/admin/insights/replay/${session.id}`}
                      >
                        Replay
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminShell>
  );
}
