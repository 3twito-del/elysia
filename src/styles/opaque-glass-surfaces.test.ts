import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const publicSourceRoots = ["src/app", "src/components"].map((dir) =>
  path.join(root, dir),
);
const translucentSurfacePatterns = [
  /\bbackdrop-blur\b/,
  /\bbg-(?:background|card|white|black)\/\d+\b/,
];
const opaqueGlassVariables = [
  "--glass-panel-bg",
  "--glass-card-bg",
  "--glass-control-bg",
  "--glass-inset-bg",
  "--glass-chrome-bg",
] as const;

describe("opaque glass surface guardrails", () => {
  it("keeps public action and reading surfaces free of blur and translucent background utilities", () => {
    const violations = publicSourceRoots
      .flatMap(walk)
      .filter(isPublicUiSource)
      .flatMap((file) => {
        const source = readFileSync(file, "utf8");
        const relativePath = toPosixPath(path.relative(root, file));

        return translucentSurfacePatterns
          .filter((pattern) => pattern.test(source))
          .map((pattern) => `${relativePath} matched ${pattern}`);
      });

    expect(violations).toEqual([]);
  });

  it("keeps shared glass tokens and popup surfaces opaque", () => {
    const css = readFileSync(path.join(root, "src/styles/globals.css"), "utf8");
    const variableViolations = opaqueGlassVariables
      .map(
        (variableName) =>
          [variableName, getCssVariableValues(css, variableName)] as const,
      )
      .flatMap(([variableName, values]) =>
        values
          .filter((value) => isTranslucentColorValue(value))
          .map((value) => `${variableName}: ${value}`),
      );

    expect(variableViolations).toEqual([]);
    expect(extractCssBlock(css, ".popup-surface")).toMatch(
      /background:\s*var\(--popover\)\s*!important;/,
    );
    expect(extractCssBlock(css, ".popup-surface")).toMatch(
      /backdrop-filter:\s*none;/,
    );
    expect(extractCssBlock(css, ".popup-surface")).toMatch(
      /-webkit-backdrop-filter:\s*none;/,
    );
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

function isPublicUiSource(file: string) {
  if (file.includes(`${path.sep}src${path.sep}app${path.sep}admin`)) {
    return false;
  }

  return file.endsWith(".tsx") && !file.includes(".test.");
}

function toPosixPath(filePath: string) {
  return filePath.split(path.sep).join("/");
}

function getCssVariableValues(css: string, variableName: string) {
  return Array.from(
    css.matchAll(
      new RegExp(`${escapeRegExp(variableName)}\\s*:\\s*([^;]+);`, "g"),
    ),
    (match) => match[1]?.trim() ?? "",
  );
}

function isTranslucentColorValue(value: string) {
  return /\/\s*(?:0?\.\d+|\d{1,2}%|[1-8]\d%)\s*\)?/.test(value);
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

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, (match) => `\\${match}`);
}
