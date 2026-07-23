import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const allowedAiElementConsumers = ["src/app/ai/", "src/app/elys-ai/"] as const;

describe("AI bundle boundary", () => {
  it("keeps AI Elements imports out of primary commerce routes", () => {
    const offenders = walk("src/app")
      .filter(
        (filePath) => filePath.endsWith(".tsx") || filePath.endsWith(".ts"),
      )
      .map(normalizePath)
      .filter(
        (filePath) =>
          !allowedAiElementConsumers.some((prefix) =>
            filePath.startsWith(prefix),
          ),
      )
      .filter((filePath) =>
        readFileSync(path.join(process.cwd(), filePath), "utf8").includes(
          "~/components/ai-elements",
        ),
      );

    expect(offenders).toEqual([]);
  });

  it("does not retain the retired public gift recommender", () => {
    expect(walk("src/app/ai").map(normalizePath)).not.toEqual(
      expect.arrayContaining([
        expect.stringContaining("ai-gift-recommender"),
        expect.stringContaining("ai-gift-panel"),
      ]),
    );
  });
});

function walk(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const fullPath = path.join(directory, entry);
    const stats = statSync(fullPath);

    return stats.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

function normalizePath(filePath: string) {
  return filePath.replaceAll(path.sep, "/");
}
