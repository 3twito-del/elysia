import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("about page redesign guardrails", () => {
  it("keeps the about page editorial, media-led, and compact", () => {
    const source = read("src/app/about/page.tsx");
    const localImageReferences = [
      ...source.matchAll(/(?:const\s+\w+\s*=\s*|src=)"\/brand\/[^"]+\.avif"/g),
    ];

    expect(source).toContain('import Image from "next/image"');
    expect(source).toContain("const aboutHeroImage =");
    expect(source).toContain('data-testid="about-cinematic-page-hero"');
    expect(source).toContain("DeferredFixedBackgroundBand");
    expect(source).toContain("boutique-story-media-left");
    expect(source).toContain("boutique-story-media-right");
    expect(source).toContain("about-practical-proof");
    expect(localImageReferences.length).toBeGreaterThanOrEqual(3);
    expect(source).toContain('variant="none"');
    expect(source).not.toContain("Separator");
    expect(source).not.toContain("brand-surface mx-auto max-w-4xl");
    expect(source).not.toContain("py-16");
    expect(source).not.toContain("lg:py-20");
  });

  it("keeps the implementation report available for the benchmark review", () => {
    const report = read("docs/QA_EVIDENCE.md");

    expect(report).toContain("Local benchmark reviewed");
    expect(report).toContain("Media: count, placement, aspect ratios");
    expect(report).toContain("No final boxed `brand-surface` CTA");
  });
});

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}
