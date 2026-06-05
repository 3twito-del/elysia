import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

describe("layout stability guardrails", () => {
  it("keeps product cards stable and avoids category route-level loading shells", () => {
    const productCardSource = readSource("src/components/product-card.tsx");
    const categoryLoadingPath = path.join(
      process.cwd(),
      "src/app/category/[slug]/loading.tsx",
    );

    expect(productCardSource).toContain(
      "relative aspect-[5/4] overflow-hidden",
    );
    expect(productCardSource).toContain("sm:aspect-[4/5]");
    expect(productCardSource).toContain("ui-equal-item product-card-shell");
    expect(productCardSource).toContain("flex min-h-28 flex-1 flex-col");
    expect(productCardSource).toContain("sm:min-h-32");
    expect(productCardSource).toContain("ui-text-slot product-card-title");
    expect(productCardSource).toContain('data-lines="2"');
    expect(productCardSource).toContain("ui-text-slot product-card-attributes");
    expect(productCardSource).toContain("group/product-link block min-w-0");
    expect(productCardSource).toContain("absolute top-2.5 right-2.5");
    expect(productCardSource).toContain("product-card-cta");
    expect(productCardSource).toContain("<ProductCardQuickAddButton");
    expect(productCardSource).not.toContain("מחיר גלוי לפני שמירה");
    expect(productCardSource).not.toContain("בדיקת איכות לפני מסירה");

    expect(
      statSync(categoryLoadingPath, { throwIfNoEntry: false }),
    ).toBeUndefined();
  });

  it("keeps shared hover interactions from reflowing layout", () => {
    const cssSource = readSource("src/styles/globals.css");

    expect(cssSource).toContain("transform: translateY(var(--hover-lift));");
    expect(cssSource).toContain("transform: none;");

    expect(extractCssBlock(cssSource, ".interactive-lift:hover")).not.toMatch(
      /\b(?:margin|top|bottom|left|right|width|height)\s*:/,
    );
    expect(
      extractCssBlock(cssSource, ".motion-thumbnail-button:hover"),
    ).not.toMatch(/\b(?:margin|top|bottom|left|right|width|height)\s*:/);
    expect(
      extractCssBlock(cssSource, ".motion-thumbnail-button:hover"),
    ).toContain("transform: none;");
  });

  it("defines equalized text slots for repeated public grids", () => {
    const cssSource = readSource("src/styles/globals.css");
    const homeSource = readSource("src/app/page.tsx");
    const categorySource = readSource("src/app/category/[slug]/page.tsx");

    expect(cssSource).toContain(".ui-text-slot");
    expect(cssSource).toContain("--ui-text-slot-lines: 2");
    expect(cssSource).toContain(".ui-equal-grid");
    expect(cssSource).toContain(".ui-equal-item");
    expect(homeSource).toContain(
      'data-layout-equal-group="prelaunch-mood-principles"',
    );
    expect(homeSource).not.toContain(
      'data-layout-equal-group="home-category-tiles"',
    );
    expect(homeSource).not.toContain(
      'data-layout-equal-group="home-featured-products"',
    );
    expect(categorySource).toContain(
      'data-layout-equal-group="category-products"',
    );
  });

  it("keeps public overlays out of normal flow and matched to their trigger width", () => {
    const cssSource = readSource("src/styles/globals.css");
    const searchControlsSource = readSource(
      "src/app/search/_components/search-controls.tsx",
    );
    const sheetSource = readSource("src/components/ui/sheet.tsx");
    const dialogSource = readSource("src/components/ui/dialog.tsx");
    const cookieBannerSource = readSource(
      "src/components/cookie-consent-banner.tsx",
    );
    const accessibilityWidgetSource = readSource(
      "src/components/accessibility-widget.tsx",
    );
    const selectShellBlock = extractCssBlock(cssSource, ".public-select-shell");
    const selectTriggerBlock = extractCssBlock(
      cssSource,
      ".public-select-trigger {",
    );
    const selectBackdropBlock = extractCssBlock(
      cssSource,
      ".public-select-backdrop",
    );
    const selectContentBlock = extractCssBlock(
      cssSource,
      ".public-select-content {",
    );

    expect(selectShellBlock).toContain("position: relative;");
    expect(selectTriggerBlock).toContain("height: 2.75rem;");
    expect(selectTriggerBlock).toContain("min-height: 2.75rem;");
    expect(selectBackdropBlock).toContain("position: fixed;");
    expect(selectBackdropBlock).toContain("inset: 0;");
    expect(selectContentBlock).toContain("position: absolute;");
    expect(selectContentBlock).toContain("top: calc(100% + 0.375rem);");
    expect(selectContentBlock).toContain("width: 100%;");
    expect(selectContentBlock).toContain("min-width: 100%;");
    expect(selectContentBlock).toContain("max-width: 100%;");

    expect(searchControlsSource).toContain("public-select-shell");
    expect(searchControlsSource).toContain("public-select-trigger");
    expect(searchControlsSource).toContain("public-select-backdrop");
    expect(searchControlsSource).toContain("public-select-content");
    expect(searchControlsSource).toContain('role="listbox"');
    expect(searchControlsSource).toContain("setIsOpen(false)");

    expect(sheetSource).toContain("popup-overlay fixed inset-0");
    expect(sheetSource).toContain("sheet-content popup-surface");
    expect(sheetSource).toContain("fixed z-[90]");
    expect(sheetSource).toContain("right-[calc(100vw-100dvw)]");
    expect(dialogSource).toContain("popup-overlay");
    expect(dialogSource).toContain("fixed top-1/2 left-1/2");

    expect(cookieBannerSource).toContain("fixed inset-x-3");
    expect(cookieBannerSource).toContain("data-public-floating-avoid");
    expect(cookieBannerSource).toContain(
      'root.style.setProperty("--floating-stack-bottom"',
    );
    expect(cookieBannerSource).not.toContain("--public-bottom-safe-offset");

    expect(accessibilityWidgetSource).toContain("public-floating-control");
    expect(accessibilityWidgetSource).toContain(
      "bottom-[calc(max(var(--floating-stack-bottom",
    );
    expect(accessibilityWidgetSource).toContain("fixed inset-0 z-[90]");
  });

  it("keeps floating chrome collision offsets wired to commerce controls", () => {
    const cssSource = readSource("src/styles/globals.css");
    const cookieBannerSource = readSource(
      "src/components/cookie-consent-banner.tsx",
    );
    const accessibilityWidgetSource = readSource(
      "src/components/accessibility-widget.tsx",
    );
    const productCardSource = readSource("src/components/product-card.tsx");
    const productPageSource = readSource("src/app/product/[slug]/page.tsx");

    expect(cookieBannerSource).toContain("data-cookie-consent-banner");
    expect(cookieBannerSource).toContain("data-public-floating-avoid");
    expect(cookieBannerSource).toContain("ResizeObserver");
    expect(accessibilityWidgetSource).toContain("public-floating-trigger");
    expect(accessibilityWidgetSource).toContain(
      'data-accessibility-widget-trigger="true"',
    );
    expect(accessibilityWidgetSource).toContain("shouldRestoreTriggerFocusRef");
    expect(productCardSource).toContain('data-public-floating-avoid="true"');
    expect(productPageSource).toContain('data-public-floating-avoid="true"');
    expect(cssSource).toContain('html[data-cookie-banner-open="true"]');
    expect(cssSource).not.toContain(
      'html[data-cookie-banner-open="true"] .home-hero-copy',
    );
    expect(cssSource).not.toContain(
      'html[data-cookie-banner-open="true"] .public-motion-content',
    );
    expect(cssSource).toContain(
      'html[data-public-overlay-open="true"] .public-floating-control',
    );
    expect(cssSource).toContain('html[data-public-floating-collision="true"]');
    expect(cssSource).toContain(
      '.public-floating-trigger:not([data-accessibility-widget-trigger="true"])',
    );
  });

  it("keeps mixed-script product titles wrapped without changing repeated card height", () => {
    const cssSource = readSource("src/styles/globals.css");
    const productCardSource = readSource("src/components/product-card.tsx");
    const productPageSource = readSource("src/app/product/[slug]/page.tsx");
    const recentlyViewedSource = readSource(
      "src/app/product/[slug]/_components/recently-viewed-products.tsx",
    );
    const mixedTitleBlock = extractCssBlock(
      cssSource,
      ".product-card-title,\n.product-title-mixed-script",
    );

    expect(productCardSource).toContain("ui-text-slot product-card-title");
    expect(productCardSource).toContain('dir="auto"');
    expect(productPageSource).toContain("product-title-mixed-script");
    expect(productPageSource).toContain('data-testid="product-title"');
    expect(productPageSource).toContain(
      "ui-equal-grid mt-5 grid gap-x-7 gap-y-10",
    );
    expect(productPageSource).toContain(
      "data-layout-equal-group={`product-recommendation-${rail.id}`}",
    );
    expect(recentlyViewedSource).toContain(
      "ui-equal-grid mt-5 grid gap-x-7 gap-y-10",
    );
    expect(recentlyViewedSource).toContain(
      'data-layout-equal-group="recently-viewed-products"',
    );
    expect(mixedTitleBlock).toContain("overflow-wrap: anywhere;");
    expect(mixedTitleBlock).toContain("unicode-bidi: plaintext;");
    expect(mixedTitleBlock).toContain("letter-spacing: 0;");
  });

  it("keeps the full cinematic hero reserved for the home route", () => {
    const homeSource = readSource("src/app/page.tsx");
    const publicPageSources = walk(path.join(process.cwd(), "src/app"))
      .filter(
        (file) =>
          file.endsWith("page.tsx") &&
          !file.includes(`${path.sep}src${path.sep}app${path.sep}admin`),
      )
      .map((file) => toPosixPath(path.relative(process.cwd(), file)))
      .filter((sourcePath) => sourcePath !== "src/app/page.tsx")
      .map((sourcePath) => [sourcePath, readSource(sourcePath)] as const);

    expect(homeSource).toContain('data-testid="cinematic-page-hero"');
    expect(readSource("src/components/commerce-page-hero.tsx")).not.toContain(
      '| "home"',
    );

    for (const [sourcePath, source] of publicPageSources) {
      expect(source, sourcePath).not.toContain("CinematicPageHero");
      expect(source, sourcePath).not.toContain(
        'data-testid="cinematic-page-hero"',
      );
      expect(source, sourcePath).not.toMatch(
        /\bvariant\s*=\s*(?:\{["']home["']\}|["']home["'])/,
      );
      expect(source, sourcePath).not.toMatch(
        /\bvariant\s*=\s*(?:\{["']hero["']\}|["']hero["'])/,
      );
    }
  });
});

function readSource(relativePath: string) {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

function toPosixPath(filePath: string) {
  return filePath.split(path.sep).join("/");
}

function extractCssBlock(source: string, selector: string) {
  const selectorIndex = source.indexOf(selector);
  expect(selectorIndex).toBeGreaterThanOrEqual(0);

  const blockStart = source.indexOf("{", selectorIndex);
  const blockEnd = source.indexOf("}", blockStart);

  return source.slice(blockStart, blockEnd + 1);
}

function walk(dir: string): string[] {
  if (!statSync(dir, { throwIfNoEntry: false })?.isDirectory()) return [];

  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(dir, entry.name);

    if (entry.isDirectory()) return walk(entryPath);
    if (entry.isFile()) return [entryPath];

    return [];
  });
}
