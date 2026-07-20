import {
  getPublicProductCommerceStatus,
  getPublicStockStatusLabel,
  type PublicProductAvailabilityMode,
} from "~/lib/commerce-labels";
import { formatInlinePrice } from "~/lib/format";
import { getPublicVariantOptionName } from "~/lib/product-display";
import type { SizeFitKind } from "~/lib/size-fit";
import type { CatalogProductVariant } from "~/server/services/catalog-types";

export type ProductPurchaseConfidenceItem = {
  description: string;
  icon: "checkout" | "fit" | "service";
  key: "checkout" | "fit" | "service";
  title: string;
};

export type ProductBeforeOrderSummaryItem = {
  key: "delivery" | "returns" | "warranty" | "care" | "gift";
  label: string;
  value: string;
};

export type ProductServiceReason = ReturnType<
  typeof getPublicProductCommerceStatus
>["serviceReason"];

// Which existing /service ContactTopic (prisma/seed.ts) best matches each
// reason. Left unmapped where no topic fits honestly — "made-to-order" and
// "availability" don't have a dedicated topic, so the topic selector keeps
// its normal default rather than being forced into a wrong bucket.
const serviceReasonTopicSlug: Partial<Record<ProductServiceReason, string>> =
  {
    consultation: "sizing",
  };

const serviceReasonMessagePrefill: Partial<
  Record<ProductServiceReason, (productReference: string) => string>
> = {
  "made-to-order": (productReference) =>
    `לגבי ${productReference}: מדובר בפריט בהזמנה אישית, ואשמח ליצור קשר להשלמת ההזמנה.`,
  consultation: (productReference) =>
    `לגבי ${productReference}: אשמח לתאם ייעוץ לפני ההזמנה.`,
  availability: (productReference) =>
    `לגבי ${productReference}: אשמח לבדוק זמינות במלאי.`,
};

/**
 * Carries the customer's reason for leaving the PDP (made-to-order,
 * consultation, out of stock, or a plain pre-purchase question) into the
 * service form as a pre-filled, editable topic/message — visible and
 * removable before submission, never silently attached (H-03: context
 * moves with the customer, minimized and consented).
 */
export function createProductServiceHref(input: {
  message?: string;
  productReference: string;
  reason?: ProductServiceReason;
}) {
  const params = new URLSearchParams({
    productReference: input.productReference,
  });

  const topicSlug = input.reason
    ? serviceReasonTopicSlug[input.reason]
    : undefined;
  if (topicSlug) params.set("topic", topicSlug);

  const message =
    input.message ??
    (input.reason
      ? serviceReasonMessagePrefill[input.reason]?.(input.productReference)
      : undefined);
  if (message) params.set("message", message);

  return `/service?${params.toString()}`;
}

export function getInitialVariantSku(variants: CatalogProductVariant[]) {
  return (
    variants.find((variant) => variant.availableQuantity > 0)?.sku ??
    variants[0]?.sku ??
    ""
  );
}

export function getVariantDisplayName(variant: CatalogProductVariant) {
  return variant.size ?? getPublicVariantOptionName(variant.name);
}

export function getSelectedVariantLabel(input: {
  metalColors: string[];
  sizeKind: SizeFitKind | null;
  variant: CatalogProductVariant;
}) {
  const kindLabel = input.sizeKind ? "מידה" : "אפשרות";
  const base = `${kindLabel}: ${getVariantDisplayName(input.variant)}`;

  return input.metalColors.length === 1
    ? `${base} · ${input.metalColors[0]}`
    : base;
}

// UX38: a variant with both a size and a metal/stone color has no other way
// to say which color a given picker button represents -- there's no
// separate color control, just a static swatch list below the size row
// (see the "גוון מתכת" block in product-purchase-panel.tsx). Every variant
// with a color gets it named here so screen readers always hear the full
// identity of what they're selecting, not just the size.
function getVariantColorDescriptor(variant: CatalogProductVariant) {
  return [variant.metalColor, variant.stoneColor]
    .filter((value): value is string => Boolean(value))
    .join(" · ");
}

