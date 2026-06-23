import { notFound } from "next/navigation";

import { AdminShell } from "../../../_components/admin-shell";
import {
  AdminDatabaseFallback,
  AdminForbidden,
} from "../../../_components/admin-states";
import { getAdminPageAccess } from "../../../_lib/access";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent } from "~/components/ui/card";
import { formatHebrewDateTime } from "~/lib/format";
import { getReplaySessionForAdmin } from "~/server/services/analytics-replay";
import { ReplayViewer } from "../_components/replay-viewer";

export const metadata = {
  title: "Replay Viewer | Admin",
};

export const dynamic = "force-dynamic";

export default async function AnalyticsReplaySessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const access = await getAdminPageAccess(
    "ANALYTICS_READ",
    `/admin/insights/replay/${sessionId}`,
  );

  if (access.denied) return <AdminForbidden {...access.denied} />;

  const session = await getReplaySessionForAdmin({
    sessionId,
    adminUserId: access.admin.id,
  }).catch((error: unknown) => {
    if (process.env.NODE_ENV === "development") {
      console.error("[admin] failed to load replay session", error);
    }

    return undefined;
  });

  if (session === undefined) return <AdminDatabaseFallback />;
  if (!session) notFound();

  const events = session.replayChunks.flatMap((chunk) =>
    Array.isArray(chunk.events) ? chunk.events : [],
  );

  return (
    <AdminShell
      active="insights"
      admin={access.admin}
      description="צפייה ב־session replay ממוסך. raw input, תשלום ו־admin routes אינם נשמרים."
      title="Replay Viewer"
    >
      <Card className="mb-5 rounded-md">
        <CardContent className="grid gap-3 p-4 md:grid-cols-4">
          <div>
            <p className="text-muted-foreground text-xs">Session</p>
            <p className="font-mono text-sm">{session.id}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Entry / Exit</p>
            <p className="text-sm">
              {session.entryPath ?? "—"} → {session.exitPath ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Time</p>
            <p className="text-sm">
              {formatHebrewDateTime(session.startedAt)} ·{" "}
              {formatHebrewDateTime(session.lastSeenAt)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Replay</p>
            <div className="flex gap-2">
              <Badge variant="outline">
                {session.replayChunks.length} chunks
              </Badge>
              <Badge variant="outline">{events.length} events</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <ReplayViewer events={JSON.parse(JSON.stringify(events)) as unknown[]} />
    </AdminShell>
  );
}
