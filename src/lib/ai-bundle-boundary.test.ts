import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const allowedAiElementConsumers = ["src/app/ai/", "src/app/stylist/"] as const;

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

  it("keeps the AI gift panel deferred behind a dynamic import", () => {
    const deferredPanel = read(
      "src/app/ai/_components/deferred-ai-gift-panel.tsx",
    );

    expect(deferredPanel).toContain('import dynamic from "next/dynamic"');
    expect(deferredPanel).toContain('() => import("./ai-gift-panel")');
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

function read(relativePath: string) {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}
