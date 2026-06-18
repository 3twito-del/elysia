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
  "src/app/wishlist/page.tsx",
  "src/app/size-guide/page.tsx",
  "src/app/about/page.tsx",
  "src/app/branches/page.tsx",
  "src/app/faq/page.tsx",
  "src/app/terms/page.tsx",
  "src/app/privacy/page.tsx",
  "src/app/accessibility/page.tsx",
  "src/app/shipping-returns/page.tsx",
  "src/app/warranty/page.tsx",
  "src/app/jewellery-care/page.tsx",
];

const publicNonBrandRouteFiles = publicRouteFiles.filter(
  (file) => file !== "src/app/page.tsx" && file !== "src/app/about/page.tsx",
);

describe("public structure enforcement", () => {
  it("prevents public route hero actions from linking to same-page anchors", () => {
    const violations = publicRouteFiles.flatMap((file) =>
      extractPageIntroBlocks(read(file))
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

    expect(gifts).toContain("<CompactPageIntro");
    expect(gifts).toContain('variant="catalog"');
    expect(gifts).toContain("const GIFT_RESULTS_LIMIT = 24");
    expect(gifts).toContain("sourceProducts.slice(0, GIFT_RESULTS_LIMIT)");
    expect(gifts).toContain('data-testid="gift-results-summary"');
    expect(gifts).toContain('data-testid="gift-results-grid"');
    expect(gifts).not.toContain('id="gift-products"');
    expect(gifts).not.toContain("CommerceSectionHeader");
  });

  it("uses task-first intros outside home and about instead of full commerce heroes", () => {
    const violations = publicNonBrandRouteFiles.filter((file) => {
      const source = read(file);

      return source.includes("<CommercePageHero");
    });

    expect(violations).toEqual([]);
  });

  it("keeps PLP results ahead of supporting controls and editorial content", () => {
    const category = read("src/app/category/[slug]/page.tsx");
    const gifts = read("src/app/gifts/page.tsx");
    const search = read("src/app/search/page.tsx");
    const searchControls = read("src/app/search/_components/search-controls.tsx");

    expect(indexOf(category, 'data-testid="category-results-grid"')).toBeLessThan(
      indexOf(category, 'data-testid="category-trust-strip"'),
    );
    expect(category).toContain('data-testid="category-filter-trigger"');
    expect(category).toContain('className="hidden"');
    expect(category).not.toContain("קו על הצוואר");
    expect(category).not.toContain("משנה חולצה לבנה");
    expect(indexOf(gifts, 'data-testid="gift-results-grid"')).toBeLessThan(
      indexOf(gifts, 'data-testid="gift-discovery-chips"'),
    );
    expect(indexOf(search, 'data-testid="search-results-summary"')).toBeLessThan(
      indexOf(search, 'data-testid="search-controls-panel"'),
    );
    expect(searchControls).toContain('data-testid="search-controls-toggle"');
    expect(searchControls).toContain("<details");
  });

  it("documents the v4 structure policy in code and docs", () => {
    const policy = read("src/lib/public-structure-policy.ts");
    const artifact = read("docs/PUBLIC_CHANGE_GATE.md");

    expect(policy).toContain("PublicRouteArchetype");
    expect(policy).toContain("PublicStructureDecision");
    expect(policy).toContain("PublicStructuralElementKey");
    expect(policy).toContain("anchorCtaPolicy");
    expect(policy).toContain("routeStructurePolicy");
    expect(policy).toContain("taskFirstPublicIntro");
    expect(policy).toContain("benchmarkEvidenceUrl");
    expect(policy).toContain("mandatoryExceptionReason");
    expect(artifact).toContain("PUBLIC_STRUCTURE_BENCHMARK_V4");
    expect(artifact).toContain("DCH-032");
  });
});

function extractPageIntroBlocks(content: string) {
  return [
    ...content.matchAll(/<CommercePageHero\b[\s\S]*?\/>/g),
    ...content.matchAll(/<CompactPageIntro\b[\s\S]*?\/>/g),
  ].map(
    (match) => match[0] ?? "",
  );
}

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function indexOf(content: string, needle: string) {
  const index = content.indexOf(needle);

  expect(index, `${needle} not found`).toBeGreaterThanOrEqual(0);

  return index;
}
