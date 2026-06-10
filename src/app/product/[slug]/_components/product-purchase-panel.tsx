"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import {
  AlertCircle,
  CheckCircle2,
  Heart,
  MessageCircle,
  PackageCheck,
  RotateCcw,
  Ruler,
  ShieldCheck,
} from "lucide-react";

import { WishlistButton } from "./wishlist-button";
import {
  createProductServiceHref,
  getAddToCartFailureMessage,
  getBeforeOrderSummaryItems,
  getInitialVariantSku,
  getPurchaseConfidenceItems,
  getVariantButtonLabel,
  getVariantDisplayName,
  getVariantStatusLabel,
  isRecoverableOfflineCartError,
  isVariantSelectableForCart,
} from "./product-purchase-utils";
import { PushOptInButton } from "~/components/push-opt-in-button";
import { Button } from "~/components/ui/button";
import { StatusMessage } from "~/components/ui/status-message";
import {
  dispatchCartUpdated,
  getOrCreateCartSessionKey,
} from "~/lib/cart-session";
import {
  getClientSnapshot,
  getServerSnapshot,
  subscribeToNoopStore,
} from "~/lib/client-render-snapshot";
import {
  getPublicProductCommerceStatus,
  type PublicProductAvailabilityMode,
} from "~/lib/commerce-labels";
import { formatPrice } from "~/lib/format";
import { queueOfflineJsonAction } from "~/lib/pwa-offline";
import {
  findBestVariantForSavedSize,
  formatSavedSize,
  getSizeGuideHref,
  getSizeKindForCategory,
  type SizeFitMatch,
} from "~/lib/size-fit";
import {
  getSavedSize,
  subscribeToSavedSizeUpdates,
} from "~/lib/size-fit-storage";
import { cn } from "~/lib/utils";
import type { CatalogProductVariant } from "~/server/services/catalog-types";
import { api } from "~/trpc/react";

type ProductPurchasePanelProps = {
  productSlug: string;
  productName: string;
  productReference: string;
  categorySlug: string;
  requiresSeparateCheckout: boolean;
  availabilityMode: PublicProductAvailabilityMode;
  careInstructions?: string;
  deliveryPromise?: string;
  price: number;
  variants: CatalogProductVariant[];
  metalColors: string[];
  returnPolicy?: string;
  warranty?: string;
};

