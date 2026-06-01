import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const publicSourceRoots = ["src/app", "src/components"].map((dir) =>
  path.join(root, dir),
);

describe("nested card surface guardrails", () => {
  it("keeps public Card components from nesting inside other Card components", () => {
    const violations = publicSourceRoots
      .flatMap(walk)
      .filter(isPublicTsxSource)
      .flatMap((file) => {
        const source = readFileSync(file, "utf8");
        const relativePath = toPosixPath(path.relative(root, file));
        const nestedLines = findNestedCardLines(source);

        return nestedLines.map((line) => `${relativePath}:${line}`);
      });

    expect(violations).toEqual([]);
  });

  it("keeps shared page bands from becoming section cards", () => {
    const css = read("src/styles/globals.css");
    const brandPageBandBlock = extractCssBlock(css, ".brand-page-band");
    const brandAquaSectionBlock = extractCssBlock(css, ".brand-aqua-section");

    expect(brandPageBandBlock).not.toMatch(/\bborder(?:-radius|-color)?:/);
    expect(brandPageBandBlock).not.toMatch(/\bbox-shadow\s*:/);
    expect(brandAquaSectionBlock).toMatch(/background:\s*var\(--background\)/);
    expect(brandAquaSectionBlock).not.toMatch(/\bborder(?:-radius|-color)?:/);
    expect(brandAquaSectionBlock).not.toMatch(/\bbox-shadow\s*:/);
  });

  it("keeps current product, checkout, account, and service surfaces covered", () => {
    const coveredPublicSurfaces = [
      "src/components/product-card.tsx",
      "src/app/product/[slug]/page.tsx",
      "src/app/checkout/_components/cart-checkout-form.tsx",
      "src/app/account/page.tsx",
      "src/app/service/page.tsx",
      "src/app/service/_components/service-request-form.tsx",
    ];
    const nestedViolations = coveredPublicSurfaces.flatMap((sourcePath) =>
      findNestedCardLines(read(sourcePath)).map(
        (line) => `${sourcePath}:${line}`,
      ),
    );

    expect(nestedViolations).toEqual([]);
    expect(coveredPublicSurfaces.map((sourcePath) => read(sourcePath))).toEqual(
      expect.arrayContaining([
        expect.stringContaining("product-card-shell"),
        expect.stringContaining("checkout-empty-cart"),
        expect.stringContaining("account-wishlist"),
        expect.stringContaining("service-request-form"),
      ]),
    );
  });
});

function findNestedCardLines(source: string) {
  const cardTagPattern = /<\/?Card(?:\s|>)/g;
  const nestedLines: number[] = [];
  let depth = 0;

  for (const match of source.matchAll(cardTagPattern)) {
    const token = match[0];

    if (token.startsWith("</")) {
      depth = Math.max(0, depth - 1);
      continue;
    }

    if (depth > 0) {
      nestedLines.push(getLineNumber(source, match.index));
    }

    depth += 1;
  }

  return nestedLines;
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

function isPublicTsxSource(file: string) {
  if (file.includes(`${path.sep}src${path.sep}app${path.sep}admin`)) {
    return false;
  }

  return file.endsWith(".tsx") && !file.includes(".test.");
}

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
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

function getLineNumber(source: string, index: number) {
  return source.slice(0, index).split("\n").length;
}

function toPosixPath(filePath: string) {
  return filePath.split(path.sep).join("/");
}
