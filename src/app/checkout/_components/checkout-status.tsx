"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Clock3, WifiOff } from "lucide-react";

import { cn } from "~/lib/utils";

export type CheckoutPaymentStatusKind =
  | "loading"
  | "ready"
  | "retry"
  | "unavailable";

const checkoutPaymentStatusCopy = {
  loading: {
    icon: Clock3,
    label: "בודקים את פרטי התשלום",
    text: "הכפתורים נעולים למניעת שליחה כפולה.",
    tone: "text-muted-foreground",
  },
  ready: {
    icon: CheckCircle2,
    label: "מוכן לאישור בטוח",
    text: "אין חיוב בשלב זה. הסכום והפרטים יאושרו לפני המשך.",
    tone: "text-muted-foreground",
  },
  retry: {
    icon: AlertCircle,
    label: "נדרש ניסיון חוזר",
    text: "לא זוהה חיוב כפול. בדקו את ההודעה ונסו שוב.",
    tone: "text-destructive",
  },
  unavailable: {
    icon: WifiOff,
    label: "תשלום לא זמין כרגע",
    text: "המשך לתשלום דורש חיבור פעיל. שינויי הסל יישמרו ויוכלו להסתנכרן.",
    tone: "text-destructive",
  },
} satisfies Record<
  CheckoutPaymentStatusKind,
  {
    icon: typeof CheckCircle2;
    label: string;
    text: string;
    tone: string;
  }
>;

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

export function CheckoutPaymentStatus({
  status,
}: {
  status: CheckoutPaymentStatusKind;
}) {
  const copy = checkoutPaymentStatusCopy[status];
  const Icon = copy.icon;

  return (
    <div
      className={cn(
        "glass-inset flex items-start gap-2 rounded-md border p-3 text-sm",
        copy.tone,
      )}
      data-payment-status={status}
      data-testid="checkout-payment-status"
    >
      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0">
        <p className="font-medium">{copy.label}</p>
        <p className="text-muted-foreground mt-0.5 leading-6">{copy.text}</p>
      </div>
    </div>
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
      <p className="text-muted-foreground text-sm">שמירת התכשיטים</p>
      <p aria-live="polite" className="mt-1 text-2xl font-semibold">
        {countdownText}
      </p>
    </div>
  );
}
