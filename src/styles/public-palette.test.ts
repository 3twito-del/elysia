import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const publicSourceRoots = ["src/app", "src/components", "src/styles"].map(
  (dir) => path.join(root, dir),
);
const approvedBrandTokens = new Set([
  "--brand-porcelain",
  "--brand-ink",
  "--brand-platinum",
  "--brand-aqua",
  "--brand-aqua-soft",
  "--brand-aqua-deep",
  "--brand-aqua-ring",
]);
const approvedWarmMaterialPath =
  "src/app/product/[slug]/_components/product-purchase-panel.tsx";

describe("public palette guardrails", () => {
  it("keeps the public brand palette limited to aqua and neutral tokens", () => {
    const css = read("src/styles/globals.css");
    const brandTokens = Array.from(
      css.matchAll(/(--brand-[\w-]+)\s*:/g),
      (match) => match[1] ?? "",
    );

    expect(new Set(brandTokens)).toEqual(approvedBrandTokens);
  });

  it("keeps warm material colors scoped to documented product swatches", () => {
    const violations = publicSourceRoots
      .flatMap(walk)
      .filter(isPublicSource)
      .flatMap((file) => {
        const relativePath = toPosixPath(path.relative(root, file));
        const source = readFileSync(file, "utf8");

        if (relativePath === approvedWarmMaterialPath) {
          return source.includes('data-material-swatch="true"')
            ? []
            : [`${relativePath} is missing documented material swatches`];
        }

        return /#(?:fff0b8|d4a63d|fff7d9|f7d7c7|c98e79|fff2eb)\b/i.test(source)
          ? [`${relativePath} contains warm material colors outside swatches`]
          : [];
      });

    expect(violations).toEqual([]);
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

function isPublicSource(file: string) {
  if (file.includes(`${path.sep}src${path.sep}app${path.sep}admin`)) {
    return false;
  }

  return /\.(?:css|tsx?)$/.test(file) && !file.includes(".test.");
}

function toPosixPath(filePath: string) {
  return filePath.split(path.sep).join("/");
}
