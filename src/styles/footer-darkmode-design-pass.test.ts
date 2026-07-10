import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

const css = read("src/styles/globals.css");
const siteFooter = read("src/components/site-footer.tsx");
const badge = read("src/components/ui/badge.tsx");
const skeleton = read("src/components/ui/skeleton.tsx");
const newsletterForm = read("src/components/newsletter-form.tsx");
const homePage = read("src/app/page.tsx");

describe("footer + dark-mode design pass (owner-selected DP 67-77)", () => {
  it("gives desktop footer columns a subtle separator at both the 2-col and 4-col breakpoints", () => {
    expect(css).toContain(
      "@media (min-width: 768px) and (max-width: 1279px) {",
    );
    expect(css).toContain(".footer-nav-disclosure:nth-child(2n)");
    expect(css).toContain(".footer-nav-disclosure:not(:first-child)");
  });

  it("keeps the bottom legal row font-size uniformly compact across mobile and desktop", () => {
    expect(css).toContain(
      ".site-footer-legal {\n    gap: 1.25rem;\n    font-size: 0.8rem;\n  }",
    );
    expect(css).toContain(
      ".site-footer-legal {\n    margin-top: 4.5rem;\n    border-top: 1px solid var(--glass-border);\n    padding-top: 2.75rem;\n    font-size: 0.8rem;\n  }",
    );
  });

  it("gives the footer social icons a bronze hover accent instead of a neutral ink tint, with no color fill", () => {
    expect(css).toContain(
      ".footer-social-link:hover,\n.footer-social-link:focus-visible {\n  border-color: var(--glass-focus);",
    );
  });

  it("makes the trust-layer icon/text alignment explicit instead of relying on default grid stretch", () => {
    expect(siteFooter).toContain(
      "grid-cols-[auto_minmax(0,1fr)] items-start gap-3",
    );
  });

  it("keeps the newsletter form a single shared, styled component across footer and home (audit: already unified)", () => {
    expect(newsletterForm).toContain('variant?: "default" | "footer"');
    expect(homePage).toContain("<NewsletterForm />");
  });

  it("keeps badges and skeletons on theme-aware tokens instead of hardcoded colors (audit: already correct)", () => {
    expect(badge).not.toMatch(/#[0-9a-fA-F]{3,6}/);
    expect(skeleton).toContain("bg-muted");
  });

  it("gives the PDP gallery frame a subtle dark-mode border so it doesn't float on the espresso background", () => {
    expect(css).toContain(
      ".dark .brand-gallery-frame {\n  border: 1px solid var(--glass-border);\n}",
    );
  });

  it("unifies glass-inset border-color on bespoke surfaces to the shared token instead of near-duplicate hardcoded values", () => {
    expect(css).toContain(
      ".footer-trust-link .glass-inset {\n  border-color: var(--glass-border);",
    );
    expect(css).toContain(
      ".product-purchase-surface .glass-inset {\n  border-color: var(--glass-border);",
    );
    expect(css).toContain(
      ".dark .footer-trust-link .glass-inset {\n  border-color: var(--glass-border);",
    );
    expect(css).toContain(
      ".dark .product-purchase-surface .glass-inset {\n  border-color: var(--glass-border);",
    );
  });

  it("gives the about-page trust-card hover a shadow that's actually visible against the dark surface", () => {
    expect(css).toContain(
      ".dark .about-trust-card:hover {\n  box-shadow: 0 18px 40px -28px oklch(0 0 0 / 55%);\n}",
    );
  });

  it("keeps the storefront hero scrim theme-independent (audit: it darkens photo/video content for text contrast, not site chrome, so light/dark parity doesn't apply)", () => {
    expect(css).toContain(".storefront-hero-scrim {");
    expect(css).not.toContain(".dark .storefront-hero-scrim {");
  });
});
