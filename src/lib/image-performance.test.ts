import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const sourceRoots = ["src/app", "src/components"];
const sourceExtensions = new Set([".tsx", ".ts"]);

describe("image performance guardrails", () => {
  it("keeps hero media full-viewport sized and only prioritizes the first slide", () => {
    const source = readFileSync(
      path.join(process.cwd(), "src/components/cinematic-hero-sequence.tsx"),
      "utf8",
    );

    expect(source).toContain('sizes = "100vw"');
    expect(source).toContain("priority={priority && index === 0}");
  });

  it("keeps product cards on a stable commerce aspect ratio with responsive image sizes", () => {
    const source = readFileSync(
      path.join(process.cwd(), "src/components/product-card.tsx"),
      "utf8",
    );

    expect(source).toContain("relative aspect-[10/11] overflow-hidden");
    expect(source).toContain("sm:aspect-[4/5]");
    expect(source).toContain("DEFAULT_PRODUCT_CARD_IMAGE_SIZES");
    expect(source).toContain("(min-width: 1280px) 18rem");
    expect(source).toContain("(min-width: 640px) 50vw");
  });

  it("prioritizes only the initial product gallery image and lazy-loads later active images", () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        "src/app/product/[slug]/_components/product-gallery.tsx",
      ),
      "utf8",
    );

    expect(source).toContain("priority={activeImageIndex === 0}");
    expect(source).toContain(
      'loading={activeImageIndex === 0 ? undefined : "lazy"}',
    );
    expect(source).toContain(
      'sizes="(min-width: 1280px) 58vw, (min-width: 1024px) 54vw, 100vw"',
    );
    expect(source).toContain('loading="lazy"');
    expect(source).toContain(
      'sizes="(min-width: 1024px) 12vw, (min-width: 640px) 18vw, 24vw"',
    );
  });

  it("keeps category and discovery support media on explicit fixed desktop sizes", () => {
    const categorySource = readFileSync(
      path.join(process.cwd(), "src/app/category/[slug]/page.tsx"),
      "utf8",
    );
    const giftsSource = readFileSync(
      path.join(process.cwd(), "src/app/gifts/page.tsx"),
      "utf8",
    );

    expect(categorySource).toContain(
      'imageSizes="(min-width: 1280px) 18rem, (min-width: 1024px) calc((100vw - 24rem) / 2), (min-width: 640px) 50vw, 100vw"',
    );
    expect(giftsSource).toContain('sizes="280px"');
  });

  it("keeps fill-based next/image usage paired with explicit sizes", () => {
    const offenders = listSourceFiles(sourceRoots).flatMap((filePath) => {
      const source = readFileSync(filePath, "utf8");
      const imageTags = source.match(/<Image(?=[\s/>])[\s\S]*?\/>/g) ?? [];

      return imageTags
        .filter((tag) => /\bfill\b/.test(tag) && !/\bsizes=/.test(tag))
        .map((tag) => ({
          file: normalizePath(filePath),
          line: getLineNumber(source, tag),
        }));
    });

    expect(offenders).toEqual([]);
  });

  it("does not prioritize image surfaces that are hidden by default", () => {
    const offenders = listSourceFiles(sourceRoots).flatMap((filePath) => {
      const source = readFileSync(filePath, "utf8");
      const mediaTags =
        source.match(/<(?:Image|BrandMediaPanel)(?=[\s/>])[\s\S]*?\/>/g) ?? [];

      return mediaTags
        .filter(
          (tag) =>
            /\bpriority(?:[\s/>=]|$)/.test(tag) &&
            /\bclassName="[^"]*\bhidden\b[^"]*"/.test(tag),
        )
        .map((tag) => ({
          file: normalizePath(filePath),
          line: getLineNumber(source, tag),
        }));
    });

    expect(offenders).toEqual([]);
  });

  it("does not prioritize media inside hidden aria-hidden sections", () => {
    const offenders = listSourceFiles(sourceRoots).flatMap((filePath) => {
      const source = readFileSync(filePath, "utf8");
      const hiddenSections =
        source.match(
          /<RevealSection(?=[^>]*aria-hidden="true")(?=[^>]*className="hidden")[^>]*>[\s\S]*?<\/RevealSection>/g,
        ) ?? [];

      return hiddenSections
        .filter((section) => /\bpriority(?:[\s/>=]|$)/.test(section))
        .map((section) => ({
          file: normalizePath(filePath),
          line: getLineNumber(source, section),
        }));
    });

    expect(offenders).toEqual([]);
  });
});

function listSourceFiles(roots: string[]) {
  return roots.flatMap((root) => walk(root));
}

function walk(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const fullPath = path.join(directory, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) return walk(fullPath);

    return sourceExtensions.has(path.extname(fullPath)) ? [fullPath] : [];
  });
}

function getLineNumber(source: string, snippet: string) {
  return source.slice(0, source.indexOf(snippet)).split("\n").length;
}

function normalizePath(filePath: string) {
  return filePath.replaceAll(path.sep, "/");
}
