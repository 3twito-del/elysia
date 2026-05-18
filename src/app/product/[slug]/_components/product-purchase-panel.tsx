"use client";

import Link from "next/link";
import { useState, useSyncExternalStore, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, CheckCircle2, Heart, PackageCheck } from "lucide-react";

import { WishlistButton } from "./wishlist-button";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { StatusMessage } from "~/components/ui/status-message";
import {
  dispatchCartUpdated,
  getOrCreateCartSessionKey,
} from "~/lib/cart-session";
import {
  getProductAvailabilityLabel,
  getStockQuantityLabel,
} from "~/lib/commerce-labels";
import { formatPrice } from "~/lib/format";
import { cn } from "~/lib/utils";
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
  const [selectedSku, setSelectedSku] = useState(
    getInitialVariantSku(variants),
  );
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
  const selectedVariantAvailable =
    (selectedVariant?.availableQuantity ?? 0) > 0;
  const selectedVariantPrice = selectedVariant?.price ?? price;
  const selectedVariantQuantity = selectedVariant?.availableQuantity ?? 0;
  const addItem = api.cart.addItem.useMutation({
    onSuccess: (_data, variables) => {
      const addedVariant = variants.find(
        (variant) => variant.sku === variables.variantSku,
      );

      setCartMessageTone("success");
      setCartMessage(
        addedVariant?.size
          ? `${addedVariant.size} נוספה לסל`
          : "הפריט נוסף לסל",
      );
      dispatchCartUpdated();
    },
    onError: (error) => {
      setCartMessageTone("error");
      setCartMessage(error.message);
    },
  });
  const addToCartDisabled =
    !selectedVariant || !selectedVariantAvailable || addItem.isPending;

  function handleAddToCart() {
    if (!selectedVariant || !selectedVariantAvailable) {
      setCartMessageTone("error");
      setCartMessage("הווריאציה שנבחרה אינה זמינה כרגע.");
      return;
    }

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
          <p className="text-lg font-semibold">
            {formatPrice(selectedVariantPrice)}
          </p>
        </div>
        <Button
          aria-describedby="product-variant-feedback"
          aria-label={`הוספה לסל: ${productName}`}
          className="product-primary-cta order-1"
          disabled={addToCartDisabled}
          onClick={handleAddToCart}
          type="button"
        >
          {addItem.isPending
            ? "מוסיף..."
            : selectedVariantAvailable
              ? "הוספה לסל"
              : "לא זמין"}
          <PackageCheck aria-hidden="true" className="size-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <div className="grid gap-6">
        <div className="grid gap-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">בחירת מידה</p>
              <p className="text-muted-foreground mt-1 text-sm">
                {selectedVariant
                  ? getVariantDisplayName(selectedVariant)
                  : "אין וריאציה זמינה"}
              </p>
            </div>
            <Badge
              className="rounded-full"
              variant={selectedVariantAvailable ? "outline" : "destructive"}
            >
              {selectedVariantAvailable
                ? getProductAvailabilityLabel(selectedVariantQuantity)
                : "לא זמין"}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-2">
            {variants.map((variant) => (
              <Button
                aria-label={getVariantButtonLabel(variant)}
                aria-pressed={selectedSku === variant.sku}
                className={cn(
                  "min-h-11 min-w-12 rounded-full px-4",
                  selectedSku === variant.sku &&
                    "bg-foreground text-background hover:bg-foreground/90 hover:text-background",
                )}
                disabled={variant.availableQuantity <= 0}
                key={variant.sku}
                onClick={() => setSelectedSku(variant.sku)}
                type="button"
                variant="outline"
              >
                {variant.size ?? variant.name}
              </Button>
            ))}
          </div>

          <div
            className="text-muted-foreground flex flex-wrap items-center gap-x-5 gap-y-2 text-sm"
            id="product-variant-feedback"
            data-testid="product-variant-feedback"
          >
            <span className="flex items-center gap-1.5">
              <PackageCheck className="size-4" aria-hidden="true" />
              {selectedVariant
                ? getStockQuantityLabel(selectedVariant.availableQuantity)
                : "אין מלאי"}
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="size-4" aria-hidden="true" />
              {selectedVariantAvailable
                ? getProductAvailabilityLabel(selectedVariantQuantity)
                : "מומלץ לבדוק מול שירות הלקוחות"}
            </span>
          </div>
        </div>

        <div className="grid gap-3">
          <Button
            aria-describedby="product-variant-feedback"
            className="product-primary-cta h-12 w-full"
            disabled={addToCartDisabled}
            onClick={handleAddToCart}
            size="lg"
            type="button"
          >
            {addItem.isPending
              ? "מוסיף..."
              : selectedVariantAvailable
                ? "הוספה לסל"
                : "לא זמין"}
            <PackageCheck aria-hidden="true" className="size-4" />
          </Button>
          <WishlistButton productSlug={productSlug}>
            שמירה למועדפים
            <Heart aria-hidden="true" className="size-4" />
          </WishlistButton>
        </div>

        {cartMessage ? (
          <div className="motion-status-pop border-border flex items-center justify-between gap-3 rounded-md border p-3 text-sm">
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

        <div className="grid gap-3">
          <p className="text-sm font-semibold">גוון מתכת</p>
          <div className="flex flex-wrap gap-2">
            {metalColors.length > 0 ? (
              metalColors.map((color) => (
                <span
                  className="border-border inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm"
                  key={color}
                >
                  <span
                    aria-hidden="true"
                    className="size-3 rounded-full border border-black/10"
                    style={getMetalSwatchStyle(color)}
                  />
                  {color}
                </span>
              ))
            ) : (
              <span className="text-muted-foreground text-sm">
                לפי הווריאציה הזמינה
              </span>
            )}
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

function getInitialVariantSku(variants: CatalogProductVariant[]) {
  return (
    variants.find((variant) => variant.availableQuantity > 0)?.sku ??
    variants[0]?.sku ??
    ""
  );
}

function getVariantDisplayName(variant: CatalogProductVariant) {
  return variant.size ?? variant.name;
}

function getVariantButtonLabel(variant: CatalogProductVariant) {
  const availability =
    variant.availableQuantity > 0
      ? getStockQuantityLabel(variant.availableQuantity)
      : "לא זמין";

  return `${getVariantDisplayName(variant)}, ${formatPrice(variant.price)}, ${availability}`;
}

function getMetalSwatchStyle(color: string): CSSProperties {
  const normalized = color.toLowerCase();

  if (normalized.includes("ורוד") || normalized.includes("rose")) {
    return {
      background:
        "linear-gradient(135deg, #f7d7c7 0%, #c98e79 48%, #fff2eb 100%)",
    };
  }

  if (
    normalized.includes("לבן") ||
    normalized.includes("כסף") ||
    normalized.includes("white")
  ) {
    return {
      background:
        "linear-gradient(135deg, #ffffff 0%, #d7d9dd 48%, #f7f7f4 100%)",
    };
  }

  return {
    background:
      "linear-gradient(135deg, #fff0b8 0%, #d4a63d 48%, #fff7d9 100%)",
  };
}
