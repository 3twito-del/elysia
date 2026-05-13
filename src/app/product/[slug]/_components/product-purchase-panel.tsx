"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import {
  AlertCircle,
  CheckCircle2,
  Heart,
  MapPin,
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
import {
  getProductAvailabilityLabel,
  getStockQuantityLabel,
} from "~/lib/commerce-labels";
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
  const selectedVariantBranchCount = selectedVariant?.availableBranchCount ?? 0;
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
          aria-label={`הוספה לסל: ${productName}`}
          className="order-1"
          aria-describedby="product-variant-feedback"
          disabled={addToCartDisabled}
          onClick={handleAddToCart}
          type="button"
        >
          {addItem.isPending
            ? "מוסיף..."
            : selectedVariantAvailable
              ? "הוספה לסל"
              : "לא זמינה"}
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
                  aria-label={getVariantButtonLabel(variant)}
                  aria-pressed={selectedSku === variant.sku}
                  className="min-h-11 min-w-11 px-4"
                  disabled={variant.availableQuantity <= 0}
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
          <div
            className="glass-inset grid gap-3 rounded-md border p-3"
            id="product-variant-feedback"
            data-testid="product-variant-feedback"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-muted-foreground text-xs">בחירה פעילה</p>
                <p className="mt-1 font-medium">
                  {selectedVariant
                    ? getVariantDisplayName(selectedVariant)
                    : "אין וריאציה זמינה"}
                </p>
              </div>
              <Badge
                variant={selectedVariantAvailable ? "outline" : "destructive"}
              >
                {selectedVariantAvailable
                  ? getProductAvailabilityLabel(selectedVariantBranchCount)
                  : "לא זמינה"}
              </Badge>
            </div>
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <PackageCheck className="size-4" aria-hidden="true" />
                {selectedVariant
                  ? getStockQuantityLabel(selectedVariant.availableQuantity)
                  : "אין מלאי"}
              </span>
              <span className="text-muted-foreground flex items-center gap-1.5">
                <MapPin className="size-4" aria-hidden="true" />
                {selectedVariantAvailable
                  ? getProductAvailabilityLabel(selectedVariantBranchCount)
                  : "מומלץ לתאם בסניף"}
              </span>
            </div>
            <StatusMessage
              size="xs"
              tone={selectedVariantAvailable ? "success" : "error"}
              variant="plain"
            >
              {selectedVariantAvailable
                ? "אפשר להוסיף את הבחירה הזו לסל ולהמשיך לקופה."
                : "בחרו מידה אחרת או תאמו בדיקת זמינות מול הסניף."}
            </StatusMessage>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">צבע מתכת</p>
            <div className="flex flex-wrap gap-2">
              {metalColors.length > 0 ? (
                metalColors.map((color) => (
                  <Badge key={color} variant="secondary">
                    {color}
                  </Badge>
                ))
              ) : (
                <span className="text-muted-foreground text-sm">
                  לפי הווריאציה הזמינה
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Button
            aria-describedby="product-variant-feedback"
            disabled={addToCartDisabled}
            onClick={handleAddToCart}
            size="lg"
            type="button"
          >
            {addItem.isPending
              ? "מוסיף..."
              : selectedVariantAvailable
                ? "הוספה לסל"
                : "לא זמינה"}
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
              <p className="text-lg font-semibold">
                {formatPrice(selectedVariantPrice)}
              </p>
            </div>
            <Button
              aria-label={`הוספה לסל: ${productName}`}
              aria-describedby="product-variant-feedback"
              disabled={addToCartDisabled}
              onClick={handleAddToCart}
              type="button"
            >
              {addItem.isPending
                ? "מוסיף..."
                : selectedVariantAvailable
                  ? "הוספה לסל"
                  : "לא זמינה"}
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
