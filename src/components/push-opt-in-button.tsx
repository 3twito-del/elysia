"use client";

import { Bell } from "lucide-react";
import { useState } from "react";

import { Button } from "~/components/ui/button";
import { StatusMessage } from "~/components/ui/status-message";
import { subscribeToElysiaPush } from "~/lib/push-client";

type PushOptInButtonProps = {
  label?: string;
  marketing?: boolean;
  productSlug?: string;
};

export function PushOptInButton({
  label = "קבלת עדכונים",
  marketing = false,
  productSlug,
}: PushOptInButtonProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [tone, setTone] = useState<"error" | "success">("success");
  const [pending, setPending] = useState(false);

  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return null;

  async function subscribe() {
    setPending(true);
    setMessage(null);

    try {
      await subscribeToElysiaPush({
        marketingOptIn: marketing,
        productSlug,
        transactionalOptIn: true,
      });
      setTone("success");
      setMessage("העדכונים הופעלו במכשיר הזה.");
    } catch (error) {
      setTone("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "לא הצלחנו להפעיל עדכונים כרגע.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-2">
      <Button
        className="gap-2"
        disabled={pending}
        onClick={subscribe}
        type="button"
        variant="outline"
      >
        <Bell aria-hidden="true" className="size-4" />
        {label}
      </Button>
      {message ? (
        <StatusMessage size="xs" tone={tone} variant="plain">
          {message}
        </StatusMessage>
      ) : null}
    </div>
  );
}
