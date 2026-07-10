"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Activity, Eye, MousePointerClick, ShoppingBag } from "lucide-react";

import { MetricCard } from "~/components/metric-card";
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
import { formatPrice } from "~/lib/format";

export type LiveInsightsPayload = {
  generatedAt: string;
  activeWindowMinutes: number;
  kpiWindowMinutes: number;
  nextCursor: string;
  activeSessions: Array<{
    id: string;
    startedAt: string;
    lastSeenAt: string;
    entryPath: string | null;
    exitPath: string | null;
    referrer: string | null;
    utm: unknown;
    device: unknown;
    eventCount: number;
    replayEnabled: boolean;
    replayChunks: number;
    events: number;
    visitorId: string | null;
    firstPath: string | null;
  }>;
  events: Array<{
    id: string;
    type: string;
    occurredAt: string;
    source: string;
    path: string | null;
    title: string | null;
    consentMode: string;
    sessionId: string | null;
    replayChunks: number;
    replayEnabled: boolean;
    product: { name: string; slug: string } | null;
    order: { orderNumber: string; total: number } | null;
  }>;
  kpis: {
    pageViews: number;
    routeChanges: number;
    productViews: number;
    addToCart: number;
    checkouts: number;
    orders: number;
    paymentCaptured: number;
    searches: number;
    ctaClicks: number;
    formErrors: number;
    totalEvents: number;
  };
};

export function AnalyticsLiveConsole({
  initialData,
}: {
  initialData: LiveInsightsPayload;
}) {
  const [data, setData] = useState(initialData);
  const [cursor, setCursor] = useState(initialData.nextCursor);
  const [status, setStatus] = useState<"live" | "paused" | "error">("live");
  const latestEvents = useMemo(
    () => [...data.events].reverse().slice(0, 60),
    [data.events],
  );

  useEffect(() => {
    if (status === "paused") return;

    const interval = window.setInterval(() => {
      void fetch(
        `/api/admin/insights/live?cursor=${encodeURIComponent(cursor)}`,
      )
        .then((response) => {
          if (!response.ok) throw new Error("Live insights failed.");

          return response.json() as Promise<LiveInsightsPayload & { ok: true }>;
        })
        .then((next) => {
          setData((previous) => ({
            ...next,
            events: mergeEvents(previous.events, next.events),
          }));
          setCursor(next.nextCursor);
          setStatus("live");
        })
        .catch(() => setStatus("error"));
    }, 5_000);

    return () => window.clearInterval(interval);
  }, [cursor, status]);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge variant={status === "live" ? "default" : "outline"}>
            {status === "live"
              ? "Live"
              : status === "paused"
                ? "Paused"
                : "Error"}
          </Badge>
          <span className="text-muted-foreground text-sm">
            Polling כל 5 שניות · עודכן {formatDateTime(data.generatedAt)}
          </span>
        </div>
        <button
          className="rounded-md border px-3 py-2 text-sm"
          onClick={() =>
            setStatus((current) => (current === "paused" ? "live" : "paused"))
          }
          type="button"
        >
          {status === "paused" ? "המשך Live" : "השהה"}
        </button>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          detail={`${data.activeSessions.length} sessions פעילות`}
          icon={Activity}
          label="Live events"
          value={String(data.kpis.totalEvents)}
        />
        <MetricCard
          detail={`${data.kpis.routeChanges} route changes`}
          icon={Eye}
          label="Page views"
          value={String(data.kpis.pageViews)}
        />
        <MetricCard
          detail={`${data.kpis.checkouts} checkouts · ${data.kpis.orders} orders`}
          icon={ShoppingBag}
          label="Purchase intent"
          value={String(data.kpis.addToCart)}
        />
        <MetricCard
          detail={`${data.kpis.searches} searches · ${data.kpis.formErrors} form errors`}
          icon={MousePointerClick}
          label="Interactions"
          value={String(data.kpis.ctaClicks)}
        />
      </div>

      <Card className="rounded-md">
        <CardHeader>
          <CardTitle>מבקרים פעילים</CardTitle>
        </CardHeader>
        <CardContent>
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow>
                <TableHead>Session</TableHead>
                <TableHead>נתיב אחרון</TableHead>
                <TableHead>Events</TableHead>
                <TableHead>Replay</TableHead>
                <TableHead>UTM</TableHead>
                <TableHead>נראה לאחרונה</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.activeSessions.length === 0 ? (
                <TableEmptyRow
                  colSpan={6}
                  description="אין sessions פעילות בחלון 15 הדקות האחרונות."
                  icon={Activity}
                  title="אין תנועה חיה כרגע"
                />
              ) : (
                data.activeSessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-mono text-xs">
                      {session.id.slice(0, 10)}
                    </TableCell>
                    <TableCell>
                      {session.exitPath ?? session.entryPath ?? "—"}
                    </TableCell>
                    <TableCell>
                      {session.events || session.eventCount}
                    </TableCell>
                    <TableCell>
                      {session.replayChunks > 0 ? (
                        <Link
                          className="underline underline-offset-4"
                          href={`/admin/insights/replay/${session.id}`}
                        >
                          {session.replayChunks} chunks
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">אין</span>
                      )}
                    </TableCell>
                    <TableCell>{formatUtm(session.utm)}</TableCell>
                    <TableCell>{formatDateTime(session.lastSeenAt)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="rounded-md">
        <CardHeader>
          <CardTitle>Event stream</CardTitle>
        </CardHeader>
        <CardContent>
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow>
                <TableHead>זמן</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Path</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Commerce</TableHead>
                <TableHead>Replay</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {latestEvents.length === 0 ? (
                <TableEmptyRow
                  colSpan={6}
                  description="אירועים חדשים יופיעו כאן בזמן אמת."
                  icon={Activity}
                  title="אין אירועים חדשים"
                />
              ) : (
                latestEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>{formatDateTime(event.occurredAt)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{event.type}</Badge>
                    </TableCell>
                    <TableCell>{event.path ?? "—"}</TableCell>
                    <TableCell>{event.source}</TableCell>
                    <TableCell>
                      {event.order
                        ? `${event.order.orderNumber} · ${formatPrice(event.order.total)}`
                        : (event.product?.name ?? "—")}
                    </TableCell>
                    <TableCell>
                      {event.sessionId && event.replayChunks > 0 ? (
                        <Link
                          className="underline underline-offset-4"
                          href={`/admin/insights/replay/${event.sessionId}`}
                        >
                          replay
                        </Link>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function mergeEvents(
  previous: LiveInsightsPayload["events"],
  next: LiveInsightsPayload["events"],
) {
  const byId = new Map(previous.map((event) => [event.id, event]));

  for (const event of next) byId.set(event.id, event);

  return Array.from(byId.values())
    .sort(
      (first, second) =>
        new Date(first.occurredAt).getTime() -
        new Date(second.occurredAt).getTime(),
    )
    .slice(-100);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("he-IL", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(new Date(value));
}

function formatUtm(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return "direct / none";
  }

  const record = value as Record<string, unknown>;
  const source = typeof record.source === "string" ? record.source : "direct";
  const medium = typeof record.medium === "string" ? record.medium : "none";

  return `${source} / ${medium}`;
}
