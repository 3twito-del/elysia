"use client";

import Link from "next/link";
import { PackageCheck } from "lucide-react";
import { useId, useState } from "react";

import { Button } from "~/components/ui/button";
import { StatusMessage } from "~/components/ui/status-message";
import {
  dispatchCartUpdated,
  getOrCreateCartSessionKey,
} from "~/lib/cart-session";
import { queueOfflineJsonAction } from "~/lib/pwa-offline";

type ProductCardQuickAddButtonProps = {
  productName: string;
  variantSku: string;
};

type CartAddResponse = {
  error?: string;
  itemCount?: number;
  ok?: boolean;
};

export function ProductCardQuickAddButton({
  productName,
  variantSku,
}: ProductCardQuickAddButtonProps) {
  const statusId = useId();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"error" | "success">(
    "success",
  );

  async function handleQuickAdd() {
    if (pending) return;

    const sessionKey = getOrCreateCartSessionKey();

    setPending(true);
    setMessage(null);

    try {
      if (!navigator.onLine) {
        await queueOfflineJsonAction("cart.addItem", {
          quantity: 1,
          sessionKey,
          variantSku,
        });
        setMessageTone("success");
        setMessage("נשמר לסנכרון ויתווסף לסל כשהחיבור יתחדש.");
        dispatchCartUpdated();
        return;
      }

      const response = await fetch("/api/cart/items", {
        body: JSON.stringify({
          quantity: 1,
          sessionKey,
          variantSku,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const data = await readCartAddResponse(response);

      if (!response.ok || data?.ok === false) {
        throw new Error(data?.error ?? "Cart update failed.");
      }

      setMessageTone("success");
      setMessage("נוסף לסל.");
      dispatchCartUpdated();
    } catch {
      setMessageTone("error");
      setMessage("לא הצלחנו להוסיף לסל כרגע. אפשר להמשיך לפרטי התכשיט.");
    } finally {
      setPending(false);
    }
  }

  const hasMessage = Boolean(message);

  return (
    <div
      className="grid gap-1.5"
      data-testid="product-card-quick-add"
      dir="rtl"
    >
      <Button
        aria-describedby={hasMessage ? statusId : undefined}
        aria-label={`הוספה מהירה לסל: ${productName}`}
        className="product-card-quick-add-button h-8 w-full gap-1.5 text-xs"
        data-testid="product-card-quick-add-button"
        disabled={pending}
        onClick={handleQuickAdd}
        size="sm"
        type="button"
        variant="secondary"
      >
        {pending ? "מוסיפים" : "הוספה לסל"}
        <PackageCheck aria-hidden="true" className="size-3.5" />
      </Button>
      {message ? (
        <div className="flex min-w-0 items-center justify-between gap-2">
          <StatusMessage
            className="min-w-0 flex-1 truncate"
            id={statusId}
            role={messageTone === "error" ? "alert" : "status"}
            size="xs"
            testId="product-card-quick-add-feedback"
            tone={messageTone}
            variant="plain"
          >
            {message}
          </StatusMessage>
          {messageTone === "success" ? (
            <Link
              className="text-foreground shrink-0 text-xs font-medium underline-offset-4 hover:underline"
              href="/checkout"
            >
              לסל
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

async function readCartAddResponse(response: Response) {
  try {
    return (await response.json()) as CartAddResponse;
  } catch {
    return null;
  }
}
