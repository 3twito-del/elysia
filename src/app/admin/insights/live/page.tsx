import Link from "next/link";

import { AdminShell } from "../../_components/admin-shell";
import {
  AdminDatabaseFallback,
  AdminForbidden,
} from "../../_components/admin-states";
import { getAdminPageAccess } from "../../_lib/access";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent } from "~/components/ui/card";
import { getAdminLiveInsights } from "~/server/services/analytics-insights";
import {
  AnalyticsLiveConsole,
  type LiveInsightsPayload,
} from "./_components/analytics-live-console";

export const metadata = {
  title: "Live Insights | Admin",
};

export const dynamic = "force-dynamic";

export default async function AdminLiveInsightsPage() {
  const access = await getAdminPageAccess(
    "ANALYTICS_READ",
    "/admin/insights/live",
  );

  if (access.denied) return <AdminForbidden {...access.denied} />;

  const live = await getAdminLiveInsights().catch((error: unknown) => {
    if (process.env.NODE_ENV === "development") {
      console.error("[admin] failed to load live insights", error);
    }

    return null;
  });

  if (!live) return <AdminDatabaseFallback />;

  return (
    <AdminShell
      active="insights"
      admin={access.admin}
      description="First-party live console: sessions פעילות, stream אירועים, funnel intent ו־session replay."
      title="Live Insights"
    >
      <Card className="mb-5 rounded-md">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-2">
            <Badge>First-party</Badge>
            <span className="text-muted-foreground text-sm">
              Polling מאובטח כל 5 שניות, ללא WebSocket וללא ספק analytics
              חיצוני.
            </span>
          </div>
          <div className="flex gap-3 text-sm">
            <Link
              className="underline underline-offset-4"
              href="/admin/insights"
            >
              Overview
            </Link>
            <Link
              className="underline underline-offset-4"
              href="/admin/insights/replay"
            >
              Replay archive
            </Link>
          </div>
        </CardContent>
      </Card>

      <AnalyticsLiveConsole
        initialData={JSON.parse(JSON.stringify(live)) as LiveInsightsPayload}
      />
    </AdminShell>
  );
}
