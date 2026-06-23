"use client";

import { useEffect, useRef, useState } from "react";

import { Card, CardContent } from "~/components/ui/card";

export function ReplayViewer({ events }: { events: unknown[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const replayerRef = useRef<{ play: () => void; pause: () => void } | null>(
    null,
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let disposed = false;
    const container = containerRef.current;

    if (!container || events.length === 0) return;

    container.innerHTML = "";
    setReady(false);

    void import("rrweb").then(({ Replayer }) => {
      if (disposed || !containerRef.current) return;

      const replayer = new Replayer(events as never[], {
        root: containerRef.current,
        showWarning: false,
      });

      replayerRef.current = replayer;
      setReady(true);
    });

    return () => {
      disposed = true;
      replayerRef.current?.pause();
      replayerRef.current = null;
      if (container) container.innerHTML = "";
    };
  }, [events]);

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          הטמעה first-party עם masking קבוע. צפייה זו נרשמת ב־AuditLog.
        </p>
        <button
          className="rounded-md border px-4 py-2 text-sm disabled:opacity-50"
          disabled={!ready}
          onClick={() => replayerRef.current?.play()}
          type="button"
        >
          Play replay
        </button>
      </div>

      <Card className="rounded-md">
        <CardContent className="p-4">
          {events.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              אין אירועי replay לניגון.
            </p>
          ) : (
            <div
              className="min-h-[520px] overflow-auto rounded-md border bg-white"
              ref={containerRef}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