export function getVariantButtonLabel(
  variant: CatalogProductVariant,
  availabilityMode: PublicProductAvailabilityMode,
  requiresSeparateCheckout = false,
  backorderEnabled = false,
) {
  const colorDescriptor = getVariantColorDescriptor(variant);
  const displayName = colorDescriptor
    ? `${getVariantDisplayName(variant)}, ${colorDescriptor}`
    : getVariantDisplayName(variant);

  if (
    isSeparateCheckoutVariantAvailable({ requiresSeparateCheckout, variant })
  ) {
    return `${displayName}, ${formatInlinePrice(variant.price)}, זמין להזמנה`;
  }

  const commerceStatus = getPublicProductCommerceStatus({
    availabilityMode,
    availableQuantity: variant.availableQuantity,
    backorderEnabled,
  });
  const availability =
    availabilityMode === "READY_TO_ORDER"
      ? getPublicStockStatusLabel(variant.availableQuantity)
      : commerceStatus.label;

  return `${displayName}, ${formatInlinePrice(variant.price)}, ${availability}`;
}

/**
 * Only true when picking blind would actually be ambiguous -- a single
 * product-wide color still gets named in the aria-label, but doesn't need
 * to clutter every visible pill when every button is the same color.
 */
export function hasAmbiguousVariantColors(variants: CatalogProductVariant[]) {
  const colors = new Set(
    variants
      .map((variant) => getVariantColorDescriptor(variant))
      .filter((descriptor) => descriptor.length > 0),
  );

  return colors.size > 1;
}

export function isVariantSelectableForCart(input: {
  availabilityMode: PublicProductAvailabilityMode;
  backorderEnabled?: boolean;
  requiresSeparateCheckout: boolean;
  variant: CatalogProductVariant | undefined;
}) {
  if (!input.variant) return false;

  if (isSeparateCheckoutVariantAvailable(input)) return true;

  return getPublicProductCommerceStatus({
    availabilityMode: input.availabilityMode,
    availableQuantity: input.variant.availableQuantity,
    backorderEnabled: input.backorderEnabled,
  }).canAddToCart;
}

export function getVariantStatusLabel(input: {
  availabilityMode: PublicProductAvailabilityMode;
  backorderEnabled?: boolean;
  requiresSeparateCheckout: boolean;
  variant: CatalogProductVariant | undefined;
}) {
  if (!input.variant) return "בחרי אפשרות";

  if (isSeparateCheckoutVariantAvailable(input)) return "זמין להזמנה";

  return getPublicProductCommerceStatus({
    availabilityMode: input.availabilityMode,
    availableQuantity: input.variant.availableQuantity,
    backorderEnabled: input.backorderEnabled,
  }).label;
}

export function getPurchaseConfidenceItems(input: {
  availabilityMode: PublicProductAvailabilityMode;
  backorderEnabled?: boolean;
  careInstructions?: string;
  deliveryPromise?: string;
  requiresSeparateCheckout: boolean;
  returnPolicy?: string;
  sizeKind: SizeFitKind | null;
  variant: CatalogProductVariant | undefined;
  variantStatusLabel: string;
  warranty?: string;
}): ProductPurchaseConfidenceItem[] {
  const hasAftercareFacts = [input.careInstructions, input.warranty].some(
    Boolean,
  );

  return [
    {
      description: getCheckoutConfidenceDescription(input),
      icon: "checkout",
      key: "checkout",
      title: input.requiresSeparateCheckout
        ? "מסלול הזמנה מאובטח"
        : "סיכום לפני תשלום",
    },
    {
      description: input.sizeKind
        ? "מדריך המידות והמידה השמורה זמינים לפני הוספה לסל."
        : "אפשר לקבל ייעוץ התאמה לפני שמוסיפים לסל.",
      icon: "fit",
      key: "fit",
      title: input.sizeKind ? "מידה לפני הוספה" : "שאלה לפני הוספה",
    },
    {
      description: getServiceConfidenceDescription(input),
      icon: "service",
      key: "service",
      title: hasAftercareFacts ? "משלוח, טיפול ואחריות" : "משלוח והחלפה",
    },
  ];
}

