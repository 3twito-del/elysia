import {
  getPublicProductCommerceStatus,
  getPublicStockStatusLabel,
  type PublicProductAvailabilityMode,
} from "~/lib/commerce-labels";
import { formatPrice } from "~/lib/format";
import type { SizeFitKind } from "~/lib/size-fit";
import type {
  CatalogProduct,
  CatalogProductVariant,
} from "~/server/services/catalog-types";

export type ProductPurchaseConfidenceItem = {
  description: string;
  icon: "checkout" | "fit" | "service";
  key: "checkout" | "fit" | "service";
  title: string;
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
  return variant.size ?? variant.name;
}

export function getVariantButtonLabel(
  variant: CatalogProductVariant,
  availabilityMode: PublicProductAvailabilityMode,
  productSource: CatalogProduct["source"] = "OWN",
) {
  if (isShopifyDropshipVariantAvailable({ productSource, variant })) {
    return `${getVariantDisplayName(variant)}, ${formatPrice(variant.price)}, זמין דרך Shopify`;
  }

  const commerceStatus = getPublicProductCommerceStatus({
    availabilityMode,
    availableQuantity: variant.availableQuantity,
  });
  const availability =
    availabilityMode === "READY_TO_ORDER"
      ? getPublicStockStatusLabel(variant.availableQuantity)
      : commerceStatus.label;

  return `${getVariantDisplayName(variant)}, ${formatPrice(variant.price)}, ${availability}`;
}

export function isVariantSelectableForCart(input: {
  availabilityMode: PublicProductAvailabilityMode;
  productSource: CatalogProduct["source"];
  variant: CatalogProductVariant | undefined;
}) {
  if (!input.variant) return false;

  if (isShopifyDropshipVariantAvailable(input)) return true;

  return getPublicProductCommerceStatus({
    availabilityMode: input.availabilityMode,
    availableQuantity: input.variant.availableQuantity,
  }).canAddToCart;
}

export function getVariantStatusLabel(input: {
  availabilityMode: PublicProductAvailabilityMode;
  productSource: CatalogProduct["source"];
  variant: CatalogProductVariant | undefined;
}) {
  if (!input.variant) return "בירור התאמה";

  if (isShopifyDropshipVariantAvailable(input)) return "זמין דרך Shopify";

  return getPublicProductCommerceStatus({
    availabilityMode: input.availabilityMode,
    availableQuantity: input.variant.availableQuantity,
  }).label;
}

export function getPurchaseConfidenceItems(input: {
  availabilityMode: PublicProductAvailabilityMode;
  careInstructions?: string;
  deliveryPromise?: string;
  productSource: CatalogProduct["source"];
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
      title:
        input.productSource === "DROPSHIP_SHOPIFY"
          ? "מסלול ספק ברור"
          : "אישור לפני השלמה",
    },
    {
      description: input.sizeKind
        ? "מדריך המידות והמידה השמורה זמינים לפני צירוף לבחירה."
        : "אפשר לקבל ייעוץ התאמה אישי לפני השלמת ההזמנה.",
      icon: "fit",
      key: "fit",
      title: input.sizeKind ? "מידה לפני צירוף" : "התאמה לפני צירוף",
    },
    {
      description: getServiceConfidenceDescription(input),
      icon: "service",
      key: "service",
      title: hasAftercareFacts ? "מסירה, טיפול ואחריות" : "מסירה והחלפה",
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

function getCheckoutConfidenceDescription(input: {
  availabilityMode: PublicProductAvailabilityMode;
  productSource: CatalogProduct["source"];
  variant: CatalogProductVariant | undefined;
  variantStatusLabel: string;
}) {
  if (!input.variant) {
    return "בחרי מידה כדי לראות זמינות ומסלול הזמנה לפני המשך.";
  }

  if (isShopifyDropshipVariantAvailable(input)) {
    return "המידה זמינה דרך ספק Shopify; התשלום והמסירה יושלמו בקופת הספק.";
  }

  if (
    isVariantSelectableForCart({
      availabilityMode: input.availabilityMode,
      productSource: input.productSource,
      variant: input.variant,
    })
  ) {
    return `${input.variantStatusLabel}; הפרטים מאומתים לפני השלמת ההזמנה.`;
  }

  return `${input.variantStatusLabel}; אפשר לפתוח פנייה עם פרטי התכשיט.`;
}

function getServiceConfidenceDescription(input: {
  careInstructions?: string;
  deliveryPromise?: string;
  productSource: CatalogProduct["source"];
  returnPolicy?: string;
  warranty?: string;
}) {
  const delivery =
    input.deliveryPromise ??
    (input.productSource === "DROPSHIP_SHOPIFY"
      ? "מסירה ותשלום יושלמו בקופת הספק."
      : "מסירה עד הבית לאחר אישור הפרטים.");
  const returns =
    input.returnPolicy ??
    (input.productSource === "DROPSHIP_SHOPIFY"
      ? "החזרות והחלפות לפי מדיניות הספק."
      : "החלפה או החזרה בתיאום אישי לפי מדיניות Elysia.");
  const aftercare = [
    input.warranty ? `אחריות: ${input.warranty}` : null,
    input.careInstructions ? `טיפול: ${input.careInstructions}` : null,
  ].filter((fact): fact is string => Boolean(fact));

  return [delivery, returns, ...aftercare].join(" ");
}

function isShopifyDropshipVariantAvailable(input: {
  productSource: CatalogProduct["source"];
  variant: Pick<CatalogProductVariant, "externalVariantId"> | undefined;
}) {
  return (
    input.productSource === "DROPSHIP_SHOPIFY" &&
    Boolean(input.variant?.externalVariantId?.trim())
  );
}
