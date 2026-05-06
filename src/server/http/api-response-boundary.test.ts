import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const currentFile = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(currentFile), "../../..");
const allowedResponseFiles = new Set(["src/server/http/api-response.ts"]);
const sourceRoots = ["src/app", "src/server"];
const sourceExtensions = new Set([".js", ".jsx", ".ts", ".tsx"]);
const testFilePattern = /\.(test|spec)\.[jt]sx?$/;
const forbiddenJsonCalls = ["Response.json(", "NextResponse.json("] as const;

describe("api response boundaries", () => {
  it("keeps route JSON responses behind shared helpers", async () => {
    const files = (
      await Promise.all(
        sourceRoots.map((sourceRoot) =>
          listSourceFiles(path.join(repoRoot, sourceRoot)),
        ),
      )
    ).flat();

    const violations = [];

    for (const file of files) {
      const relativePath = toRepoPath(file);

      if (allowedResponseFiles.has(relativePath)) continue;
      if (testFilePattern.test(relativePath)) continue;

      const source = await readFile(file, "utf8");
      const calls = forbiddenJsonCalls.filter((call) => source.includes(call));

      for (const call of calls) {
        violations.push(
          `${relativePath}: use api-response helpers instead of ${call}`,
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
