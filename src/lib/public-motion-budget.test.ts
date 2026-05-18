import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const sourceRoots = ["src/app", "src/components", "src/styles"].map((dir) =>
  path.join(root, dir),
);
const allowedContinuousMotionFiles = new Set([
  "src/app/page.tsx",
  "src/components/cinematic-hero-sequence.tsx",
]);
const continuousMotionPatterns = [/\brepeat\s*:\s*-1\b/, /\binfinite\b/];

describe("public motion budget", () => {
  it("keeps continuous motion scoped to the home cinematic hero", () => {
    const violations = sourceRoots
      .flatMap(walk)
      .filter(isPublicUiSource)
      .flatMap((file) => {
        const relativePath = toPosixPath(path.relative(root, file));

        if (allowedContinuousMotionFiles.has(relativePath)) return [];

        const source = readFileSync(file, "utf8");

        return continuousMotionPatterns
          .filter((pattern) => pattern.test(source))
          .map((pattern) => `${relativePath} matched ${pattern}`);
      });

    expect(violations).toEqual([]);
  });

  it("requires explicit home-hero scope before GSAP repeat timelines can run", () => {
    const sequenceSource = read("src/components/cinematic-hero-sequence.tsx");
    const homeSource = read("src/app/page.tsx");
    const brandMediaPanelSource = read("src/components/brand-media-panel.tsx");
    const productCardSource = read("src/components/product-card.tsx");
    const loadingCss = read("src/styles/globals.css");

    expect(sequenceSource).toContain(
      'const allowsContinuousMotion = motionScope === "home-hero";',
    );
    expect(sequenceSource).toContain("!allowsContinuousMotion");
    expect(homeSource).toContain('motionScope="home-hero"');
    expect(brandMediaPanelSource).not.toContain('motionScope="home-hero"');
    expect(productCardSource).not.toContain('motionScope="home-hero"');
    expect(loadingCss).not.toContain("@keyframes category-loading-progress");
    expect(
      extractCssBlock(loadingCss, ".category-loading-progress"),
    ).not.toMatch(/\banimation\s*:/);
  });
});

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
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

function isPublicUiSource(file: string) {
  if (file.includes(`${path.sep}src${path.sep}app${path.sep}admin`)) {
    return false;
  }

  return /\.(?:css|tsx?)$/.test(file) && !file.includes(".test.");
}

function toPosixPath(filePath: string) {
  return filePath.split(path.sep).join("/");
}

function extractCssBlock(source: string, selector: string) {
  const selectorIndex = source.indexOf(selector);
  expect(selectorIndex).toBeGreaterThanOrEqual(0);

  const blockStart = source.indexOf("{", selectorIndex);
  expect(blockStart).toBeGreaterThanOrEqual(0);

  const blockEnd = source.indexOf("}", blockStart);
  expect(blockEnd).toBeGreaterThanOrEqual(0);

  return source.slice(blockStart, blockEnd + 1);
}
