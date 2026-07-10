import { getPublicProductCommerceStatus } from "~/lib/commerce-labels";
import type { CatalogProduct } from "~/server/services/catalog-types";

export type WishlistProductSummary = {
  availabilityLabel?: string;
  categoryName: string;
  collection: string;
  image: string;
  material: string;
  name: string;
  price: number;
  slug: string;
  stone?: string;
};

export function mapWishlistProductSummary(
  product: CatalogProduct,
): WishlistProductSummary {
  const availableQuantity = Object.values(product.inventory).reduce(
    (total, quantity) => total + quantity,
    0,
  );
  // No snapshot of price/availability from when the item was saved exists, so
  // this reflects current status rather than a detected change.
  const commerceStatus = getPublicProductCommerceStatus({
    availabilityMode: product.availabilityMode,
    availableQuantity,
  });

  return {
    availabilityLabel: commerceStatus.canAddToCart
      ? undefined
      : commerceStatus.label,
    categoryName: product.categoryName,
    collection: product.collection,
    image: product.image,
    material: product.material,
    name: product.name,
    price: product.price,
    slug: product.slug,
    stone: product.stone,
  };
}
