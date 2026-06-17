import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("Elysia design manifesto contract", () => {
  it("keeps the manifesto orientative, non-blocking, and below the public gate", () => {
    const manifesto = read("docs/ELYSIA_DESIGN_MANIFESTO.md");
    const publicGate = read("docs/PUBLIC_CHANGE_GATE.md");
    const fullBenchmark = read("docs/FULL_PRODUCT_BENCHMARK.md");
    const engineeringConventions = read("docs/ENGINEERING_CONVENTIONS.md");

    expect(manifesto).toContain("ELYSIA_DESIGN_MANIFESTO");
    expect(manifesto).toContain("orientative design authority");
    expect(manifesto).toContain("non-blocking");
    expect(manifesto).toContain("does not replace");
    expect(manifesto).toContain("HIGH_JEWELRY_REFERENCE_GATE");
    expect(manifesto).toContain("High Jewelry Reference Gate");
    expect(manifesto).toContain("Public structure policy");
    expect(manifesto).toContain("Local implementation preference");
    expect(manifesto).toContain(
      "Hero sections should stay clean and selective",
    );
    expect(manifesto).toContain("limited number of elements");
    expect(manifesto).toContain("Mobile is not compressed desktop");
    expect(manifesto).toContain("Service supports trust");

    expect(publicGate).toContain("docs/ELYSIA_DESIGN_MANIFESTO.md");
    expect(publicGate).toContain("orientative design authority after");
    expect(publicGate).toContain("non-blocking");
    expect(publicGate).toContain(
      "does not approve a change that fails the High Jewelry Reference Gate",
    );

    expect(fullBenchmark).toContain("docs/ELYSIA_DESIGN_MANIFESTO.md");
    expect(fullBenchmark).toContain("orientative, non-blocking quality");
    expect(fullBenchmark).toContain("layer. It does not add a threshold");
    expect(fullBenchmark).toContain("does not add a threshold");

    expect(engineeringConventions).toContain("docs/ELYSIA_DESIGN_MANIFESTO.md");
    expect(engineeringConventions).toContain("orientative and non-blocking");
  });

  it("applies the clean hero principle to the public homepage", () => {
    const home = read("src/app/page.tsx");
    const css = read("src/styles/globals.css");

    expect(home).toContain('data-testid="cinematic-page-hero"');
    expect(home).toContain('data-testid="home-hero-copy"');
    expect(home).toContain('data-testid="home-hero-primary-cta"');
    expect(home).toContain('data-testid="home-commerce-entry-links"');
    expect(home).toContain("const homeCommerceEntryLinks = [");
    expect(home).not.toContain("homeHeroCampaignLinks");
    expect(home).not.toContain('data-testid="home-hero-campaign-links"');
    expect(home).not.toContain("home-hero-campaign-link");
    expect(home).not.toContain('data-testid="home-hero-secondary-cta"');
    expect(css).toContain(".home-commerce-entry-links");
    expect(css).not.toContain(".home-hero-campaign-links");
  });
});

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}
