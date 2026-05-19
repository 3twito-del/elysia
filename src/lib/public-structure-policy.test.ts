import { describe, expect, it } from "vitest";

import {
  PUBLIC_STRUCTURE_BENCHMARK_TOTAL_WEIGHT,
  PUBLIC_STRUCTURE_KEEP_THRESHOLD,
  PUBLIC_STRUCTURE_BENCHMARK_V4,
  anchorCtaPolicy,
  publicStructureBenchmarkCorpus,
  publicStructurePolicy,
  routeStructurePolicy,
  shouldRenderStructuralElement,
} from "./public-structure-policy";

describe("public structure benchmark v4 policy", () => {
  it("locks the benchmark artifact, corpus, and threshold", () => {
    expect(PUBLIC_STRUCTURE_BENCHMARK_V4).toBe(
      "PUBLIC_STRUCTURE_BENCHMARK_V4",
    );
    expect(publicStructureBenchmarkCorpus).toHaveLength(30);
    expect(
      publicStructureBenchmarkCorpus.reduce(
        (total, site) => total + site.weight,
        0,
      ),
    ).toBe(PUBLIC_STRUCTURE_BENCHMARK_TOTAL_WEIGHT);
    expect(PUBLIC_STRUCTURE_KEEP_THRESHOLD).toBe(18.75);
  });

  it("removes adjacent same-page hero anchor CTAs", () => {
    expect(publicStructurePolicy.adjacentSamePageHeroCta.status).toBe(
      "remove",
    );
    expect(anchorCtaPolicy.samePageHeroAnchor.status).toBe("remove");
    expect(anchorCtaPolicy.adjacentSectionJump.status).toBe("remove");
    expect(shouldRenderStructuralElement("adjacentSamePageHeroCta")).toBe(
      false,
    );
  });

  it("keeps PLP, gifts, PDP, checkout, and legal archetypes explicit", () => {
    expect(routeStructurePolicy["/gifts"].archetype).toBe("plp");
    expect(routeStructurePolicy["/category/[slug]"].archetype).toBe("plp");
    expect(routeStructurePolicy["/search"].archetype).toBe("plp");
    expect(routeStructurePolicy["/product/[slug]"].archetype).toBe("pdp");
    expect(routeStructurePolicy["/checkout"].archetype).toBe("checkout");
    expect(routeStructurePolicy["/terms"].archetype).toBe("legal");
    expect(routeStructurePolicy["/privacy"].archetype).toBe("legal");
    expect(routeStructurePolicy["/accessibility"].archetype).toBe("legal");
  });

  it("keeps mandatory floating chrome exceptions explicit", () => {
    expect(publicStructurePolicy.floatingChromeNoCommerceOverlap.status).toBe(
      "mandatory",
    );
    expect(
      publicStructurePolicy.floatingChromeNoCommerceOverlap
        .mandatoryExceptionReason,
    ).toBe("accessibility");
  });
});
