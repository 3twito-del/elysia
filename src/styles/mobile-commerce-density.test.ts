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
    expect(css).toContain("clamp(32rem, 78svh, 48rem)");
    expect(css).toMatch(
      /@media \(max-width: 767px\)[\s\S]*\.home-cinematic-hero \{[\s\S]*--home-hero-height: clamp\(28rem, 72svh, 38rem\);/,
    );
    expect(source).toContain('data-testid="home-hero-statement"');
    expect(source).toContain('data-testid="home-hero-primary-cta"');
    expect(source).not.toContain('data-testid="home-hero-secondary-cta"');
    expect(source).not.toContain('data-testid="home-gift-finder"');
    expect(source).toContain("data-hero-copy-direction={homeHeroDirection}");
    expect(source).not.toContain('data-testid="home-commerce-entry-links"');
    expect(source).not.toContain('data-testid="home-hero-campaign-links"');
    expect(source).toContain('href="/search"');
    expect(source).not.toContain("homeGiftFinderGroups");
    expect(source).not.toContain('href: "/category/necklaces"');
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
    expect(source).not.toContain('data-testid="home-material-trust"');
    expect(css).toContain(".boutique-collection-card");
    expect(css).toContain(".boutique-collection-media");
    expect(css).toContain(".boutique-trust-item");
    expect(css).toContain("aspect-ratio: 4 / 5;");
    expect(source).not.toContain('id="waitlist"');
    expect(source).not.toContain("prelaunch-collection-board");
    expect(source).not.toContain('data-testid="home-quick-search-suggestions"');
  });

  it("keeps home hero video static, full-bleed, and independent from page scroll", () => {
    const home = read("src/app/page.tsx");
    const css = read("src/styles/globals.css");
    const publicMotionProvider = read(
      "src/components/public-motion-provider.tsx",
    );
    const reveal = read("src/components/reveal.tsx");

    expect(home).not.toContain("\n          parallax");
    expect(home).not.toContain("scrollMotion=");
    expect(home).not.toContain("CinematicHeroSequence");
    expect(home).toContain(
      'const boutiqueHeroPoster = "/brand/boutique/lifestyle-hero-poster.avif";',
    );
    expect(home).toContain(
      'const boutiqueHeroVideoWebm = "/brand/boutique/lifestyle-hero.webm";',
    );
    expect(home).toContain(
      'const boutiqueHeroVideoMp4 = "/brand/boutique/lifestyle-hero.mp4";',
    );
    expect(home).toContain('as="image"');
    expect(home).toContain('fetchPriority="high"');
    expect(home).toContain("<HomeHeroVideo");
    expect(home).toContain('className="storefront-hero-image object-cover"');
    expect(home).toContain("posterSrc={boutiqueHeroPoster}");
    expect(home).toContain("webmSrc={boutiqueHeroVideoWebm}");
    expect(home).toContain("mp4Src={boutiqueHeroVideoMp4}");
    expect(css).toContain(".storefront-hero-image");
    expect(css).toContain("object-fit: cover;");
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

  it("prevents mobile full-bleed sections from inheriting desktop scrollbar gutters", () => {
    const css = read("src/styles/globals.css");

    expect(css).toMatch(
      /@media \(max-width: 767px\)[\s\S]*html \{[\s\S]*scrollbar-gutter: auto;/,
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
    const css = read("src/styles/globals.css");

    expect(home).toContain('id="collections"');
    expect(home).toContain('id="featured"');
    expect(home).not.toContain('id="materials"');
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
      "mb-5 border-b border-[var(--glass-border)] pb-4",
    );
    expect(category).toContain('data-testid="category-filter-trigger"');
    expect(category).toContain('className="hidden"');
    expect(category).toContain(
      "grid gap-x-7 gap-y-10 sm:grid-cols-2 xl:grid-cols-3",
    );
    expect(search).toContain(
      "px-[var(--ui-page-x)] py-[var(--ui-section-y-tight)]",
    );
    expect(search).toContain("mt-5 grid gap-4 sm:mt-8");
    expect(productCard).toContain("relative aspect-[5/4] overflow-hidden");
    expect(productCard).toContain('density?: "standard" | "compact"');
    expect(productCard).toContain("data-product-card-density=");
    expect(productCard).toContain("product-card-media-compact");
    expect(category).toContain('density="compact"');
    expect(search).toContain('density="compact"');
    expect(productCard).toContain("flex min-h-28 flex-1 flex-col");
    expect(productCard).toContain("sm:min-h-32");
    expect(productCard).toContain('data-testid="product-card-attributes"');
    expect(css).toContain(
      '.product-card-shell[data-product-card-density="compact"]',
    );
    expect(css).toContain("aspect-ratio: 6 / 5;");
  });

  it("keeps PDP purchase, search filters, and footer concise on small screens", () => {
    const gallery = read(
      "src/app/product/[slug]/_components/product-gallery.tsx",
    );
    const productPage = read("src/app/product/[slug]/page.tsx");
    const purchasePanel = read(
      "src/app/product/[slug]/_components/product-purchase-panel.tsx",
    );
    const searchControls = read(
      "src/app/search/_components/search-controls.tsx",
    );
    const searchPage = read("src/app/search/page.tsx");
    const footer = read("src/components/site-footer.tsx");
    const newsletter = read("src/components/newsletter-form.tsx");
    const css = read("src/styles/globals.css");

    expect(gallery).toContain("product-gallery-main-frame");
    expect(css).toContain("min-height: min(76svh, 38rem);");
    expect(css).toContain(".motion-sticky-purchase .product-primary-cta");
    expect(purchasePanel).not.toContain("showStickyBar");
    expect(purchasePanel).toContain(
      "createPortal(stickyPurchaseBar, document.body)",
    );
    expect(productPage).toMatch(
      /className="[^"]*hidden[^"]*sm:block[^"]*"[\s\S]*data-testid="product-media-caption"/,
    );
    expect(productPage).toMatch(
      /className="[^"]*hidden[^"]*sm:grid[^"]*"[\s\S]*data-testid="product-trust-block"/,
    );
    expect(searchControls).toContain('side="right"');
    expect(searchControls).not.toContain('side="bottom"');
    expect(searchPage).toContain("h-11 shrink-0 sm:h-8");
    expect(searchPage).toContain("hidden text-xs sm:block");
    expect(newsletter).toContain("data-newsletter-variant={variant}");
    expect(css).toContain('.newsletter-form[data-newsletter-variant="footer"]');
    expect(footer).toContain("pt-10 pb-[calc(4.75rem");
    expect(footer).toContain("footer-trust-layer mt-16 hidden");
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
