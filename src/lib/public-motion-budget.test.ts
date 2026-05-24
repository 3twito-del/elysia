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

  it("keeps sheet and mobile navigation exits compositor-only and fully off canvas", () => {
    const css = read("src/styles/globals.css");
    const sheetSource = read("src/components/ui/sheet.tsx");

    expect(sheetSource).toContain('"sheet-content popup-surface');
    expect(sheetSource).toContain('"sheet-overlay popup-overlay');
    expect(sheetSource).not.toContain("data-closed:slide-out-to-right");
    expect(css).toContain("--motion-sheet-exit: 420ms;");
    expect(css).toContain("--motion-sheet-axis-distance: 102%;");
    expect(css).toContain(
      '.sheet-content[data-side="right"][data-state="closed"]',
    );
    expect(css).toContain("animation-name: sheet-out-to-right;");
    expect(css).toContain("@keyframes sheet-out-to-right");
    expect(css).toContain(
      "translate3d(var(--motion-sheet-axis-distance), 0, 0)",
    );
    expect(css).toContain("@keyframes mobile-nav-panel-out");
    expect(css).toContain("transform: translate3d(104%, 0, 0) scaleX(0.985);");
    expect(
      extractCssBlock(css, '.mobile-nav-panel[data-state="closed"]'),
    ).toContain("var(--motion-sheet-exit)");
    expect(css).not.toContain("transform: translateX(0.75rem)");
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

  it("keeps passive catalog media out of client-side motion libraries", () => {
    const brandMediaPanelSource = read("src/components/brand-media-panel.tsx");
    const filterPanelSource = read(
      "src/app/category/[slug]/_components/deferred-category-filter-panel.tsx",
    );
    const preferenceSource = read("src/components/motion-preference.ts");
    const productCardSource = read("src/components/product-card.tsx");

    expect(brandMediaPanelSource).not.toContain('"use client"');
    expect(brandMediaPanelSource).not.toContain(
      'from "~/components/kinetic-image-motion"',
    );
    expect(brandMediaPanelSource).toContain("function StaticKineticImageFrame");
    expect(brandMediaPanelSource).toContain(
      "function StaticCinematicHeroSequence",
    );
    expect(filterPanelSource).not.toContain('"use client"');
    expect(filterPanelSource).not.toContain("fetch(");
    expect(filterPanelSource).not.toContain("IntersectionObserver");
    expect(preferenceSource).not.toContain('from "motion/react"');
    expect(preferenceSource).toContain(
      'const reducedMotionQuery = "(prefers-reduced-motion: reduce)";',
    );
    expect(preferenceSource).toContain("window.matchMedia(reducedMotionQuery)");
    expect(productCardSource).not.toContain(
      'from "~/components/kinetic-image-motion"',
    );
    expect(productCardSource).toContain("function StaticKineticImageFrame");
    expect(productCardSource).toContain('data-motion-scope="static"');
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
