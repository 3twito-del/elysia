import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const sourceRoots = ["src/app", "src/components"];

describe("list icon uniqueness", () => {
  it("does not reuse an icon for different items in the same static list", () => {
    const violations = sourceRoots.flatMap((sourceRoot) =>
      listSourceFiles(path.join(root, sourceRoot)).flatMap((file) =>
        findIconListDuplicates(file),
      ),
    );

    expect(violations).toEqual([]);
  });
});

function listSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return listSourceFiles(absolutePath);
    }

    if (!entry.isFile()) return [];
    if (!/\.(tsx|ts)$/.test(entry.name)) return [];
    if (/\.(test|spec)\.(tsx|ts)$/.test(entry.name)) return [];

    return [absolutePath];
  });
}

function findIconListDuplicates(file: string) {
  const source = readFileSync(file, "utf8");
  const relativePath = path.relative(root, file).replaceAll(path.sep, "/");
  const arrayPattern =
    /(?:^|\n)\s*(?:export\s+)?const\s+([A-Za-z0-9_]+)\s*(?::[^=]+)?=\s*\[([\s\S]*?)\]\s*(?:as const)?\s*;/g;

  return [...source.matchAll(arrayPattern)].flatMap((match) => {
    const arrayName = match[1];
    const body = match[2] ?? "";
    const icons = [
      ...body.matchAll(/\bicon:\s*([A-Z][A-Za-z0-9_]*)\b/g),
    ]
      .map((iconMatch) => iconMatch[1])
      .filter((icon): icon is string => Boolean(icon));

    if (!arrayName || icons.length < 2) return [];

    const iconCounts = icons.reduce<Map<string, number>>((counts, icon) => {
      counts.set(icon, (counts.get(icon) ?? 0) + 1);
      return counts;
    }, new Map());

    return [...iconCounts]
      .filter(([, count]) => count > 1)
      .map(
        ([icon, count]) =>
          `${relativePath}: ${arrayName} repeats ${icon} ${count} times`,
      );
  });
}