export function ProductPurchasePanel({
  productSlug,
  productName,
  productReference,
  categorySlug,
  careInstructions,
  requiresSeparateCheckout,
  availabilityMode,
  deliveryPromise,
  price,
  variants,
  metalColors,
  returnPolicy,
  warranty,
}: ProductPurchasePanelProps) {
  const [selectedSku, setSelectedSku] = useState(
    getInitialVariantSku(variants),
  );
  const canRenderStickyBar = useSyncExternalStore(
    subscribeToNoopStore,
    getClientSnapshot,
    getServerSnapshot,
  );
  const primaryCtaRef = useRef<HTMLDivElement | null>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [cartMessage, setCartMessage] = useState<string | null>(null);
  const [cartMessageTone, setCartMessageTone] = useState<"error" | "success">(
    "success",
  );
  const [savedSizeMatch, setSavedSizeMatch] =
    useState<SizeFitMatch<CatalogProductVariant> | null>(null);
  const sizeKind = getSizeKindForCategory(categorySlug);
  const selectedVariant =
    variants.find((variant) => variant.sku === selectedSku) ?? variants[0];
  const usesSeparateCheckout = requiresSeparateCheckout;
  const selectedVariantPrice = selectedVariant?.price ?? price;
  const selectedVariantQuantity = selectedVariant?.availableQuantity ?? 0;
  const commerceStatus = getPublicProductCommerceStatus({
    availableQuantity: selectedVariantQuantity,
    availabilityMode,
  });
  const selectedVariantAvailable = isVariantSelectableForCart({
    availabilityMode,
    requiresSeparateCheckout,
    variant: selectedVariant,
  });
  const selectedVariantStatusLabel = getVariantStatusLabel({
    availabilityMode,
    requiresSeparateCheckout,
    variant: selectedVariant,
  });
  const purchaseConfidenceItems = getPurchaseConfidenceItems({
    availabilityMode,
    careInstructions,
    deliveryPromise,
    requiresSeparateCheckout,
    returnPolicy,
    sizeKind,
    variant: selectedVariant,
    variantStatusLabel: selectedVariantStatusLabel,
    warranty,
  });
  const beforeOrderSummaryItems = getBeforeOrderSummaryItems({
    careInstructions,
    deliveryPromise,
    requiresSeparateCheckout,
    returnPolicy,
    warranty,
  });
  const serviceHref = createProductServiceHref({
    productReference,
    reason: commerceStatus.serviceReason,
  });
  const addItem = api.cart.addItem.useMutation({
    onSuccess: (_data, variables) => {
      const addedVariant = variants.find(
        (variant) => variant.sku === variables.variantSku,
      );

      setCartMessageTone("success");
      setCartMessage(
        addedVariant?.size
          ? `מידה ${addedVariant.size} נוספה לסל`
          : "התכשיט נוסף לסל",
      );
      dispatchCartUpdated();
    },
    onError: (error, variables) => {
      if (isRecoverableOfflineCartError(error)) {
        void queueAddToCartForSync(variables);
        return;
      }

      setCartMessageTone("error");
      setCartMessage(getAddToCartFailureMessage(error));
    },
  });
  const addToCartDisabled =
    !selectedVariant || !selectedVariantAvailable || addItem.isPending;
  const stickyVariantSummary = selectedVariant
    ? `${getVariantDisplayName(selectedVariant)} / ${selectedVariantStatusLabel}`
    : selectedVariantStatusLabel;
  const selectedVariantDisplayName = selectedVariant
    ? getVariantDisplayName(selectedVariant)
    : "בחירת מידה";
  const selectedVariantAvailabilityLabel = selectedVariantStatusLabel;
  const sizeGuideHref = sizeKind
    ? getSizeGuideHref(sizeKind, {
        productName,
        returnTo: `/product/${productSlug}`,
      })
    : undefined;
  const purchaseDecisionSummaryItems = [
    {
      label: "בחירה",
      value: selectedVariantDisplayName,
    },
    {
      label: "מחיר",
      value: formatPrice(selectedVariantPrice),
    },
    {
      label: "זמינות",
      value: selectedVariant ? selectedVariantAvailabilityLabel : "בחרי אפשרות",
    },
  ];

  useEffect(() => {
    if (!sizeKind) return;

    const syncSavedSize = () => {
      const savedSize = getSavedSize(sizeKind);
      const match = findBestVariantForSavedSize(variants, sizeKind, savedSize);

      setSavedSizeMatch(match);

      if (match) {
        setSelectedSku(match.variant.sku);
      }
    };

    syncSavedSize();
    return subscribeToSavedSizeUpdates(syncSavedSize);
  }, [sizeKind, variants]);

  useEffect(() => {
    if (!canRenderStickyBar) return;

    const primaryCta = primaryCtaRef.current;
    if (!primaryCta) return;

    const syncStickyBar = () => {
      const rect = primaryCta.getBoundingClientRect();

      setShowStickyBar(rect.bottom <= 0);
    };

    syncStickyBar();

    if (typeof IntersectionObserver !== "undefined") {
      const observer = new IntersectionObserver(() => syncStickyBar(), {
        rootMargin: "0px",
        threshold: [0, 1],
      });

      observer.observe(primaryCta);
      window.addEventListener("resize", syncStickyBar);
      window.addEventListener("scroll", syncStickyBar, { passive: true });

      return () => {
        observer.disconnect();
        window.removeEventListener("resize", syncStickyBar);
        window.removeEventListener("scroll", syncStickyBar);
      };
    }

    window.addEventListener("resize", syncStickyBar);
    window.addEventListener("scroll", syncStickyBar, { passive: true });

    return () => {
      window.removeEventListener("resize", syncStickyBar);
      window.removeEventListener("scroll", syncStickyBar);
    };
  }, [canRenderStickyBar]);

  function queueAddToCartForSync(input: {
    quantity?: number;
    sessionKey: string;
    variantSku: string;
  }) {
    return queueOfflineJsonAction("cart.addItem", {
      quantity: input.quantity ?? 1,
      sessionKey: input.sessionKey,
      variantSku: input.variantSku,
    })
      .then(() => {
        setCartMessageTone("success");
        setCartMessage("התכשיט נשמר לסנכרון ויתווסף לסל כשהחיבור יתחדש.");
        dispatchCartUpdated();
      })
      .catch(() => {
        setCartMessageTone("error");
        setCartMessage("לא הצלחנו לשמור את התכשיט במצב לא מקוון.");
      });
  }

  function handleAddToCart() {
    if (!selectedVariant || !selectedVariantAvailable) {
      setCartMessageTone("error");
      setCartMessage("התכשיט פתוח דרך השירות לפני הזמנה.");
      return;
    }

    if (!navigator.onLine) {
      const sessionKey = getOrCreateCartSessionKey();

      void queueOfflineJsonAction("cart.addItem", {
        quantity: 1,
        sessionKey,
        variantSku: selectedVariant.sku,
      })
        .then(() => {
          setCartMessageTone("success");
          setCartMessage("התכשיט נשמר לסנכרון ויתווסף לסל כשהחיבור יתחדש.");
          dispatchCartUpdated();
        })
        .catch(() => {
          setCartMessageTone("error");
          setCartMessage("לא הצלחנו לשמור את התכשיט במצב לא מקוון.");
        });
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
      className="public-floating-control motion-sticky-purchase glass-chrome fixed inset-x-3 bottom-[calc(var(--floating-stack-bottom,0px)+0.75rem+env(safe-area-inset-bottom))] z-40 rounded-md border p-2 shadow-none md:hidden"
      aria-label="פעולת רכישה מהירה"
      data-public-floating-bar="true"
      data-public-floating-bar-kind="product-purchase"
      data-public-floating-avoid="true"
      data-testid="product-sticky-purchase-bar"
    >
      <div className="mx-auto grid max-w-md grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <p className="text-muted-foreground truncate text-xs">
            {productName}
          </p>
          <p className="text-base leading-6 font-semibold">
            {formatPrice(selectedVariantPrice)}
          </p>
          <p
            className="text-muted-foreground truncate text-[0.68rem] leading-4"
            data-testid="product-sticky-variant-state"
          >
            {stickyVariantSummary}
          </p>
        </div>
        {selectedVariantAvailable ? (
          <Button
            aria-describedby="product-variant-feedback"
            aria-label={`הוספה לסל: ${productName}`}
            className="product-primary-cta order-1"
            data-testid="product-sticky-add-to-cart-button"
            disabled={addToCartDisabled}
            onClick={handleAddToCart}
            size="sm"
            type="button"
          >
            {addItem.isPending
              ? "מוסיפים לסל"
              : selectedVariantAvailable
                ? "הוספה לסל"
                : "לא פנוי כרגע"}
            <PackageCheck aria-hidden="true" className="size-4" />
          </Button>
        ) : (
          <Button asChild className="product-primary-cta order-1" size="sm">
            <Link href={serviceHref}>
              {commerceStatus.ctaLabel}
              <PackageCheck aria-hidden="true" className="size-4" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <>
      <div
        className="product-purchase-surface grid gap-6"
        data-public-floating-avoid="true"
        data-testid="product-purchase-panel"
      >
        <div className="grid gap-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold">בחירת מידה</p>
                {sizeKind ? (
                  <Link
                    className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs font-medium underline-offset-4 hover:underline"
                    href={sizeGuideHref ?? "/size-guide"}
                  >
                    <Ruler aria-hidden="true" className="size-3.5" />
                    מדריך מידות
                  </Link>
                ) : null}
              </div>
              <p className="text-muted-foreground mt-1 text-sm">
                {selectedVariant
                  ? getVariantDisplayName(selectedVariant)
                  : "אין התאמה פנויה"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {variants.map((variant) => {
              const isSelected = selectedSku === variant.sku;

              return (
                <Button
                  aria-label={getVariantButtonLabel(
                    variant,
                    availabilityMode,
                    requiresSeparateCheckout,
                  )}
                  aria-pressed={isSelected}
                  className="min-h-11 min-w-12 rounded-full px-4"
                  disabled={
                    !usesSeparateCheckout &&
                    availabilityMode === "READY_TO_ORDER" &&
                    variant.availableQuantity <= 0
                  }
                  key={variant.sku}
                  onClick={() => setSelectedSku(variant.sku)}
                  type="button"
                  variant={isSelected ? "default" : "outline"}
                >
                  {getVariantDisplayName(variant)}
                </Button>
              );
            })}
          </div>

          <div
            className="text-muted-foreground flex flex-wrap items-center gap-x-5 gap-y-2 text-sm"
            id="product-variant-feedback"
            data-testid="product-variant-feedback"
          >
            <span className="flex items-center gap-1.5">
              <PackageCheck className="size-4" aria-hidden="true" />
              {selectedVariant ? selectedVariantStatusLabel : "בחרי אפשרות"}
            </span>
          </div>
          {savedSizeMatch ? (
            <div
              className={cn(
                "rounded-md border p-3 text-sm leading-6",
                savedSizeMatch.available
                  ? "glass-inset"
                  : "border-destructive/30 bg-destructive/5 text-foreground",
              )}
              data-testid="product-saved-size-match"
            >
              <p className="font-medium">
                המידה השמורה:{" "}
                {formatSavedSize(
                  savedSizeMatch.kind,
                  savedSizeMatch.normalizedValue,
                )}
              </p>
              <p className="text-muted-foreground mt-1">
                {savedSizeMatch.exact
                  ? savedSizeMatch.available
                    ? "המידה המתאימה נבחרה."
                    : "המידה הזו אינה פנויה כרגע."
                  : savedSizeMatch.available
                    ? "נבחרה המידה הקרובה ביותר הזמינה."
                    : "המידה הקרובה ביותר אינה פנויה כרגע."}
              </p>
            </div>
          ) : null}

          <section
            aria-labelledby="product-purchase-decision-summary-title"
            className="border-y border-[var(--glass-border)] py-3"
            data-testid="product-purchase-decision-summary"
          >
            <div className="flex items-start gap-2">
              <ShieldCheck
                aria-hidden="true"
                className="mt-1 size-4 shrink-0"
              />
              <div className="min-w-0">
                <h2
                  className="text-sm font-semibold"
                  id="product-purchase-decision-summary-title"
                >
                  לפני שמוסיפים לסל
                </h2>
                <p className="text-muted-foreground mt-1 text-sm leading-6">
                  הבחירה, המחיר והזמינות מסוכמים כאן כדי לבדוק התאמה לפני
                  ההזמנה.
                </p>
              </div>
            </div>
            <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
              {purchaseDecisionSummaryItems.map((item) => (
                <div className="min-w-0" key={item.label}>
                  <dt className="text-muted-foreground">{item.label}</dt>
                  <dd className="mt-1 truncate font-medium">{item.value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-3 flex flex-wrap gap-2">
              {sizeGuideHref ? (
                <Button asChild size="sm" variant="outline">
                  <Link href={sizeGuideHref}>
                    <Ruler aria-hidden="true" className="size-4" />
                    מדריך מידות
                  </Link>
                </Button>
              ) : null}
              <Button asChild size="sm" variant="ghost">
                <Link href={serviceHref}>
                  <MessageCircle aria-hidden="true" className="size-4" />
                  שירות אישי על הפריט
                </Link>
              </Button>
            </div>
          </section>
        </div>

        <div className="grid gap-3" ref={primaryCtaRef}>
          {selectedVariantAvailable ? (
            <Button
              aria-describedby="product-variant-feedback"
              className="product-primary-cta h-12 w-full"
              data-testid="product-add-to-cart-button"
              disabled={addToCartDisabled}
              onClick={handleAddToCart}
              size="lg"
              type="button"
            >
              {addItem.isPending
                ? "מוסיפים לסל"
                : selectedVariantAvailable
                  ? "הוספה לסל"
                  : "לא פנוי כרגע"}
              <PackageCheck aria-hidden="true" className="size-4" />
            </Button>
          ) : (
            <Button
              asChild
              className="product-primary-cta h-12 w-full"
              size="lg"
            >
              <Link href={serviceHref}>
                {commerceStatus.ctaLabel}
                <PackageCheck aria-hidden="true" className="size-4" />
              </Link>
            </Button>
          )}
          <WishlistButton productSlug={productSlug}>
            שמירה למועדפים
            <Heart aria-hidden="true" className="size-4" />
          </WishlistButton>
          {!selectedVariantAvailable ? (
            <PushOptInButton
              label="עדכנו אותי כשהוא חוזר למלאי"
              marketing
              productSlug={productSlug}
            />
          ) : null}
        </div>

        <div
          aria-label="שירות ואישור בהזמנה"
          className="grid gap-2"
          data-testid="product-commerce-trust"
        >
          <section
            aria-labelledby="product-before-order-summary-title"
            className="glass-inset grid gap-4 rounded-md border p-4 text-sm leading-6"
            data-testid="product-before-order-summary"
          >
            <div className="flex items-start gap-2">
              <ShieldCheck
                aria-hidden="true"
                className="mt-1 size-4 shrink-0"
              />
              <div className="min-w-0">
                <h2
                  className="font-semibold"
                  id="product-before-order-summary-title"
                >
                  לפני שמזמינים
                </h2>
                <p className="text-muted-foreground mt-1">
                  מסירה, החזרה, אחריות, טיפול ושירות מרוכזים כאן לפני ההחלטה.
                </p>
              </div>
            </div>
            <dl className="grid gap-2 sm:grid-cols-2">
              {beforeOrderSummaryItems.map((item) => (
                <div
                  className="rounded-md border border-[var(--glass-border)] p-3"
                  data-testid={`product-before-order-summary-${item.key}`}
                  key={item.key}
                >
                  <dt className="text-foreground font-medium">{item.label}</dt>
                  <dd className="text-muted-foreground mt-1">{item.value}</dd>
                </div>
              ))}
            </dl>
            <Button
              asChild
              className="w-full sm:w-fit"
              size="sm"
              variant="outline"
            >
              <Link href={serviceHref}>שאלה לפני הזמנה</Link>
            </Button>
          </section>
          {purchaseConfidenceItems.map((item) => {
            const Icon = purchaseConfidenceIconMap[item.icon];

            return (
              <div
                className="glass-inset flex items-start gap-2 rounded-md border p-3 text-sm"
                data-testid={`product-purchase-confidence-${item.key}`}
                key={item.key}
              >
                <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-muted-foreground mt-0.5 leading-5">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
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
                <Link data-testid="product-cart-checkout-link" href="/checkout">
                  לסל הקניות
                </Link>
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
                    data-material-swatch="true"
                    style={getMetalSwatchStyle(color)}
                  />
                  {color}
                </span>
              ))
            ) : (
              <span className="text-muted-foreground text-sm">
                לפי ההתאמה הפנויה
              </span>
            )}
          </div>
        </div>
      </div>
      {canRenderStickyBar && showStickyBar
        ? createPortal(stickyPurchaseBar, document.body)
        : null}
    </>
  );
}

const purchaseConfidenceIconMap = {
  checkout: ShieldCheck,
  fit: Ruler,
  service: RotateCcw,
} as const;

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
