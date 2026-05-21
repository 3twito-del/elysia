import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

describe("mobile commerce density", () => {
  it("keeps the home mobile first viewport editorial before quick search", () => {
    const source = read("src/app/page.tsx");

    expect(source).toContain("[--home-hero-height:clamp(35rem,86svh,44rem)]");
    expect(source).toContain(
      "sm:[--home-hero-height:clamp(40rem,78svh,52rem)]",
    );
    expect(countOccurrences(source, "min-h-[var(--home-hero-height)]")).toBe(4);
    expect(indexOf(source, 'id="categories"')).toBeLessThan(
      indexOf(source, 'id="quick-search"'),
    );
    expect(indexOf(source, 'id="quick-search"')).toBeLessThan(
      indexOf(source, 'id="featured"'),
    );
    expect(source).not.toContain("brand-control-panel grid gap-2 p-1.5");
  });

  it("keeps home hero imagery independent from page scroll", () => {
    const home = read("src/app/page.tsx");
    const css = read("src/styles/globals.css");
    const cinematicHeroSequence = read(
      "src/components/cinematic-hero-sequence.tsx",
    );
    const kineticImageMotion = read("src/components/kinetic-image-motion.tsx");
    const publicMotionProvider = read(
      "src/components/public-motion-provider.tsx",
    );
    const reveal = read("src/components/reveal.tsx");

    expect(home).not.toContain("\n          parallax");
    expect(home).toContain("scrollMotion={false}");
    expect(kineticImageMotion).toContain("scrollDepth: 0");
    expect(kineticImageMotion).toContain(
      "if (!shouldUsePointerMotion && !scrollDepth) return;",
    );
    expect(publicMotionProvider).toContain(
      "const [suppressInitialReveal, setSuppressInitialReveal] = useState(true)",
    );
    expect(reveal).toContain(
      "function useRevealInView<T extends HTMLElement>(initialVisible = true)",
    );
    expect(reveal).toContain("initialVisible = true");
    expect(reveal).toContain(
      "const [ref, isVisible] = useRevealInView<HTMLDivElement>(true)",
    );
    expect(cinematicHeroSequence).toContain("function getInitialSlideStyle");
    expect(cinematicHeroSequence).toContain(
      "transform: `scale(${index === 0 ? 1.018 : 1.045})`",
    );
    expect(css).toContain(
      ".motion-hero-copy .motion-copy-item {\n  animation: none;",
    );
    expect(css).toContain(
      '.public-motion-shell[data-motion-state="enter"]\n  .motion-hero-copy\n  .motion-copy-item',
    );
    expect(css).toContain(".public-motion-content > main");
    expect(css).toContain(
      "min-height: calc(100svh + var(--site-header-height));",
    );
  });

  it("hides catalog hero media and metrics on mobile before filters or search controls", () => {
    const css = read("src/styles/globals.css");
    const hero = read("src/components/commerce-page-hero.tsx");

    expect(css).toMatch(
      /@media \(max-width: 767px\)[\s\S]*commerce-page-hero\[data-commerce-hero="catalog"\] \.commerce-page-hero-inner[\s\S]*min-height: auto;/,
    );
    expect(css).toMatch(
      /commerce-page-hero\[data-commerce-hero="catalog"\] \.commerce-page-hero-aside,[\s\S]*commerce-page-hero\[data-commerce-hero="catalog"\] \.commerce-page-hero-media,[\s\S]*commerce-page-hero\[data-commerce-hero="catalog"\]\s+\.commerce-page-hero-metrics \{[\s\S]*display: none;/,
    );
    expect(hero).toContain(
      "data-commerce-density={density ?? densityByHeroVariant[variant]}",
    );
    expect(hero).toContain(
      "data-route-intent={intent ?? intentByHeroVariant[variant]}",
    );
  });

  it("keeps non-home commerce heroes compact on desktop", () => {
    const css = read("src/styles/globals.css");

    expect(css).toMatch(
      /commerce-page-hero\[data-commerce-hero="catalog"\] \.commerce-page-hero-inner \{[\s\S]*min-height: auto;/,
    );
    expect(css).toContain(
      'commerce-page-hero[data-commerce-hero="catalog"][data-has-aside="true"]',
    );
    expect(css).toContain("minmax(16rem, 28%)");
  });

  it("keeps product and result sections tighter on mobile", () => {
    const home = read("src/app/page.tsx");
    const category = read("src/app/category/[slug]/page.tsx");
    const search = read("src/app/search/page.tsx");
    const productCard = read("src/components/product-card.tsx");

    expect(home).toContain("py-7 sm:px-6 sm:py-10");
    expect(home).toContain("min-h-[220px] w-full");
    expect(category).toContain(
      "px-[var(--ui-page-x)] py-[var(--ui-section-y-tight)]",
    );
    expect(category).toContain(
      "mb-5 hidden border-b border-[var(--glass-border)] pb-4 lg:block",
    );
    expect(category).toContain("grid gap-3 sm:grid-cols-2 sm:gap-4");
    expect(search).toContain(
      "px-[var(--ui-page-x)] py-[var(--ui-section-y-tight)]",
    );
    expect(search).toContain("mt-5 grid gap-3 sm:mt-8");
    expect(productCard).toContain("relative aspect-[5/4] overflow-hidden");
    expect(productCard).toContain("flex min-h-40 flex-1 flex-col");
    expect(productCard).toContain("line-clamp-1 min-h-5");
  });
});

function read(relativePath: string) {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

function indexOf(source: string, pattern: string) {
  const index = source.indexOf(pattern);
  expect(index, pattern).toBeGreaterThanOrEqual(0);
  return index;
}

function countOccurrences(source: string, pattern: string) {
  return source.split(pattern).length - 1;
}
