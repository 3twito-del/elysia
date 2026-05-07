import { describe, expect, it } from "vitest";

import {
  createStructuredRecommendationContract,
  getMissingRecommendationInfo,
} from "./recommendation-contract";

describe("structured recommendation contract", () => {
  it("creates a high-confidence catalog-grounded recommendation", () => {
    const recommendation = createStructuredRecommendationContract({
      summary: "Use catalog-backed products only.",
      products: [
        { slug: "venus-ring", matchReason: "style match" },
        { slug: "athena-necklace", matchReason: "budget match" },
      ],
      requestedSignals: {
        budget: 700,
        style: ["delicate"],
        relation: "mom",
        occasion: "birthday",
      },
      maxProducts: 3,
    });

    expect(recommendation).toEqual({
      summary: "Use catalog-backed products only.",
      productSlugs: ["venus-ring", "athena-necklace"],
      confidence: "high",
      missingInfo: [],
    });
  });

  it("deduplicates and caps product slugs from catalog results", () => {
    const recommendation = createStructuredRecommendationContract({
      summary: "Capped products.",
      products: [
        { slug: "venus-ring" },
        { slug: "venus-ring" },
        { slug: "athena-necklace" },
        { slug: "apollo-bracelet" },
      ],
      requestedSignals: {
        budget: 700,
        style: ["gold"],
        relation: "partner",
        occasion: "anniversary",
      },
      maxProducts: 2,
    });

    expect(recommendation.productSlugs).toEqual([
      "venus-ring",
      "athena-necklace",
    ]);
  });

  it("marks partial context as medium confidence when there is one gap", () => {
    const recommendation = createStructuredRecommendationContract({
      summary: "Partial context.",
      products: [{ slug: "venus-ring" }],
      requestedSignals: {
        budget: 700,
        style: [],
        relation: "mom",
        occasion: "birthday",
      },
    });

    expect(recommendation.confidence).toBe("medium");
    expect(recommendation.missingInfo).toEqual(["style"]);
    expect(recommendation.fallbackReason).toBe("partial_request_context");
  });

  it("marks empty catalog results as low confidence", () => {
    const recommendation = createStructuredRecommendationContract({
      summary: "No catalog matches.",
      products: [],
      requestedSignals: {
        budget: 700,
        style: ["delicate"],
        relation: "mom",
        occasion: "birthday",
      },
    });

    expect(recommendation).toEqual({
      summary: "No catalog matches.",
      productSlugs: [],
      confidence: "low",
      missingInfo: [],
      fallbackReason: "no_catalog_matches",
    });
  });

  it("detects missing request signals deterministically", () => {
    expect(
      getMissingRecommendationInfo({
        budget: 0,
        style: [" "],
        relation: "",
        occasion: undefined,
      }),
    ).toEqual(["style", "budget", "occasion", "relation"]);
  });
});
