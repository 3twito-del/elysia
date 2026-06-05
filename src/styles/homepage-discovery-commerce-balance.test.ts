import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("homepage pre-launch brand world", () => {
  it("keeps the homepage as a brand-building environment before commerce", () => {
    const home = read("src/app/page.tsx");

    expect(home).toContain(
      'const boutiqueHeroImage = "/brand/boutique/lifestyle-hero.avif";',
    );
    expect(home).toContain("const moodPrinciples = [");
    expect(home).toContain("const collectionSignals = [");
    expect(home).toContain("const curationCriteria = [");
    expect(home).toContain('data-testid="prelaunch-homepage"');
    expect(home).toContain('data-testid="home-hero-statement"');
    expect(home).toContain('data-testid="home-hero-primary-cta"');
    expect(home).toContain('href="#waitlist"');
    expect(home).toContain("הצטרפות לקולקציה הראשונה");
    expect(home).toContain("First collection coming soon");
    expect(home).toContain("האווירה של Elysia");
    expect(home).toContain("אור, פרט, אינטימיות.");
    expect(home).toContain('id="mood"');
    expect(home).toContain('id="first-collection"');
    expect(home).toContain('id="materials"');
    expect(home).toContain('id="journal"');
    expect(home).toContain('id="waitlist"');
    expect(home).toContain('id="about-elysia"');
    expect(home).toContain("<NewsletterForm />");

    expect(home).not.toContain("getCatalogCategories");
    expect(home).not.toContain("getFeaturedCatalogProducts");
    expect(home).not.toContain("<ProductCard");
    expect(home).not.toContain("function CollectionCard");
    expect(home).not.toContain('id="collections"');
    expect(home).not.toContain('id="featured"');
    expect(home).not.toContain('data-layout-equal-group="home-category-tiles"');
    expect(home).not.toContain('data-testid="home-service-strip"');
    expect(home).not.toContain('href="/search"');
    expect(home).not.toContain('href="/gifts"');
    expect(home).not.toContain('data-testid="home-hero-trust-notes"');
    expect(home).not.toContain("home-hero-help-cta");

    expect(indexOf(home, 'id="page-hero"')).toBeLessThan(
      indexOf(home, 'id="mood"'),
    );
    expect(indexOf(home, 'id="mood"')).toBeLessThan(
      indexOf(home, 'id="first-collection"'),
    );
    expect(indexOf(home, 'id="first-collection"')).toBeLessThan(
      indexOf(home, 'id="materials"'),
    );
    expect(indexOf(home, 'id="materials"')).toBeLessThan(
      indexOf(home, 'id="journal"'),
    );
    expect(indexOf(home, 'id="journal"')).toBeLessThan(
      indexOf(home, 'id="waitlist"'),
    );
    expect(indexOf(home, 'id="waitlist"')).toBeLessThan(
      indexOf(home, 'id="about-elysia"'),
    );
  });

  it("keeps the home header on the regular public navigation", () => {
    const header = read("src/components/site-header.tsx");

    expect(header).not.toContain("const prelaunchNavItems = [");
    expect(header).not.toContain('aria-label="Pre-launch navigation"');
    expect(header).not.toContain("prelaunchNavItems.map");
    expect(header).not.toContain("data-home-prelaunch");
    expect(header).toContain("<MobileNav");
    expect(header).toContain('href="/search"');
    expect(header).toContain('href="/service"');
    expect(header).toContain('href="/account#account-wishlist"');
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
