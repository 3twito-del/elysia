import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

describe("mobile commerce density", () => {
  it("keeps the home mobile first viewport brand-led while routing into commerce", () => {
    const source = read("src/app/page.tsx");
    const css = read("src/styles/globals.css");

    expect(source).toContain("home-cinematic-hero");
    expect(source).toContain("storefront-hero");
    expect(css).toContain(".home-cinematic-hero");
    expect(css).toContain(".storefront-hero");
    expect(css).toContain("clamp(34rem, 84svh, 50rem)");
    expect(source).toContain('data-testid="home-hero-statement"');
    expect(source).toContain('data-testid="home-hero-primary-cta"');
    expect(source).toContain('href="/search"');
    expect(countOccurrences(source, "min-h-[var(--home-hero-height)]")).toBe(1);
    expect(indexOf(source, 'id="page-hero"')).toBeLessThan(
      indexOf(source, 'id="collections"'),
    );
    expect(indexOf(source, 'id="collections"')).toBeLessThan(
      indexOf(source, 'id="featured"'),
    );
    expect(source).toContain('data-layout-equal-group="home-category-tiles"');
    expect(source).toContain('data-testid="home-featured-products"');
    expect(source).toContain("<ProductCard");
    expect(source).not.toContain('href="#waitlist"');
    expect(source).not.toContain('data-testid="home-hero-secondary-line"');
    expect(source).not.toContain('href="/category/rings"');
    expect(source).not.toContain('data-testid="home-hero-trust-notes"');
    expect(source).not.toContain("brand-control-panel grid gap-2 p-1.5");
  });

  it("keeps home collection tiles and product previews curated rather than dense", () => {
    const source = read("src/app/page.tsx");
    const css = read("src/styles/globals.css");

    expect(source).toContain("function HomeCategoryCard");
    expect(source).toContain("boutique-collection-card");
    expect(source).toContain("boutique-collection-media");
    expect(source).toContain("boutique-featured-band");
    expect(source).toContain("ui-equal-grid grid gap-x-7 gap-y-10");
    expect(source).toContain('data-testid="home-category-card"');
    expect(source).toContain('data-testid="home-material-trust"');
    expect(css).toContain(".boutique-collection-card");
    expect(css).toContain(".boutique-collection-media");
    expect(css).toContain(".boutique-trust-item");
    expect(css).toContain("aspect-ratio: 4 / 5;");
    expect(source).not.toContain('id="waitlist"');
    expect(source).not.toContain("prelaunch-collection-board");
    expect(source).not.toContain('data-testid="home-quick-search-suggestions"');
  });

  it("keeps home hero imagery static, full-bleed, and independent from page scroll", () => {
    const home = read("src/app/page.tsx");
    const css = read("src/styles/globals.css");
    const publicMotionProvider = read(
      "src/components/public-motion-provider.tsx",
    );
    const reveal = read("src/components/reveal.tsx");

    expect(home).not.toContain("\n          parallax");
    expect(home).not.toContain("scrollMotion=");
    expect(home).not.toContain("CinematicHeroSequence");
    expect(home).toContain('className="storefront-hero-image object-cover"');
    expect(home).toContain('sizes="100vw"');
    expect(home).toContain("src={boutiqueHeroImage}");
    expect(css).toContain(".storefront-hero-image");
    expect(css).toContain(".storefront-hero-scrim");
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

    expect(home).toContain('id="collections"');
    expect(home).toContain('id="featured"');
    expect(home).toContain('id="materials"');
    expect(home).toContain('id="collection-updates"');
    expect(home).toContain("<NewsletterForm />");
    expect(home).toContain('data-layout-equal-group="home-category-tiles"');
    expect(home).toContain('data-layout-equal-group="home-featured-products"');
    expect(home).not.toContain("brand-surface interactive-lift group/card");
    expect(home).not.toContain("group-hover/card:underline");
    expect(category).toContain(
      "px-[var(--ui-page-x)] py-[var(--ui-section-y-tight)]",
    );
    expect(category).toContain(
      "mb-5 hidden border-b border-[var(--glass-border)] pb-4 lg:block",
    );
    expect(category).toContain(
      "grid gap-x-7 gap-y-10 sm:grid-cols-2 xl:grid-cols-3",
    );
    expect(search).toContain(
      "px-[var(--ui-page-x)] py-[var(--ui-section-y-tight)]",
    );
    expect(search).toContain("mt-5 grid gap-4 sm:mt-8");
    expect(productCard).toContain("relative aspect-[5/4] overflow-hidden");
    expect(productCard).toContain("flex min-h-28 flex-1 flex-col");
    expect(productCard).toContain("sm:min-h-32");
    expect(productCard).toContain('data-testid="product-card-attributes"');
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
