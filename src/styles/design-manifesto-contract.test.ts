import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("Elysia design manifesto contract", () => {
  it("keeps the manifesto orientative, non-blocking, and below the public gate", () => {
    const design = read("docs/DESIGN.md");
    const engineering = read("docs/ENGINEERING.md");

    expect(design).toContain("ELYSIA_DESIGN_MANIFESTO");
    expect(design).toContain("orientative design authority");
    expect(design).toContain("non-blocking");
    expect(design).toContain("does not replace");
    expect(design).toContain("HIGH_JEWELRY_REFERENCE_GATE");
    expect(design).toContain("High Jewelry Reference Gate");
    expect(design).toContain("Public structure policy");
    expect(design).toContain("Local implementation preference");
    expect(design).toContain("Hero sections should stay clean and selective");
    expect(design).toContain("limited number of elements");
    expect(design).toContain("Mobile is not compressed desktop");
    expect(design).toContain("Service supports trust");

    expect(design).toContain("orientative design authority after");
    expect(design).toContain(
      "does not approve a change that fails the High Jewelry Reference Gate",
    );

    expect(engineering).toContain("docs/DESIGN.md");
    expect(engineering).toContain("orientative, non-blocking quality");
    expect(engineering).toContain("layer. It does not add a threshold");
    expect(engineering).toContain("does not add a threshold");
    expect(engineering).toContain("orientative and non-blocking");
  });

  it("applies the clean hero principle to the public homepage", () => {
    const home = read("src/app/page.tsx");
    const css = read("src/styles/globals.css");

    expect(home).toContain('data-testid="cinematic-page-hero"');
    expect(home).toContain('data-testid="home-hero-copy"');
    expect(home).toContain("data-hero-copy-direction={homeHeroDirection}");
    expect(home).toContain('data-testid="home-hero-primary-cta"');
    expect(home).not.toContain('data-testid="home-hero-secondary-cta"');
    expect(home).not.toContain('data-testid="home-commerce-entry-links"');
    expect(home).not.toContain("const homeCommerceEntryLinks = [");
    expect(home).not.toContain("homeHeroCampaignLinks");
    expect(home).not.toContain('data-testid="home-hero-campaign-links"');
    expect(home).not.toContain("home-hero-campaign-link");
    expect(css).not.toContain(".home-commerce-entry-links");
    expect(css).not.toContain(".home-hero-campaign-links");
  });
});

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}
