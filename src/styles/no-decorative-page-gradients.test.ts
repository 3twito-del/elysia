import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const css = readFileSync(path.join(root, "src/styles/globals.css"), "utf8");

const decorativeGradientPattern =
  /\b(?:linear-gradient|radial-gradient|repeating-linear-gradient|mask-image)\b/i;

const pageSurfaceSelectors = [
  ".brand-page-band",
  ".commerce-page-hero",
  '.commerce-page-hero[data-commerce-hero="catalog"]',
] as const;

const removedDecorativeSelectors = [
  ".brand-page-band::before",
  ".commerce-page-hero::after",
  '.commerce-page-hero[data-commerce-hero="catalog"]::before',
  '.commerce-page-hero[data-commerce-hero="catalog"]::after',
] as const;

describe("decorative page gradient guardrails", () => {
  it("keeps shared public page bands on solid surfaces", () => {
    const violations = pageSurfaceSelectors
      .map((selector) => [selector, extractCssBlock(css, selector)] as const)
      .filter(([, block]) => decorativeGradientPattern.test(block))
      .map(([selector]) => selector);

    expect(violations).toEqual([]);
  });

  it("does not reintroduce page-level decorative pseudo layers", () => {
    const violations = removedDecorativeSelectors.filter((selector) =>
      css.includes(selector),
    );

    expect(violations).toEqual([]);
  });
});

function extractCssBlock(source: string, selector: string) {
  const selectorIndex = source.indexOf(selector);
  expect(selectorIndex).toBeGreaterThanOrEqual(0);

  const blockStart = source.indexOf("{", selectorIndex);
  expect(blockStart).toBeGreaterThanOrEqual(0);

  let depth = 0;

  for (let index = blockStart; index < source.length; index += 1) {
    const char = source[index];

    if (char === "{") {
      depth += 1;
    }

    if (char === "}") {
      depth -= 1;

      if (depth === 0) {
        return source.slice(blockStart, index + 1);
      }
    }
  }

  throw new Error(`Could not extract CSS block for ${selector}`);
}
