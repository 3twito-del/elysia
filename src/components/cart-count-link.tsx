"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import {
  forwardRef,
  useEffect,
  useState,
  type ComponentPropsWithoutRef,
} from "react";

import {
  CART_UPDATED_EVENT,
  getStoredCartSessionKey,
} from "~/lib/cart-session";
import { getOfflineCartDelta } from "~/lib/pwa-offline";
import { cn } from "~/lib/utils";

type CartCountResponse = {
  itemCount: number;
};

type CartCountLinkProps = Omit<
  ComponentPropsWithoutRef<typeof Link>,
  "aria-label" | "children" | "href"
>;

export const CartCountLink = forwardRef<HTMLAnchorElement, CartCountLinkProps>(
  ({ className, prefetch = false, ...props }, ref) => {
    const [itemCount, setItemCount] = useState(0);
    const cartLabel =
      itemCount > 0 ? `סל קניות, ${itemCount} תכשיטים` : "סל קניות ריק";

    useEffect(() => {
      let cancelled = false;

      async function refreshCartCount() {
        const sessionKey = getStoredCartSessionKey();

        if (!sessionKey) {
          setItemCount(0);
          return;
        }

        try {
          const offlineDelta = await getOfflineCartDelta(sessionKey).catch(
            () => 0,
          );

          if (!navigator.onLine) {
            setItemCount(offlineDelta);
            return;
          }

          const response = await fetch(
            `/api/cart/count?sessionKey=${encodeURIComponent(sessionKey)}`,
            { cache: "no-store" },
          );

          if (!response.ok) {
            setItemCount(offlineDelta);
            return;
          }

          const data = (await response.json()) as CartCountResponse;

          if (!cancelled) {
            setItemCount(
              (Number.isFinite(data.itemCount) ? data.itemCount : 0) +
                offlineDelta,
            );
          }
        } catch {
          if (!cancelled) {
            const offlineDelta = await getOfflineCartDelta(sessionKey).catch(
              () => 0,
            );

            setItemCount(offlineDelta);
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
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange,
        );
      };
    }, []);

    return (
      <Link
        {...props}
        ref={ref}
        aria-label={cartLabel}
        className={cn("relative", className)}
        data-cart-state={itemCount > 0 ? "filled" : "empty"}
        href="/checkout"
        prefetch={prefetch}
      >
        <ShoppingBag aria-hidden="true" className="size-5" />
        {itemCount > 0 ? (
          <span
            aria-hidden="true"
            className="cart-count-badge absolute -top-1 -right-1.5 text-[0.66rem] leading-none font-semibold"
          >
            {itemCount > 99 ? "99+" : itemCount}
          </span>
        ) : null}
        <span aria-atomic="true" aria-live="polite" className="sr-only">
          {cartLabel}
        </span>
      </Link>
    );
  },
);

CartCountLink.displayName = "CartCountLink";
