"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";

import {
  CART_UPDATED_EVENT,
  getStoredCartSessionKey,
} from "~/lib/cart-session";

type CartCountResponse = {
  itemCount: number;
};

export function CartCountLink() {
  const [itemCount, setItemCount] = useState(0);
  const cartLabel =
    itemCount > 0 ? `סל קניות, ${itemCount} פריטים` : "סל קניות";

  useEffect(() => {
    let cancelled = false;

    async function refreshCartCount() {
      const sessionKey = getStoredCartSessionKey();

      if (!sessionKey) {
        setItemCount(0);
        return;
      }

      try {
        const response = await fetch(
          `/api/cart/count?sessionKey=${encodeURIComponent(sessionKey)}`,
          { cache: "no-store" },
        );

        if (!response.ok) {
          setItemCount(0);
          return;
        }

        const data = (await response.json()) as CartCountResponse;

        if (!cancelled) {
          setItemCount(Number.isFinite(data.itemCount) ? data.itemCount : 0);
        }
      } catch {
        if (!cancelled) {
          setItemCount(0);
        }
      }
    }

    void refreshCartCount();

    const handleCartUpdated = () => void refreshCartCount();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshCartCount();
      }
    };

    window.addEventListener(CART_UPDATED_EVENT, handleCartUpdated);
    window.addEventListener("focus", handleCartUpdated);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      window.removeEventListener(CART_UPDATED_EVENT, handleCartUpdated);
      window.removeEventListener("focus", handleCartUpdated);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <Link aria-label={cartLabel} className="relative" href="/checkout">
      <ShoppingBag aria-hidden="true" className="size-5" />
      {itemCount > 0 ? (
        <span
          aria-hidden="true"
          className="cart-count-badge bg-foreground text-background absolute -top-1.5 -right-1.5 grid h-5 min-w-5 place-items-center rounded-full px-1 text-[0.68rem] leading-none font-semibold"
        >
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      ) : null}
      <span aria-atomic="true" aria-live="polite" className="sr-only">
        {cartLabel}
      </span>
    </Link>
  );
}
