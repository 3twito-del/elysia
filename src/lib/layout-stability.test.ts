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
    expect(productCardSource).toContain("group/product-link block h-full");
    expect(productCardSource).toContain("absolute top-2.5 right-2.5");
    expect(productCardSource).toContain("product-card-cta");
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
    expect(homeSource).toContain('data-layout-equal-group="home-category-tiles"');
    expect(homeSource).toContain('data-layout-equal-group="home-featured-products"');
    expect(categorySource).toContain('data-layout-equal-group="category-products"');
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
