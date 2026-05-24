import {
  getPublicProductCommerceStatus,
  getPublicStockStatusLabel,
  type PublicProductAvailabilityMode,
} from "~/lib/commerce-labels";
import { formatPrice } from "~/lib/format";
import type { CatalogProductVariant } from "~/server/services/catalog";

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
) {
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
