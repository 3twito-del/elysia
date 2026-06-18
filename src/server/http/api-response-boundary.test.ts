import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { beforeAll, describe, expect, it } from "vitest";

const currentFile = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(currentFile), "../../..");
const allowedResponseFiles = new Set(["src/server/http/api-response.ts"]);
const sourceRoots = ["src/app", "src/server"];
const sourceExtensions = new Set([".js", ".jsx", ".ts", ".tsx"]);
const testFilePattern = /\.(test|spec)\.[jt]sx?$/;
const forbiddenJsonCalls = ["Response.json(", "NextResponse.json("] as const;
const minimumScannedSourceFileCount = 250;
const minimumRuntimeSourceFileCount = 190;

type SourceSnapshot = {
  relativePath: string;
  source: string;
};

describe("api response boundaries", () => {
  let sources: SourceSnapshot[] = [];

  beforeAll(async () => {
    const files = (
      await Promise.all(
        sourceRoots.map((sourceRoot) =>
          listSourceFiles(path.join(repoRoot, sourceRoot)),
        ),
      )
    ).flat();

    sources = await Promise.all(
      files.map(async (file) => ({
        relativePath: toRepoPath(file),
        source: await readFile(file, "utf8"),
      })),
    );
  }, 15_000);

  it("documents the source scan fixture size", () => {
    const runtimeSourceCount = sources.filter(
      ({ relativePath }) => !testFilePattern.test(relativePath),
    ).length;

    expect(sources.length).toBeGreaterThanOrEqual(
      minimumScannedSourceFileCount,
    );
    expect(runtimeSourceCount).toBeGreaterThanOrEqual(
      minimumRuntimeSourceFileCount,
    );
  });

  it("keeps route JSON responses behind shared helpers", () => {
    const violations = [];

    for (const { relativePath, source } of sources) {
      if (allowedResponseFiles.has(relativePath)) continue;
      if (testFilePattern.test(relativePath)) continue;

      const calls = forbiddenJsonCalls.filter((call) => source.includes(call));

      for (const call of calls) {
        violations.push(
          `${relativePath}: use api-response helpers instead of ${call}`,
        );
      }
    }

    expect(violations).toEqual([]);
  });

  it("keeps error status responses out of success helpers", () => {
    const violations = [];

    for (const { relativePath, source } of sources) {
      if (testFilePattern.test(relativePath)) continue;

      const calls = extractFunctionCalls(source, "okJson");
      const errorStatusCall = calls.find((call) =>
        /\bstatus\s*:\s*[45]\d\d\b/.test(call),
      );

      if (errorStatusCall) {
        violations.push(
          `${relativePath}: use error helpers instead of okJson with an error status`,
        );
      }
    }

    expect(violations).toEqual([]);
  });
});

async function listSourceFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await listSourceFiles(entryPath)));
      continue;
    }

    if (entry.isFile() && sourceExtensions.has(path.extname(entry.name))) {
      files.push(entryPath);
    }
  }

  return files;
}

function toRepoPath(file: string) {
  return path.relative(repoRoot, file).split(path.sep).join("/");
}

function extractFunctionCalls(source: string, functionName: string) {
  const calls: string[] = [];
  let searchFrom = 0;

  while (searchFrom < source.length) {
    const start = source.indexOf(`${functionName}(`, searchFrom);

    if (start === -1) break;

    let depth = 0;

    for (
      let index = start + functionName.length;
      index < source.length;
      index += 1
    ) {
      const char = source[index];

      if (char === "(") depth += 1;
      if (char === ")") depth -= 1;

      if (depth === 0) {
        calls.push(source.slice(start, index + 1));
        searchFrom = index + 1;
        break;
      }
    }

    if (searchFrom <= start) break;
  }

  return calls;
}
