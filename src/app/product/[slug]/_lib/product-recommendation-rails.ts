import type { CatalogProduct } from "~/server/services/catalog";

export type ProductRecommendationRail = {
  cardContextLabel: string;
  continuationHref: string;
  continuationLabel: string;
  id: "collection" | "category" | "material" | "popular";
  products: CatalogProduct[];
  reason: string;
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
    cardContextLabel: "מאותה קולקציה",
    continuationHref: createSearchContinuationHref({
      collection: product.collection,
    }),
    continuationLabel: `המשך בקולקציית ${product.collection}`,
    reason: `תכשיטים מקולקציית ${product.collection}.`,
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
    cardContextLabel: "אותה קטגוריה",
    continuationHref: `/category/${product.categorySlug}`,
    continuationLabel: `המשך בקטגוריית ${product.categoryName}`,
    reason: `עוד תכשיטים מאותה קטגוריה, אם זה הכיוון של הלוק.`,
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
    cardContextLabel: product.stone ? "חומר או אבן דומים" : "חומר דומה",
    continuationHref: createSearchContinuationHref({
      material: product.material,
    }),
    continuationLabel: `חיפוש ${product.material}`,
    reason: product.stone
      ? `התאמה לפי ${product.material} או ${product.stone}.`
      : `התאמה לפי ${product.material}.`,
    title: `עוד תכשיטים ב${product.material}`,
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
      cardContextLabel: "מומלץ עכשיו",
      continuationHref: "/search",
      continuationLabel: "פתיחת כל התכשיטים",
      reason: "פריטים זמינים כשאין התאמה ישירה.",
      title: "עוד רעיונות להתחלה",
      usedSlugs,
    });
  }

  return rails;
}

function addRail(input: {
  cardContextLabel: string;
  candidates: CatalogProduct[];
  continuationHref: string;
  continuationLabel: string;
  id: ProductRecommendationRail["id"];
  maxProductsPerRail: number;
  predicate: (product: CatalogProduct) => boolean;
  product: CatalogProduct;
  reason: string;
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
    cardContextLabel: input.cardContextLabel,
    continuationHref: input.continuationHref,
    continuationLabel: input.continuationLabel,
    id: input.id,
    products: selected,
    reason: input.reason,
    title: input.title,
  });
}

function createSearchContinuationHref(input: {
  collection?: string;
  material?: string;
}) {
  const params = new URLSearchParams();

  if (input.collection) params.set("collection", input.collection);
  if (input.material) params.set("material", input.material);

  const query = params.toString();

  return query ? `/search?${query}` : "/search";
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
