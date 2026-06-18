"use client";

import { Bell, BellOff } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "~/components/ui/button";
import { StatusMessage } from "~/components/ui/status-message";
import {
  getExistingElysiaPushSubscription,
  subscribeToElysiaPush,
  unsubscribeFromElysiaPush,
} from "~/lib/push-client";

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
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return;

    let cancelled = false;

    getExistingElysiaPushSubscription()
      .then((subscription) => {
        if (!cancelled) setIsSubscribed(Boolean(subscription));
      })
      .catch(() => {
        if (!cancelled) setIsSubscribed(false);
      })
      .finally(() => {
        if (!cancelled) setCheckingSubscription(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

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
      setIsSubscribed(true);
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

  async function unsubscribe() {
    setPending(true);
    setMessage(null);

    try {
      const result = await unsubscribeFromElysiaPush();

      setIsSubscribed(false);
      setTone("success");
      setMessage(
        result.unsubscribed
          ? "׳”׳¢׳“׳›׳•׳ ׳™׳ ׳›׳•׳‘׳• ׳‘׳׳›׳©׳™׳¨ ׳”׳–׳”."
          : "׳׳™׳ ׳¢׳“׳›׳•׳ ׳™׳ ׳₪׳¢׳™׳׳™׳ ׳‘׳׳›׳©׳™׳¨ ׳”׳–׳”.",
      );
    } catch (error) {
      setTone("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "׳׳ ׳”׳¦׳׳—׳ ׳• ׳׳›׳‘׳•׳× ׳¢׳“׳›׳•׳ ׳™׳ ׳›׳¨׳’׳¢.",
      );
    } finally {
      setPending(false);
    }
  }

  const handleClick = isSubscribed ? unsubscribe : subscribe;
  const Icon = isSubscribed ? BellOff : Bell;
  const buttonLabel = isSubscribed
    ? "׳›׳™׳‘׳•׳™ ׳¢׳“׳›׳•׳ ׳™׳ ׳‘׳׳›׳©׳™׳¨ ׳”׳–׳”"
    : label;

  return (
    <div className="grid gap-2">
      <Button
        aria-pressed={isSubscribed}
        className="gap-2"
        disabled={pending || checkingSubscription}
        onClick={handleClick}
        type="button"
        variant="outline"
      >
        <Icon aria-hidden="true" className="size-4" />
        {buttonLabel}
      </Button>
      {message ? (
        <StatusMessage size="xs" tone={tone} variant="plain">
          {message}
        </StatusMessage>
      ) : null}
    </div>
  );
}
