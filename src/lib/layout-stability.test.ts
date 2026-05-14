import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

describe("layout stability guardrails", () => {
  it("keeps category loading product skeletons aligned with real product-card geometry", () => {
    const productCardSource = readSource("src/components/product-card.tsx");
    const loadingSource = readSource("src/app/category/[slug]/loading.tsx");

    expect(productCardSource).toContain("relative aspect-[4/5] overflow-hidden");
    expect(productCardSource).toContain("flex min-h-52 flex-1 flex-col");
    expect(productCardSource).toContain("grid min-h-16");
    expect(productCardSource).toContain("product-card-cta min-h-11");

    expect(loadingSource).toContain('className="aspect-[4/5] w-full');
    expect(loadingSource).not.toContain("aspect-[5/4]");
    expect(loadingSource).toContain("flex min-h-52 flex-col");
    expect(loadingSource).toContain("grid min-h-16");
    expect(loadingSource).toContain('className="h-11 w-full"');
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
