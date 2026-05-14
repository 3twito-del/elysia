import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const sourceRoots = ["src/app", "src/components"];
const sourceExtensions = new Set([".tsx", ".ts"]);

describe("image performance guardrails", () => {
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
