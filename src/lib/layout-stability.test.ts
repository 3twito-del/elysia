import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

describe("layout stability guardrails", () => {
  it("keeps product cards and category loading placeholders on stable dimensions", () => {
    const productCardSource = readSource("src/components/product-card.tsx");
    const loadingSource = readSource("src/app/category/[slug]/loading.tsx");

    expect(productCardSource).toContain(
      "relative aspect-[10/11] overflow-hidden",
    );
    expect(productCardSource).toContain("sm:aspect-[4/5]");
    expect(productCardSource).toContain("flex min-h-52 flex-1 flex-col");
    expect(productCardSource).toContain("grid min-h-16");
    expect(productCardSource).toContain("product-card-cta min-h-11");

    expect(loadingSource).toContain("const previewRows = 3");
    expect(loadingSource).toContain("grid gap-3 sm:grid-cols-2 lg:grid-cols-3");
    expect(loadingSource).toContain("h-4 w-3/4");
    expect(loadingSource).toContain("h-7 w-20");
  });

  it("keeps shared lift interactions transform-only so hover and focus do not reflow layout", () => {
    const cssSource = readSource("src/styles/globals.css");

    expect(cssSource).toContain("transform: translateY(var(--hover-lift));");
    expect(cssSource).toContain("transform: translateY(-1px);");

    expect(extractCssBlock(cssSource, ".interactive-lift:hover")).not.toMatch(
      /\b(?:margin|top|bottom|left|right|width|height)\s*:/,
    );
    expect(
      extractCssBlock(cssSource, ".motion-thumbnail-button:hover"),
    ).not.toMatch(/\b(?:margin|top|bottom|left|right|width|height)\s*:/);
  });

  it("keeps the full cinematic hero reserved for the home route", () => {
    const homeSource = readSource("src/app/page.tsx");
    const compactRouteSources = [
      "src/app/about/page.tsx",
      "src/app/ai/page.tsx",
      "src/app/category/[slug]/page.tsx",
      "src/app/gifts/page.tsx",
      "src/app/stylist/page.tsx",
    ].map((sourcePath) => [sourcePath, readSource(sourcePath)] as const);

    expect(homeSource).toContain('data-testid="cinematic-page-hero"');

    for (const [sourcePath, source] of compactRouteSources) {
      expect(source, sourcePath).toContain("CompactPageIntro");
      expect(source, sourcePath).not.toContain("CinematicPageHero");
      expect(source, sourcePath).not.toContain(
        'data-testid="cinematic-page-hero"',
      );
    }
  });
});

function readSource(relativePath: string) {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

function extractCssBlock(source: string, selector: string) {
  const selectorIndex = source.indexOf(selector);
  expect(selectorIndex).toBeGreaterThanOrEqual(0);

  const blockStart = source.indexOf("{", selectorIndex);
  const blockEnd = source.indexOf("}", blockStart);

  return source.slice(blockStart, blockEnd + 1);
}
