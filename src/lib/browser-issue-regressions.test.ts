import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const sourceRoot = path.join(root, "src");
const sourceExtensions = new Set([".ts", ".tsx"]);
const documentCookieNeedle = "document" + ".cookie";

describe("browser issue regressions", () => {
  it("does not use synchronous document.cookie access in app source", () => {
    const violations = listSourceFiles(sourceRoot).filter((filePath) =>
      readFileSync(filePath, "utf8").includes(documentCookieNeedle),
    );

    expect(violations.map((filePath) => path.relative(root, filePath))).toEqual(
      [],
    );
  });
});

function listSourceFiles(dirPath: string): string[] {
  return readdirSync(dirPath, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      return listSourceFiles(entryPath);
    }

    return entry.isFile() &&
      sourceExtensions.has(path.extname(entry.name)) &&
      !entry.name.includes(".test.")
      ? [entryPath]
      : [];
  });
}