export function getBeforeOrderSummaryItems(input: {
  careInstructions?: string;
  deliveryPromise?: string;
  requiresSeparateCheckout: boolean;
  returnPolicy?: string;
  warranty?: string;
}): ProductBeforeOrderSummaryItem[] {
  return [
    {
      key: "delivery",
      label: "משלוח",
      value:
        input.deliveryPromise ??
        (input.requiresSeparateCheckout
          ? "המשלוח והתשלום יושלמו בקופה מאובטחת לאחר בחירת האפשרות."
          : "משלוח עד הבית לאחר השלמת פרטי ההזמנה והתשלום."),
    },
    {
      key: "returns",
      label: "החלפה והחזרה",
      value:
        input.returnPolicy ??
        (input.requiresSeparateCheckout
          ? "החלפות והחזרות מטופלות בתיאום שירות אישי."
          : "החלפה או החזרה לפי מדיניות Elysia לפני סיום ההזמנה."),
    },
    {
      key: "warranty",
      label: "אחריות 12 חודשים",
      value:
        input.warranty ??
        "אחריות 12 חודשים על פגמי ייצור, בכפוף למדיניות האחריות.",
    },
    {
      key: "care",
      label: "טיפול",
      value:
        input.careInstructions ??
        "מומלץ להסיר לפני מים, שינה, ספורט, בושם וחומרי ניקוי.",
    },
    {
      key: "gift",
      label: "מתנה ושירות",
      value:
        "אפשר לפנות לשירות לפני ההזמנה כדי לוודא מידה, גוון, התאמה למתנה או אופן משלוח.",
    },
  ];
}

export function isRecoverableOfflineCartError(error: { message: string }) {
  if (typeof navigator !== "undefined" && !navigator.onLine) return true;

  const message = error.message.toLowerCase();

  return (
    message.includes("failed to fetch") ||
    message.includes("fetch failed") ||
    message.includes("load failed") ||
    message.includes("network")
  );
}

export function getAddToCartFailureMessage(error: { message: string }) {
  const message = error.message.toLowerCase();

  if (
    message.includes("stock") ||
    message.includes("inventory") ||
    message.includes("unavailable") ||
    message.includes("variant")
  ) {
    return "האפשרות הזו אינה זמינה. אפשר לבחור אחרת או לפנות לשירות.";
  }

  if (
    message.includes("quantity") ||
    message.includes("amount") ||
    message.includes("limit")
  ) {
    return "לא ניתן להוסיף כמות זו לסל. נסי כמות אחרת או פני לשירות.";
  }

  return "לא הצלחנו להוסיף לסל. ניתן לנסות שוב.";
}

function getCheckoutConfidenceDescription(input: {
  availabilityMode: PublicProductAvailabilityMode;
  backorderEnabled?: boolean;
  requiresSeparateCheckout: boolean;
  variant: CatalogProductVariant | undefined;
  variantStatusLabel: string;
}) {
  if (!input.variant) {
    return "בחרי מידה כדי לראות זמינות, מחיר ומסלול הזמנה לפני המשך.";
  }

  if (isSeparateCheckoutVariantAvailable(input)) {
    return "האפשרות זמינה להזמנה; התשלום והמשלוח יושלמו בקופה מאובטחת.";
  }

  if (
    isVariantSelectableForCart({
      availabilityMode: input.availabilityMode,
      backorderEnabled: input.backorderEnabled,
      requiresSeparateCheckout: input.requiresSeparateCheckout,
      variant: input.variant,
    })
  ) {
    return `${input.variantStatusLabel}; הפרטים יוצגו לפני הזמנה.`;
  }

  return `${input.variantStatusLabel}; ניתן לפתוח פנייה עם פרטי התכשיט.`;
}

function getServiceConfidenceDescription(input: {
  careInstructions?: string;
  deliveryPromise?: string;
  requiresSeparateCheckout: boolean;
  returnPolicy?: string;
  warranty?: string;
}) {
  const delivery =
    input.deliveryPromise ??
    (input.requiresSeparateCheckout
      ? "המשלוח והתשלום יושלמו בקופה מאובטחת."
      : "משלוח עד הבית לאחר השלמת התשלום.");
  const returns =
    input.returnPolicy ??
    (input.requiresSeparateCheckout
      ? "החלפות והחזרות מטופלות בתיאום שירות אישי."
      : "החלפה או החזרה לפי מדיניות Elysia.");
  const aftercare = [
    input.warranty ? `אחריות: ${input.warranty}` : null,
    input.careInstructions ? `טיפול: ${input.careInstructions}` : null,
  ].filter((fact): fact is string => Boolean(fact));

  return [delivery, returns, ...aftercare].join(" ");
}

function isSeparateCheckoutVariantAvailable(input: {
  requiresSeparateCheckout: boolean;
  variant: Pick<CatalogProductVariant, "separateCheckoutAvailable"> | undefined;
}) {
  return (
    input.requiresSeparateCheckout &&
    Boolean(input.variant?.separateCheckoutAvailable)
  );
}
