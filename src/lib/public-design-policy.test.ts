import { describe, expect, it } from "vitest";

import {
  PUBLIC_BENCHMARK_KEEP_THRESHOLD,
  PUBLIC_BENCHMARK_TOTAL_WEIGHT,
  publicBenchmarkCorpus,
  publicElementPolicy,
  shouldRenderPublicElement,
} from "./public-design-policy";

describe("public benchmark design policy", () => {
  it("locks the selected 30-site luxury weighted corpus", () => {
    expect(publicBenchmarkCorpus).toHaveLength(30);
    expect(
      publicBenchmarkCorpus.reduce((total, site) => total + site.weight, 0),
    ).toBe(PUBLIC_BENCHMARK_TOTAL_WEIGHT);
    expect(PUBLIC_BENCHMARK_KEEP_THRESHOLD).toBe(18.75);
    expect(
      publicBenchmarkCorpus.slice(0, 15).every((site) => site.weight === 1.5),
    ).toBe(true);
    expect(
      publicBenchmarkCorpus.slice(15).every((site) => site.weight === 1),
    ).toBe(true);
  });

  it("removes benchmark-failing public commerce elements", () => {
    expect(publicElementPolicy.heroMetrics.status).toBe("remove");
    expect(publicElementPolicy.routeHeroMedia.status).toBe("remove");
    expect(publicElementPolicy.exactInventoryQuantity.status).toBe("remove");
    expect(publicElementPolicy.filterOptionCounts.status).toBe("remove");
    expect(publicElementPolicy.collectionBadgePill.status).toBe("remove");
    expect(publicElementPolicy.aiStylistPrimary.status).toBe("remove");

    expect(shouldRenderPublicElement("heroMetrics")).toBe(false);
    expect(shouldRenderPublicElement("routeHeroMedia")).toBe(false);
    expect(shouldRenderPublicElement("exactInventoryQuantity")).toBe(false);
  });

  it("keeps mandatory exceptions explicit", () => {
    expect(publicElementPolicy.cookieAccessibilityChrome.status).toBe(
      "mandatory",
    );
    expect(publicElementPolicy.cookieAccessibilityChrome.exception).toBe(
      "accessibility",
    );
    expect(shouldRenderPublicElement("cookieAccessibilityChrome")).toBe(true);
  });
});
