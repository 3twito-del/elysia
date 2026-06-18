import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("homepage boutique commerce bridge", () => {
  it("keeps the homepage brand-led while opening real store entry points", () => {
    const home = read("src/app/page.tsx");

    expect(home).toContain(
      'const boutiqueHeroImage = "/brand/boutique/lifestyle-hero.avif";',
    );
    expect(home).toContain(
      'const boutiqueHeroPoster = "/brand/boutique/lifestyle-hero-poster.avif";',
    );
    expect(home).toContain(
      'const boutiqueHeroVideoWebm = "/brand/boutique/lifestyle-hero.webm";',
    );
    expect(home).toContain(
      'const boutiqueHeroVideoMp4 = "/brand/boutique/lifestyle-hero.mp4";',
    );
    expect(home).toContain("getCatalogCategories");
    expect(home).toContain("getFeaturedCatalogProducts(4)");
    expect(home).toContain("<ProductCard");
    expect(home).toContain("function HomeCategoryCard");
    expect(home).toContain('data-testid="storefront-homepage"');
    expect(home).toContain('data-testid="home-hero-statement"');
    expect(home).toContain('data-testid="home-hero-primary-cta"');
    expect(home).toContain('href="/search"');
    expect(home).toContain('id="collections"');
    expect(home).toContain('id="featured"');
    expect(home).toContain('title="Icons of Summer"');
    expect(home).not.toContain('title="חדש בעונה."');
    expect(home).toContain('id="materials"');
    expect(home).toContain('id="about-elysia"');
    expect(home).toContain('id="first-collection"');
    expect(home).toContain('id="collection-updates"');
    expect(home).toContain('data-layout-equal-group="home-category-tiles"');
    expect(home).toContain('data-testid="home-featured-products"');
    expect(home).toContain('data-testid="home-material-trust"');
    expect(home).toContain("home-materials-section");
    expect(home).toContain("<NewsletterForm />");

    expect(home).not.toContain('href="#waitlist"');
    expect(home).not.toContain("First collection coming soon");
    expect(home).not.toContain('data-testid="prelaunch-homepage"');
    expect(home).not.toContain('id="waitlist"');
    expect(home).not.toContain('href="/category/rings"');
    expect(home).not.toContain('data-testid="home-hero-secondary-line"');
    expect(home).not.toContain('data-testid="home-hero-trust-notes"');
    expect(home).not.toContain("home-hero-help-cta");

    expect(indexOf(home, 'id="page-hero"')).toBeLessThan(
      indexOf(home, 'id="collections"'),
    );
    expect(indexOf(home, 'id="collections"')).toBeLessThan(
      indexOf(home, 'id="featured"'),
    );
    expect(indexOf(home, 'id="featured"')).toBeLessThan(
      indexOf(home, 'id="materials"'),
    );
    expect(indexOf(home, 'id="materials"')).toBeLessThan(
      indexOf(home, 'id="about-elysia"'),
    );
    expect(indexOf(home, 'id="about-elysia"')).toBeLessThan(
      indexOf(home, 'id="first-collection"'),
    );
    expect(indexOf(home, 'id="first-collection"')).toBeLessThan(
      indexOf(home, 'id="collection-updates"'),
    );
  });

  it("keeps the materials section aligned with a single-line title", () => {
    const css = read("src/styles/globals.css");

    expect(css).toContain(".home-materials-section .commerce-section-header");
    expect(css).toContain(
      ".home-materials-section .commerce-section-header-title",
    );
    expect(css).toContain("text-wrap: nowrap;");
    expect(css).toContain("white-space: nowrap;");
    expect(css).toContain(".home-materials-section .boutique-trust-item");
    expect(css).toContain("justify-items: start;");
    expect(css).toContain("text-align: start;");
  });

  it("animates the category arrow color inversion on hover and focus", () => {
    const css = read("src/styles/globals.css");

    expect(css).toContain(".boutique-collection-action::before");
    expect(css).toContain(
      ".boutique-collection-card:hover .boutique-collection-action",
    );
    expect(css).toContain(
      ".boutique-collection-card:focus-visible .boutique-collection-action",
    );
    expect(css).toContain("background: #fffaf4;");
    expect(css).toContain("color: var(--foreground);");
    expect(css).toContain("transform: scale(1);");
  });

  it("keeps the home header on the regular public navigation", () => {
    const header = read("src/components/site-header.tsx");
    const mobileNav = read("src/components/mobile-nav.tsx");

    expect(header).not.toContain("const prelaunchNavItems = [");
    expect(header).not.toContain('aria-label="Pre-launch navigation"');
    expect(header).not.toContain("prelaunchNavItems.map");
    expect(header).not.toContain("data-home-prelaunch");
    expect(header).toContain("<MobileNav");
    expect(header).toContain('href="/search"');
    expect(header).toContain("/search?sort=newest");
    expect(header).toContain('href="/service"');
    expect(header).toContain('href="/wishlist"');
    expect(header).toContain("<CartCountLink");
    expect(mobileNav).toContain('item.href.startsWith("/category/")');
    expect(indexOf(header, "<MobileNav")).toBeLessThan(
      indexOf(header, 'href="/search"'),
    );
  });
});

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function indexOf(source: string, pattern: string) {
  const index = source.indexOf(pattern);
  expect(index, pattern).toBeGreaterThanOrEqual(0);
  return index;
}
