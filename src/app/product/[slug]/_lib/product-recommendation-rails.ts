import type { CatalogProduct } from "~/server/services/catalog";

export type ProductRecommendationRail = {
  id: "collection" | "category" | "material" | "popular";
  products: CatalogProduct[];
  title: string;
};

type ProductRecommendationRailInput = {
  maxProductsPerRail?: number;
  product: CatalogProduct;
  products: CatalogProduct[];
};

const DEFAULT_MAX_PRODUCTS_PER_RAIL = 4;

export function getProductRecommendationRails({
  maxProductsPerRail = DEFAULT_MAX_PRODUCTS_PER_RAIL,
  product,
  products,
}: ProductRecommendationRailInput): ProductRecommendationRail[] {
  const candidates = products.filter((item) => item.slug !== product.slug);
  const usedSlugs = new Set<string>();
  const rails: ProductRecommendationRail[] = [];

  addRail({
    candidates,
    id: "collection",
    maxProductsPerRail,
    predicate: (candidate) =>
      candidate.collections.includes(product.collection),
    product,
    rails,
    title: `עוד מקולקציית ${product.collection}`,
    usedSlugs,
  });
  addRail({
    candidates,
    id: "category",
    maxProductsPerRail,
    predicate: (candidate) => candidate.categorySlug === product.categorySlug,
    product,
    rails,
    title: `עוד בקטגוריית ${product.categoryName}`,
    usedSlugs,
  });
  addRail({
    candidates,
    id: "material",
    maxProductsPerRail,
    predicate: (candidate) =>
      candidate.material === product.material ||
      Boolean(product.stone && candidate.stone === product.stone),
    product,
    rails,
    title: `בחירה דומה ב${product.material}`,
    usedSlugs,
  });

  if (rails.length === 0) {
    addRail({
      candidates,
      id: "popular",
      maxProductsPerRail,
      predicate: () => true,
      product,
      rails,
      title: "מומלצים מהקטלוג",
      usedSlugs,
    });
  }

  return rails;
}

function addRail(input: {
  candidates: CatalogProduct[];
  id: ProductRecommendationRail["id"];
  maxProductsPerRail: number;
  predicate: (product: CatalogProduct) => boolean;
  product: CatalogProduct;
  rails: ProductRecommendationRail[];
  title: string;
  usedSlugs: Set<string>;
}) {
  const selected = input.candidates
    .filter((candidate) => !input.usedSlugs.has(candidate.slug))
    .filter(input.predicate)
    .sort((a, b) => {
      const scoreDiff =
        scoreRecommendation(b, input.product) -
        scoreRecommendation(a, input.product);

      if (scoreDiff !== 0) return scoreDiff;

      return getTimestamp(b.createdAt) - getTimestamp(a.createdAt);
    })
    .slice(0, input.maxProductsPerRail);

  if (selected.length === 0) return;

  for (const product of selected) {
    input.usedSlugs.add(product.slug);
  }

  input.rails.push({
    id: input.id,
    products: selected,
    title: input.title,
  });
}

function scoreRecommendation(
  candidate: CatalogProduct,
  product: CatalogProduct,
) {
  let score = candidate.popularityScore;

  if (candidate.collections.includes(product.collection)) score += 40;
  if (candidate.categorySlug === product.categorySlug) score += 30;
  if (candidate.material === product.material) score += 20;
  if (product.stone && candidate.stone === product.stone) score += 10;
  if (Object.values(candidate.inventory).some((quantity) => quantity > 0)) {
    score += 5;
  }

  return score;
}

function getTimestamp(value: CatalogProduct["createdAt"]) {
  if (value instanceof Date) return value.getTime();

  const timestamp = Date.parse(value);

  return Number.isFinite(timestamp) ? timestamp : 0;
}
