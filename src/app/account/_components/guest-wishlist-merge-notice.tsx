"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { mergeGuestWishlistAction } from "../actions";
import { StatusMessage } from "~/components/ui/status-message";
import {
  clearGuestWishlistItems,
  readGuestWishlistSlugs,
} from "~/lib/guest-wishlist";

export function GuestWishlistMergeNotice() {
  const router = useRouter();
  const startedRef = useRef(false);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [tone, setTone] = useState<"error" | "neutral" | "success">("neutral");

  useEffect(() => {
    if (startedRef.current) return;

    const slugs = readGuestWishlistSlugs();

    if (slugs.length === 0) return;

    startedRef.current = true;

    startTransition(async () => {
      const result = await mergeGuestWishlistAction(slugs);

      if (!result.ok) {
        setTone("error");
        setMessage(result.message ?? "לא ניתן לסנכרן מועדפים כרגע.");
        return;
      }

      clearGuestWishlistItems();

      if ((result.mergedCount ?? 0) > 0) {
        setTone("success");
        setMessage(
          `${result.mergedCount} פריטים מהמועדפים המקומיים נוספו לחשבון.`,
        );
        router.refresh();
      }
    });
  }, [router]);

  if (!message && !isPending) return null;

  return (
    <StatusMessage
      className="mb-5"
      role={tone === "error" ? "alert" : "status"}
      testId="account-guest-wishlist-merge-notice"
      tone={message ? tone : "neutral"}
    >
      {message ?? "מסנכרנים מועדפים שנשמרו במכשיר."}
    </StatusMessage>
  );
}
