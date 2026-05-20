import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("about page redesign guardrails", () => {
  it("keeps the about page editorial, media-led, and compact", () => {
    const source = read("src/app/about/page.tsx");
    const localImageReferences = [
      ...source.matchAll(/src:\s*"\/brand\/[^"]+\.avif"/g),
    ];

    expect(source).toContain('import Image from "next/image"');
    expect(source).toContain("const editorialImages = [");
    expect(source).toContain("const storyImages = [");
    expect(source).toContain("function EditorialImage");
    expect(localImageReferences.length).toBeGreaterThanOrEqual(5);
    expect(source).toContain('variant="none"');
    expect(source).not.toContain("Separator");
    expect(source).not.toContain("brand-surface mx-auto max-w-4xl");
    expect(source).not.toContain("py-16");
    expect(source).not.toContain("lg:py-20");
  });

  it("keeps the implementation report available for the benchmark review", () => {
    const report = read("docs/qa/about-page-redesign.md");

    expect(report).toContain("Local benchmark reviewed");
    expect(report).toContain("Media: count, placement, aspect ratios");
    expect(report).toContain("No final boxed `brand-surface` CTA");
  });
});

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}
