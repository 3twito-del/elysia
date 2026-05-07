import { z } from "zod";

export const AI_RECOMMENDATION_MISSING_INFO = [
  "style",
  "budget",
  "occasion",
  "relation",
] as const;

export const aiRecommendationConfidenceSchema = z.enum([
  "high",
  "medium",
  "low",
]);

export const aiStructuredRecommendationSchema = z.object({
  summary: z.string(),
  productSlugs: z.array(z.string().min(1)),
  confidence: aiRecommendationConfidenceSchema,
  missingInfo: z.array(z.enum(AI_RECOMMENDATION_MISSING_INFO)),
  fallbackReason: z
    .enum(["no_catalog_matches", "partial_request_context"])
    .optional(),
});

export type AiRecommendationConfidence = z.infer<
  typeof aiRecommendationConfidenceSchema
>;
export type AiStructuredRecommendation = z.infer<
  typeof aiStructuredRecommendationSchema
>;
export type AiRecommendationMissingInfo =
  (typeof AI_RECOMMENDATION_MISSING_INFO)[number];

export type AiStructuredRecommendationProduct = {
  slug: string;
  matchReason?: string;
  availableBranchCount?: number;
  price?: number;
};

export type AiRecommendationSignals = {
  budget?: number;
  style?: readonly string[];
  relation?: string;
  occasion?: string;
};

export function createStructuredRecommendationContract(input: {
  summary: string;
  products: readonly AiStructuredRecommendationProduct[];
  requestedSignals: AiRecommendationSignals;
  maxProducts?: number;
}): AiStructuredRecommendation {
  const productSlugs = uniqueProductSlugs(input.products).slice(
    0,
    normalizeMaxProducts(input.maxProducts),
  );
  const missingInfo = getMissingRecommendationInfo(input.requestedSignals);
  const confidence = resolveRecommendationConfidence({
    productCount: productSlugs.length,
    missingInfoCount: missingInfo.length,
  });
  const fallbackReason = resolveFallbackReason({
    productCount: productSlugs.length,
    missingInfoCount: missingInfo.length,
  });

  return aiStructuredRecommendationSchema.parse({
    summary: input.summary,
    productSlugs,
    confidence,
    missingInfo,
    ...(fallbackReason ? { fallbackReason } : {}),
  });
}

export function getMissingRecommendationInfo(
  signals: AiRecommendationSignals,
): AiRecommendationMissingInfo[] {
  const missingInfo: AiRecommendationMissingInfo[] = [];

  if (!hasNonEmptyValues(signals.style)) {
    missingInfo.push("style");
  }

  if (!isPositiveFiniteNumber(signals.budget)) {
    missingInfo.push("budget");
  }

  if (!hasNonEmptyText(signals.occasion)) {
    missingInfo.push("occasion");
  }

  if (!hasNonEmptyText(signals.relation)) {
    missingInfo.push("relation");
  }

  return missingInfo;
}

function uniqueProductSlugs(
  products: readonly AiStructuredRecommendationProduct[],
) {
  return Array.from(
    new Set(
      products
        .map((product) => product.slug.trim())
        .filter((slug) => slug.length > 0),
    ),
  );
}

function normalizeMaxProducts(maxProducts = 4) {
  if (!Number.isFinite(maxProducts)) return 4;

  return Math.max(0, Math.floor(maxProducts));
}

function resolveRecommendationConfidence(input: {
  productCount: number;
  missingInfoCount: number;
}): AiRecommendationConfidence {
  if (input.productCount >= 2 && input.missingInfoCount === 0) return "high";
  if (input.productCount >= 1 && input.missingInfoCount <= 1) return "medium";

  return "low";
}

function resolveFallbackReason(input: {
  productCount: number;
  missingInfoCount: number;
}): AiStructuredRecommendation["fallbackReason"] {
  if (input.productCount === 0) return "no_catalog_matches";
  if (input.missingInfoCount > 0) return "partial_request_context";

  return undefined;
}

function hasNonEmptyValues(values: readonly string[] | undefined) {
  return Boolean(values?.some((value) => hasNonEmptyText(value)));
}

function hasNonEmptyText(value: string | undefined) {
  return Boolean(value?.trim());
}

function isPositiveFiniteNumber(value: number | undefined) {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}
