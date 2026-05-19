import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const brandMediaSource = "src/lib/brand-media.ts";

describe("product-led media guardrails", () => {
  it("keeps public brand media references on bitmap product photography", () => {
    const source = read(brandMediaSource);
    const mediaSources = Array.from(
      source.matchAll(/src:\s*"([^"]+)"/g),
      (match) => match[1] ?? "",
    );

    expect(mediaSources.length).toBeGreaterThan(0);
    expect(mediaSources.every((src) => src.startsWith("/brand/"))).toBe(true);
    expect(mediaSources.every((src) => src.endsWith(".avif"))).toBe(true);
    expect(source).not.toMatch(/\.svg\b|data:image\/svg|illustration/i);
    expect(source).not.toMatch(/\b(?:linear-gradient|radial-gradient)\b/i);
  });

  it("keeps generated brand assets as bitmap files, not SVG illustrations", () => {
    const brandAssetViolations = walk(path.join(root, "public", "brand"))
      .filter((file) => path.extname(file).toLowerCase() === ".svg")
      .map((file) => toPosixPath(path.relative(root, file)));

    expect(brandAssetViolations).toEqual([]);
  });

  it("keeps catalog and seed image pools local and category-specific", () => {
    const catalog = read("src/server/services/catalog.ts");
    const seed = read("prisma/seed-catalog.ts");

    expect(catalog).toContain(
      'export const DEFAULT_CATALOG_IMAGE = "/brand/v2/commerce-catalog.avif";',
    );
    expect(seed).not.toContain("images.unsplash.com");
    for (const category of ["rings", "earrings", "necklaces", "bracelets"]) {
      expect(catalog).toContain(`/brand/v2/category-${category}.avif`);
      expect(seed).toContain(`/brand/v2/category-${category}.avif`);
    }
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

function toPosixPath(filePath: string) {
  return filePath.split(path.sep).join("/");
}
