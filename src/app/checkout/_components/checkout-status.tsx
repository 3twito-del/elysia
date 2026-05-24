"use client";

import { useEffect, useState } from "react";

export function FieldError({ id, message }: { id: string; message?: string }) {
  return (
    <p
      className="text-destructive min-h-5 text-xs leading-5"
      data-testid={message ? `${id}-visible` : undefined}
      id={id}
      role={message ? "alert" : undefined}
    >
      {message}
    </p>
  );
}

export function ReservationCountdown({ expiresAt }: { expiresAt: Date }) {
  const [now, setNow] = useState<number | null>(null);
  const remainingMs =
    now === null ? null : Math.max(0, expiresAt.getTime() - now);
  const remainingMinutes =
    remainingMs === null ? null : Math.floor(remainingMs / 60_000);
  const remainingSeconds =
    remainingMs === null ? null : Math.floor((remainingMs % 60_000) / 1000);
  const countdownText =
    remainingMs === null
      ? "--:--"
      : `${String(remainingMinutes).padStart(2, "0")}:${String(
          remainingSeconds,
        ).padStart(2, "0")}`;

  useEffect(() => {
    function updateNow() {
      setNow(Date.now());
    }

    updateNow();
    const interval = window.setInterval(updateNow, 1000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="glass-inset rounded-md border p-4">
      <p className="text-muted-foreground text-sm">שמירת מלאי</p>
      <p aria-live="polite" className="mt-1 text-2xl font-semibold">
        {countdownText}
      </p>
    </div>
  );
}
