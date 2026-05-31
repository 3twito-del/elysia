import {
  getPublicProductCommerceStatus,
  getPublicStockStatusLabel,
  type PublicProductAvailabilityMode,
} from "~/lib/commerce-labels";
import { formatPrice } from "~/lib/format";
import type {
  CatalogProduct,
  CatalogProductVariant,
} from "~/server/services/catalog-types";

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

function isShopifyDropshipVariantAvailable(input: {
  productSource: CatalogProduct["source"];
  variant: Pick<CatalogProductVariant, "externalVariantId"> | undefined;
}) {
  return (
    input.productSource === "DROPSHIP_SHOPIFY" &&
    Boolean(input.variant?.externalVariantId?.trim())
  );
}
