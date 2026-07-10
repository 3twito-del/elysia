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

export function createProductServiceHref(input: {
  productReference: string;
  reason: string;
}) {
  const params = new URLSearchParams({
    productReference: input.productReference,
    reason: input.reason,
  });

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

export function getVariantButtonLabel(
  variant: CatalogProductVariant,
  availabilityMode: PublicProductAvailabilityMode,
  requiresSeparateCheckout = false,
) {
  if (
    isSeparateCheckoutVariantAvailable({ requiresSeparateCheckout, variant })
  ) {
    return `${getVariantDisplayName(variant)}, ${formatInlinePrice(variant.price)}, זמין להזמנה`;
  }

  const commerceStatus = getPublicProductCommerceStatus({
    availabilityMode,
    availableQuantity: variant.availableQuantity,
  });
  const availability =
    availabilityMode === "READY_TO_ORDER"
      ? getPublicStockStatusLabel(variant.availableQuantity)
      : commerceStatus.label;

  return `${getVariantDisplayName(variant)}, ${formatInlinePrice(variant.price)}, ${availability}`;
}

export function isVariantSelectableForCart(input: {
  availabilityMode: PublicProductAvailabilityMode;
  requiresSeparateCheckout: boolean;
  variant: CatalogProductVariant | undefined;
}) {
  if (!input.variant) return false;

  if (isSeparateCheckoutVariantAvailable(input)) return true;

  return getPublicProductCommerceStatus({
    availabilityMode: input.availabilityMode,
    availableQuantity: input.variant.availableQuantity,
  }).canAddToCart;
}

export function getVariantStatusLabel(input: {
  availabilityMode: PublicProductAvailabilityMode;
  requiresSeparateCheckout: boolean;
  variant: CatalogProductVariant | undefined;
}) {
  if (!input.variant) return "בחרי אפשרות";

  if (isSeparateCheckoutVariantAvailable(input)) return "זמין להזמנה";

  return getPublicProductCommerceStatus({
    availabilityMode: input.availabilityMode,
    availableQuantity: input.variant.availableQuantity,
  }).label;
}

export function getPurchaseConfidenceItems(input: {
  availabilityMode: PublicProductAvailabilityMode;
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
