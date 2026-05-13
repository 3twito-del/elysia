"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import {
  AlertCircle,
  CheckCircle2,
  Heart,
  PackageCheck,
  Sparkles,
} from "lucide-react";

import { WishlistButton } from "./wishlist-button";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { StatusMessage } from "~/components/ui/status-message";
import {
  dispatchCartUpdated,
  getOrCreateCartSessionKey,
} from "~/lib/cart-session";
import { formatPrice } from "~/lib/format";
import type { CatalogProductVariant } from "~/server/services/catalog";
import { api } from "~/trpc/react";

type ProductPurchasePanelProps = {
  productSlug: string;
  productName: string;
  price: number;
  variants: CatalogProductVariant[];
  metalColors: string[];
};

export function ProductPurchasePanel({
  productSlug,
  productName,
  price,
  variants,
  metalColors,
}: ProductPurchasePanelProps) {
  const [selectedSku, setSelectedSku] = useState(variants[0]?.sku ?? "");
  const canRenderStickyBar = useSyncExternalStore(
    subscribeToNoopStore,
    getClientSnapshot,
    getServerSnapshot,
  );
  const [cartMessage, setCartMessage] = useState<string | null>(null);
  const [cartMessageTone, setCartMessageTone] = useState<"error" | "success">(
    "success",
  );
  const selectedVariant =
    variants.find((variant) => variant.sku === selectedSku) ?? variants[0];
  const addItem = api.cart.addItem.useMutation({
    onSuccess: () => {
      setCartMessageTone("success");
      setCartMessage("הפריט נוסף לסל");
      dispatchCartUpdated();
    },
    onError: (error) => {
      setCartMessageTone("error");
      setCartMessage(error.message);
    },
  });

  function handleAddToCart() {
    if (!selectedVariant) return;

    addItem.mutate({
      sessionKey: getOrCreateCartSessionKey(),
      variantSku: selectedVariant.sku,
      quantity: 1,
    });
  }

  const stickyPurchaseBar = (
    <div
      className="public-floating-control motion-sticky-purchase glass-chrome fixed inset-x-3 bottom-[calc(var(--floating-stack-bottom,0px)+0.75rem+env(safe-area-inset-bottom))] z-40 rounded-md border p-2.5 shadow-[0_18px_48px_oklch(0_0_0_/_16%)] md:hidden"
      data-public-floating-bar="true"
    >
      <div className="mx-auto grid max-w-md grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
        <div className="order-2 min-w-0">
          <p className="text-muted-foreground truncate text-xs">
            {productName}
          </p>
          <p className="text-lg font-semibold">{formatPrice(price)}</p>
        </div>
        <Button
          aria-label={`הוספה לסל: ${productName}`}
          className="order-1"
          disabled={!selectedVariant || addItem.isPending}
          onClick={handleAddToCart}
          type="button"
        >
          {addItem.isPending ? "מוסיף..." : "הוספה לסל"}
          <PackageCheck className="size-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <div className="grid gap-5">
        <div className="grid gap-5">
          <div>
            <p className="mb-2 text-sm font-medium">מידה / וריאציה</p>
            <div className="flex flex-wrap gap-2">
              {variants.map((variant) => (
                <Button
                  aria-pressed={selectedSku === variant.sku}
                  className="min-h-11 min-w-11 px-4"
                  key={variant.sku}
                  onClick={() => setSelectedSku(variant.sku)}
                  type="button"
                  variant={
                    selectedSku === variant.sku ? "secondary" : "outline"
                  }
                >
                  {variant.size ?? variant.name}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">צבע מתכת</p>
            <div className="flex flex-wrap gap-2">
              {metalColors.map((color) => (
                <Badge key={color} variant="secondary">
                  {color}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Button
            disabled={!selectedVariant || addItem.isPending}
            onClick={handleAddToCart}
            size="lg"
            type="button"
          >
            {addItem.isPending ? "מוסיף..." : "הוספה לסל"}
            <PackageCheck className="size-4" />
          </Button>
          <WishlistButton productSlug={productSlug}>
            שמירה
            <Heart className="size-4" />
          </WishlistButton>
        </div>

        {cartMessage ? (
          <div className="motion-status-pop glass-inset flex items-center justify-between gap-3 rounded-md border p-3 text-sm">
            <StatusMessage
              className="flex min-w-0 flex-1 items-center gap-2"
              tone={cartMessageTone}
              variant="plain"
            >
              {cartMessageTone === "success" ? (
                <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
              ) : (
                <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
              )}
              {cartMessage}
            </StatusMessage>
            {cartMessageTone === "success" ? (
              <Button asChild size="sm" variant="secondary">
                <Link href="/checkout">מעבר לסל</Link>
              </Button>
            ) : null}
          </div>
        ) : null}

        <Button asChild variant="secondary">
          <Link href={`/ai?product=${productSlug}`}>
            מדידה חכמה
            <Sparkles className="size-4" />
          </Link>
        </Button>
        <div className="hidden">
          <div className="mx-auto grid max-w-md grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <div className="min-w-0">
              <p className="text-muted-foreground truncate text-xs">
                {productName}
              </p>
              <p className="text-lg font-semibold">{formatPrice(price)}</p>
            </div>
            <Button
              aria-label={`הוספה לסל: ${productName}`}
              disabled={!selectedVariant || addItem.isPending}
              onClick={handleAddToCart}
              type="button"
            >
              {addItem.isPending ? "מוסיף..." : "הוספה לסל"}
              <PackageCheck className="size-4" />
            </Button>
          </div>
        </div>
      </div>
      {canRenderStickyBar
        ? createPortal(stickyPurchaseBar, document.body)
        : null}
    </>
  );
}

function subscribeToNoopStore() {
  return () => undefined;
}

function getClientSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}
