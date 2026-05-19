import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

const publicRouteFiles = [
  "src/app/page.tsx",
  "src/app/gifts/page.tsx",
  "src/app/category/[slug]/page.tsx",
  "src/app/search/page.tsx",
  "src/app/product/[slug]/page.tsx",
  "src/app/checkout/page.tsx",
  "src/app/service/page.tsx",
  "src/app/account/page.tsx",
  "src/app/account/orders/[id]/page.tsx",
  "src/app/ai/page.tsx",
  "src/app/stylist/page.tsx",
  "src/app/about/page.tsx",
  "src/app/branches/page.tsx",
  "src/app/faq/page.tsx",
  "src/app/terms/page.tsx",
  "src/app/privacy/page.tsx",
  "src/app/accessibility/page.tsx",
];

describe("public structure enforcement", () => {
  it("prevents public route hero actions from linking to same-page anchors", () => {
    const violations = publicRouteFiles.flatMap((file) =>
      extractCommercePageHeroBlocks(read(file))
        .filter((block) => /href=(?:"|{")#/.test(block))
        .map(() => file),
    );

    expect(violations).toEqual([]);
  });

  it("removes known adjacent scroll CTA targets from public pages", () => {
    const disallowed = [
      'href="#gift-products"',
      'href="#category-products"',
      'href="#category-filters"',
      'href="#search-controls"',
      'href="#search-results-section"',
      'href="#checkout-form"',
      'href="#service-form"',
      'href="#faq-groups"',
      'href="#terms-section-1"',
      'href="#privacy-section-1"',
      'href="#accessibility-standard"',
      'href="#ai-stylist"',
      'href="#stylist-chat"',
      'href="#branches-list"',
    ];
    const violations = publicRouteFiles.flatMap((file) => {
      const content = read(file);

      return disallowed
        .filter((needle) => content.includes(needle))
        .map((needle) => `${file}: ${needle}`);
    });

    expect(violations).toEqual([]);
  });

  it("keeps gifts as a product-listing route, not a scroll-gated landing page", () => {
    const gifts = read("src/app/gifts/page.tsx");

    expect(gifts).toContain('variant="catalog"');
    expect(gifts).toContain('data-testid="gift-results-summary"');
    expect(gifts).toContain('data-testid="gift-results-grid"');
    expect(gifts).not.toContain('id="gift-products"');
    expect(gifts).not.toContain("CommerceSectionHeader");
  });

  it("documents the v4 structure policy in code and docs", () => {
    const policy = read("src/lib/public-structure-policy.ts");
    const artifact = read("docs/PUBLIC_STRUCTURE_BENCHMARK_V4.md");
    const dch = read("docs/DESIGN_CHANGE_DECISIONS.md");

    expect(policy).toContain("PublicRouteArchetype");
    expect(policy).toContain("PublicStructureDecision");
    expect(policy).toContain("PublicStructuralElementKey");
    expect(policy).toContain("anchorCtaPolicy");
    expect(policy).toContain("routeStructurePolicy");
    expect(policy).toContain("benchmarkEvidenceUrl");
    expect(policy).toContain("mandatoryExceptionReason");
    expect(artifact).toContain("PUBLIC_STRUCTURE_BENCHMARK_V4");
    expect(dch).toContain("DCH-032");
  });
});

function extractCommercePageHeroBlocks(content: string) {
  return [...content.matchAll(/<CommercePageHero\b[\s\S]*?\/>/g)].map(
    (match) => match[0] ?? "",
  );
}

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}
