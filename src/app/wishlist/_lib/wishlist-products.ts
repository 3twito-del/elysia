import type { CatalogProduct } from "~/server/services/catalog-types";

export type WishlistProductSummary = {
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
  return {
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
