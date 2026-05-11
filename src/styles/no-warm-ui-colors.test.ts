import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const forbiddenUiPatterns = [
  /brand-champagne/i,
  /244\s+213\s+138/i,
  /#f4d58a/i,
  /\byellow\b/i,
  /\bamber\b/i,
  /\bchampagne\b/i,
];

describe("public UI color guard", () => {
  it("keeps warm color names and tokens out of public UI and hero files", () => {
    const files = [
      path.join(root, "src/styles/globals.css"),
      ...walk(path.join(root, "src/components")).filter(isUiFile),
      ...walk(path.join(root, "src/app")).filter(
        (file) =>
          isUiFile(file) &&
          !file.includes(
            `${path.sep}src${path.sep}app${path.sep}admin${path.sep}`,
          ),
      ),
      path.join(root, "src/lib/brand-media.ts"),
    ].filter((file) => !file.includes(".test."));

    const violations = files.flatMap((file) => {
      const content = readFileSync(file, "utf8");

      return forbiddenUiPatterns
        .filter((pattern) => pattern.test(content))
        .map((pattern) => `${path.relative(root, file)} matched ${pattern}`);
    });

    expect(violations).toEqual([]);
  });

  it("keeps hero media alt text material-neutral", () => {
    const brandMedia = readFileSync(
      path.join(root, "src/lib/brand-media.ts"),
      "utf8",
    );

    expect(brandMedia).not.toMatch(/\bgold\b/i);
  });
});

function walk(dir: string): string[] {
  if (!statSync(dir, { throwIfNoEntry: false })?.isDirectory()) return [];

  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(dir, entry.name);

    if (entry.isDirectory()) return walk(entryPath);
    if (entry.isFile()) return [entryPath];

    return [];
  });
}

function isUiFile(file: string) {
  return file.endsWith(".css") || file.endsWith(".tsx");
}
