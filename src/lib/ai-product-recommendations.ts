import { formatPrice } from "~/lib/format";

export const AI_RECOMMENDATION_LIMIT = 4;

export type AiRecommendedProductInput = {
  slug: string;
  url?: string;
  name: string;
  price?: number;
  formattedPrice?: string;
  image?: string;
  category?: string;
  material?: string;
  stone?: string;
  matchReason?: string;
  shortDescription?: string;
  description?: string;
  inventory?: Record<string, number | undefined>;
  availableBranchCount?: number;
  availableBranches?: readonly {
    name: string;
    city?: string;
    quantity?: number;
  }[];
};

export type AiRecommendedProduct = {
  slug: string;
  href: string;
  name: string;
  priceLabel?: string;
  image?: string;
  category?: string;
  material?: string;
  stone?: string;
  matchReason?: string;
  description: string;
  availableBranchCount?: number;
  availableBranches: readonly {
    name: string;
    city?: string;
    quantity?: number;
  }[];
};

export function normalizeAiRecommendedProducts(
  products: readonly AiRecommendedProductInput[],
  source: string,
) {
  const uniqueProducts = new Map<string, AiRecommendedProductInput>();

  for (const product of products) {
    if (!product.slug || uniqueProducts.has(product.slug)) continue;
    uniqueProducts.set(product.slug, product);
  }

  return Array.from(uniqueProducts.values())
    .slice(0, AI_RECOMMENDATION_LIMIT)
    .map((product, index): AiRecommendedProduct => {
      const availableBranches = product.availableBranches ?? [];

      return {
        slug: product.slug,
        href: createAiProductHref(product.slug, source, index),
        name: product.name,
        priceLabel:
          product.formattedPrice ??
          (typeof product.price === "number"
            ? formatPrice(product.price)
            : undefined),
        image: product.image,
        category: product.category,
        material: product.material,
        stone: product.stone,
        matchReason: product.matchReason,
        description: product.description ?? product.shortDescription ?? "",
        availableBranchCount:
          product.availableBranchCount ??
          getAvailableBranchCount(product.inventory),
        availableBranches,
      };
    });
}

export function createAiProductHref(
  slug: string,
  source: string,
  position: number,
) {
  const params = new URLSearchParams({
    q: `ai:${source}`,
    position: String(position),
  });

  return `/product/${slug}?${params.toString()}`;
}

function getAvailableBranchCount(
  inventory?: Record<string, number | undefined>,
) {
  if (!inventory) return undefined;

  return Object.values(inventory).filter((quantity) => (quantity ?? 0) > 0)
    .length;
}
