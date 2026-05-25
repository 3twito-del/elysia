import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const textExtensions = new Set([
  ".css",
  ".cjs",
  ".js",
  ".json",
  ".jsx",
  ".md",
  ".mdx",
  ".mjs",
  ".prisma",
  ".sql",
  ".ts",
  ".tsx",
  ".toml",
  ".yaml",
  ".yml",
]);

const retiredCodePrefix = ["A", "PH"].join("");
const retiredBrandTerms = [
  [65, 112, 104, 114, 111, 100, 105, 116, 101],
  [65, 102, 114, 111, 100, 105, 116, 101],
  [1488, 1508, 1512, 1493, 1491, 1497, 1496, 1492],
  [1488, 1508, 1512, 1491, 1497, 1496, 1492],
].map((codes) => String.fromCharCode(...codes));

const forbiddenMatchers = [
  {
    label: "retired brand term",
    pattern: new RegExp(
      retiredBrandTerms.map((term) => escapeRegExp(term)).join("|"),
      "iu",
    ),
  },
  {
    label: "retired commerce prefix",
    pattern: new RegExp(`\\b${retiredCodePrefix}(?=[-0-9])`, "u"),
  },
  {
    label: "retired lowercase commerce prefix",
    pattern: new RegExp(`\\b${retiredCodePrefix.toLowerCase()}(?=[-0-9])`, "u"),
  },
];

describe("brand naming guardrails", () => {
  it("keeps retired brand names and commerce prefixes out of tracked text", () => {
    const violations = getTrackedTextFiles().flatMap((file) => {
      const source = readFileSync(path.join(root, file), "utf8");

      return forbiddenMatchers
        .filter((matcher) => matcher.pattern.test(source))
        .map((matcher) => `${file} contains ${matcher.label}`);
    });

    expect(violations).toEqual([]);
  });
});

function getTrackedTextFiles() {
  return execFileSync("git", ["ls-files"], {
    cwd: root,
    encoding: "utf8",
  })
    .split(/\r?\n/)
    .filter(Boolean)
    .filter(isTextFile);
}

function isTextFile(file: string) {
  if (file.startsWith(".env")) return true;

  return textExtensions.has(path.extname(file));
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
