import type { CatalogProduct } from "~/server/services/catalog";

// A sale is shown only when the data carries a real compare-at price that is
// strictly higher than the current price. No inferred or fabricated discounts.
export function getProductCardSale(
  product: Pick<CatalogProduct, "compareAt" | "price">,
) {
  if (!product.compareAt || product.compareAt <= product.price) return null;

  return { compareAt: product.compareAt };
}

// Never surface internal/legal placeholder values (bracketed CMS fallbacks) as
// public product metadata. Show only verified, bracket-free facts.
export function isDisplayableProductDetail(
  detail: string | null | undefined,
): detail is string {
  if (!detail) return false;

  const trimmed = detail.trim();

  return trimmed.length > 0 && !trimmed.includes("[") && !trimmed.includes("]");
}

// Build the quiet product-card metadata line. Placeholder/empty values are
// dropped so the card never renders brackets or a dangling separator.
export function getProductCardMeta(
  product: { material?: string | null },
  publicCollectionName?: string,
) {
  const productDetails = [product.material, publicCollectionName].filter(
    (detail): detail is string => isDisplayableProductDetail(detail),
  );
  const productMeta = productDetails.join(" · ");

  return { productDetails, productMeta };
}
