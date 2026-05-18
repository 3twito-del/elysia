import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const sourceRoots = ["src/app", "src/components", "src/styles"].map((dir) =>
  path.join(root, dir),
);
const allowedTrackingUtilities = new Map([
  [
    "src/components/ui/command.tsx",
    ["tracking-widest"],
  ],
  [
    "src/components/ui/dropdown-menu.tsx",
    ["tracking-widest"],
  ],
]);

describe("public typography spacing guardrails", () => {
  it("keeps public text letter spacing normal except documented shortcut labels", () => {
    const violations = sourceRoots
      .flatMap(walk)
      .filter(isPublicSource)
      .flatMap((file) => {
        const source = readFileSync(file, "utf8");
        const relativePath = toPosixPath(path.relative(root, file));
        const allowed = allowedTrackingUtilities.get(relativePath) ?? [];

        return [
          ...findTrackingUtilityViolations(source, allowed).map(
            (value) => `${relativePath} uses ${value}`,
          ),
          ...findLetterSpacingViolations(source).map(
            (value) => `${relativePath} uses ${value}`,
          ),
        ];
      });

    expect(violations).toEqual([]);
  });
});

function findTrackingUtilityViolations(source: string, allowed: string[]) {
  return Array.from(
    source.matchAll(/\btracking-(?!normal\b)[\w-[\]./]+/g),
    (match) => match[0],
  ).filter((utility) => !allowed.includes(utility));
}

function findLetterSpacingViolations(source: string) {
  return Array.from(
    source.matchAll(/letter-spacing\s*:\s*([^;]+);/g),
    (match) => match[0],
  ).filter((declaration) => !/letter-spacing\s*:\s*0\s*;/.test(declaration));
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
