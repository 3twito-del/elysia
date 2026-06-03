import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("luxury commerce UI hardening", () => {
  it("keeps public header in the split luxury nav structure", () => {
    const source = read("src/components/site-header.tsx");
    const brandBlock = extractBetween(
      source,
      '<Link\n            className="brand-header-mark',
      "</Link>",
    );

    expect(source).toContain('dir="rtl"');
    expect(source).toContain("grid-cols-[1fr_auto_1fr]");
    expect(source).toContain('triggerLabel="תפריט"');
    expect(source).toContain('triggerMode="label"');
    expect(source).toContain('aria-label="חיפוש"');
    expect(source).toContain("<Search");
    expect(source).toContain('aria-label="צרו קשר"');
    expect(source).toContain("<Heart");
    expect(source).toContain("<UserRound");
    expect(source).toContain('href="/account#account-wishlist"');
    expect(source).toContain("[grid-column:3]");
    expect(source).toContain("[grid-column:1]");
    expect(source).toContain("[grid-column:2]");
    expect(source.match(/\[grid-row:1\]/g)).toHaveLength(3);
    expect(source).not.toContain("desktopNavItems");
    expect(source).not.toContain("<nav");
    expect(source).not.toContain("CartCountLink");
    expect(source).not.toContain("Headset");
    expect(source).toContain(
      'import { BrandLogo } from "~/components/brand-logo";',
    );
    expect(brandBlock).toContain('aria-label="Elysia -');
    expect(brandBlock).toContain("<BrandLogo");
    expect(brandBlock).not.toContain("<Gem");
    expect(source).not.toContain("MapPin");
    expect(source).toContain('data-icon-tooltip="מועדפים"');
    expect(source).toContain('data-icon-tooltip="אזור אישי"');
    expect(read("src/styles/globals.css")).toContain(
      "[data-icon-tooltip]::after",
    );
    expect(read("src/styles/globals.css")).toContain(
      ".site-header .site-header-label-action",
    );
  });

  it("keeps mobile navigation and footer disclosures unboxed", () => {
    const mobileNav = read("src/components/mobile-nav.tsx");
    const footer = read("src/components/site-footer.tsx");

    expect(mobileNav).not.toContain("h-auto min-h-14 flex-col");
    expect(mobileNav).not.toContain('variant="outline"');
    expect(mobileNav).toContain("mobile-nav-panel-luxury");
    expect(mobileNav).toContain('data-nav-variant="luxury-editorial"');
    expect(mobileNav).toContain("mobile-nav-quick-list");
    expect(mobileNav).toContain("תכשיטים, מידע, הזמנה ושירות.");
    expect(mobileNav).not.toContain("׳³");
    expect(mobileNav).toContain("after:h-px");
    expect(mobileNav).toContain('href: "/branches"');
    expect(mobileNav).not.toContain("grid-cols-4");
    expect(mobileNav).not.toContain("<Gem");
    expect(read("src/styles/globals.css")).toContain(
      ".mobile-nav-panel-luxury",
    );
    expect(read("src/styles/globals.css")).toContain(
      "clip-path: inset(0 0 0 18%);",
    );
    expect(footer).not.toContain("bg-background rounded-md border");
    expect(footer).toContain(
      "brand-footer-mark hidden items-center sm:inline-flex",
    );
    expect(footer).toContain("site-footer-inner");
    expect(footer).toContain(
      "md:grid-cols-[minmax(18rem,0.95fr)_minmax(0,1.45fr)]",
    );
    expect(footer).toContain("site-footer-nav grid md:grid-cols-3");
    expect(footer).toContain("function FooterNav");
    expect(footer).toContain('title="הקולקציה"');
    expect(footer).toContain('title="שירות והזמנה"');
    expect(footer).toContain('title="מידע"');
    expect(footer).not.toContain("primaryServiceLinks");
    expect(footer).not.toContain("secondaryServiceLinks");
    expect(footer).not.toContain("שירות והזמנה - המשך");
    expect(footer).toContain("const socialLinks = [");
    expect(footer).toContain("https://www.instagram.com/elysia.one/");
    expect(footer).toContain("https://www.tiktok.com/@elysia.one");
    expect(footer).toContain("SiInstagram");
    expect(footer).toContain("SiTiktok");
    expect(footer).toContain("footer-social-link");
    expect(read("src/styles/globals.css")).toContain(".footer-social-link");
    expect(footer).not.toContain("<Share2");
    expect(footer).not.toContain("data-social-icon");
    expect(footer).not.toContain("lg:grid-cols-2 lg:gap-x-5");
  });

  it("keeps category filter choices as list rows instead of boxed buttons", () => {
    const source = read(
      "src/app/category/[slug]/_components/deferred-category-filter-panel.tsx",
    );

    expect(source).not.toContain("buttonVariants");
    expect(source).not.toContain("variant: option.active");
    expect(source).not.toContain("shadow-[inset_0_0_0_1px");
    expect(source).toContain('data-filter-style="fluent-list"');
    expect(source).toContain("grid min-h-10 w-full");
    expect(source).toContain("rounded-md px-2.5 py-2.5");
    expect(source).toContain(
      'option.active && "bg-[var(--secondary)] shadow-none"',
    );
    expect(source).toContain('option.active && "text-foreground"');
    expect(source).not.toContain(
      "border-[var(--glass-border-strong)] bg-transparent shadow-none",
    );
    expect(source).not.toContain("border-[var(--brand-aqua)]");
  });

  it("keeps commerce result summaries as rows instead of empty panels", () => {
    const category = read("src/app/category/[slug]/page.tsx");
    const search = read("src/app/search/page.tsx");
    const gifts = read("src/app/gifts/page.tsx");
    const searchControls = read(
      "src/app/search/_components/search-controls.tsx",
    );

    expect(category).not.toContain(
      "brand-control-panel mb-5 hidden rounded-md",
    );
    expect(search).not.toContain(
      "brand-control-panel mt-4 rounded-md p-[var(--ui-panel-padding)]",
    );
    expect(gifts).not.toContain(
      "brand-control-panel rounded-md p-[var(--ui-panel-padding)]",
    );
    expect(searchControls).not.toContain(
      "brand-control-panel mt-4 hidden gap-2.5",
    );
    expect(category).toContain(
      "mb-5 hidden border-b border-[var(--glass-border)] pb-4 lg:block",
    );
    expect(search).toContain(
      "mt-4 border-b border-[var(--glass-border)] pb-4 sm:mt-6",
    );
    expect(gifts).toContain("border-b border-[var(--glass-border)] pb-4");
  });

  it("keeps non-action labels and cookie consent from returning to aqua pills or top overlays", () => {
    const css = read("src/styles/globals.css");
    const home = read("src/app/page.tsx");
    const commerceHeroBlock = extractCssBlock(css, ".commerce-page-hero");
    const catalogHeroBlock = extractCssBlock(
      css,
      '.commerce-page-hero[data-commerce-hero="catalog"]',
    );
    const heroEyebrowBlock = extractCssBlock(
      css,
      ".commerce-page-hero-eyebrow,\n.commerce-section-header-eyebrow",
    );
    const catalogEyebrowBlock = extractCssBlock(
      css,
      '.commerce-page-hero[data-commerce-hero="catalog"] .commerce-page-hero-eyebrow',
    );
    const cookieBanner = read("src/components/cookie-consent-banner.tsx");

    expect(heroEyebrowBlock).not.toContain("border:");
    expect(heroEyebrowBlock).not.toContain("border-radius");
    expect(heroEyebrowBlock).not.toContain("background:");
    expect(heroEyebrowBlock).not.toContain("brand-aqua-deep");
    expect(catalogEyebrowBlock).not.toContain("background:");
    expect(commerceHeroBlock).toContain("border-bottom: 0;");
    expect(commerceHeroBlock).toContain("background: transparent;");
    expect(catalogHeroBlock).toContain("background: transparent;");
    expect(css).toContain(
      'main > header + [aria-hidden="true"] + [data-testid="cinematic-page-hero"]',
    );
    expect(css).toContain("margin-top: calc(-1 * var(--site-header-height));");
    expect(css).toContain("padding-top: var(--site-header-height);");
    expect(home).not.toContain("bg-[var(--brand-aqua-deep)]");
    expect(home).not.toContain("bg-[var(--brand-aqua)]");
    expect(home).not.toContain("rgba(66,201,190");
    expect(css).toContain("--glass-border: #e2e8ec;");
    expect(css).toContain("--scrollbar-thumb: rgb(91 101 106 / 24%);");
    expect(css).not.toContain("--glass-border: #bfe9e5;");
    expect(css).not.toContain("--scrollbar-thumb: rgb(66 201 190 / 30%);");
    expect(cookieBanner).toContain(
      "bottom-[calc(0.75rem+env(safe-area-inset-bottom))]",
    );
    expect(cookieBanner).not.toContain("bottom-auto");
    expect(cookieBanner).not.toContain(
      "top-[calc(var(--site-header-height)+0.5rem+env(safe-area-inset-top))]",
    );
  });

  it("keeps public secondary controls low-shadow and lightly branded", () => {
    const button = read("src/components/ui/button.tsx");
    const favorite = read("src/components/product-card-favorite-button.tsx");
    const productCard = read("src/components/product-card.tsx");
    const card = read("src/components/ui/card.tsx");

    expect(button).not.toMatch(/(outline|secondary):\s*"[^"]*shadow-\[0_6px/);
    expect(button).not.toMatch(
      /(outline|secondary|ghost):\s*"[^"]*hover:bg-\[rgb\(66_201_190/,
    );
    expect(button).not.toMatch(
      /(outline|secondary|ghost):\s*"[^"]*brand-aqua-soft/,
    );
    expect(favorite).not.toContain("shadow-[0_8px");
    expect(favorite).not.toContain("brand-aqua-soft");
    expect(favorite).toContain('variant="ghost"');
    expect(favorite).toContain('data-icon-tooltip-placement="bottom"');
    expect(favorite).toContain("product-card-favorite-status");
    expect(productCard).toContain("product-card-shell");
    expect(productCard).toContain("border-0");
    expect(productCard).toContain("shadow-none");
    expect(card).toContain("shadow-none");
  });
});

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function extractBetween(source: string, start: string, end: string) {
  const startIndex = source.indexOf(start);
  expect(startIndex).toBeGreaterThanOrEqual(0);

  const endIndex = source.indexOf(end, startIndex);
  expect(endIndex).toBeGreaterThan(startIndex);

  return source.slice(startIndex, endIndex + end.length);
}

function extractCssBlock(source: string, selector: string) {
  const selectorIndex = source.indexOf(selector);
  expect(selectorIndex).toBeGreaterThanOrEqual(0);

  const blockStart = source.indexOf("{", selectorIndex);
  expect(blockStart).toBeGreaterThanOrEqual(0);

  let depth = 0;

  for (let index = blockStart; index < source.length; index += 1) {
    const char = source[index];

    if (char === "{") depth += 1;

    if (char === "}") {
      depth -= 1;

      if (depth === 0) {
        return source.slice(blockStart, index + 1);
      }
    }
  }

  throw new Error(`Could not extract CSS block for ${selector}`);
}
