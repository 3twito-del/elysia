import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const shineEffectFiles = [
  "src/styles/globals.css",
  "src/components/kinetic-image-motion.tsx",
  "src/components/brand-media-panel.tsx",
] as const;

const forbiddenShinePatterns = [
  /aqua-button-shine/i,
  /brand-media-panel-shine/i,
  /kinetic-image-shine/i,
  /shineDuration/i,
  /playShine/i,
];

describe("public shine effect guardrails", () => {
  it("keeps CTA and media shine effects out of the public design system", () => {
    const violations = shineEffectFiles.flatMap((file) => {
      const content = readFileSync(path.join(root, file), "utf8");

      return forbiddenShinePatterns
        .filter((pattern) => pattern.test(content))
        .map((pattern) => `${file} matched ${pattern}`);
    });

    expect(violations).toEqual([]);
  });
});
