import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

const servicePage = read("src/app/service/page.tsx");
const faqPage = read("src/app/faq/page.tsx");
const productPage = read("src/app/product/[slug]/page.tsx");
const contentPageShell = read("src/components/content-page-shell.tsx");
const termsPage = read("src/app/terms/page.tsx");
const privacyPage = read("src/app/privacy/page.tsx");
const warrantyPage = read("src/app/warranty/page.tsx");
const shippingReturnsPage = read("src/app/shipping-returns/page.tsx");
const sizeGuideTool = read(
  "src/app/size-guide/_components/size-guide-tool.tsx",
);
const jewelleryCarePage = read("src/app/jewellery-care/page.tsx");
const blogListPage = read("src/app/blog/page.tsx");
const blogPostPage = read("src/app/blog/[slug]/page.tsx");
const notFoundState = read("src/components/not-found-state.tsx");
const productNotFound = read("src/app/product/[slug]/not-found.tsx");
const categoryNotFound = read("src/app/category/[slug]/not-found.tsx");
const css = read("src/styles/globals.css");

describe("service + content + legal design pass (owner-selected DP 59-66)", () => {
  it("keeps the service page's contact channels and response-time claims untouched (owner verification blocker, not a code change)", () => {
    expect(servicePage).toContain("עד 24 שעות, בימי עסקים");
    expect(servicePage).toContain('data-testid="service-response-time-note"');
  });

  it("gives FAQ answers a gentle reveal instead of an instant pop, in both the FAQ page and the PDP FAQ", () => {
    expect(faqPage).toContain('className="faq-answer-reveal text-muted-foreground mt-3 leading-8"');
    expect(productPage).toContain(
      'className="faq-answer-reveal text-muted-foreground mt-2 text-sm leading-6"',
    );
    expect(css).toContain(".faq-answer-reveal {");
  });

  it("gives long-form legal pages an opt-in sticky table of contents on desktop", () => {
    expect(contentPageShell).toContain("tocSections?:");
    expect(contentPageShell).toContain('data-testid="content-page-toc"');
    expect(contentPageShell).toContain("hidden lg:sticky lg:top-24");
    expect(termsPage).toContain("tocSections={termsSections.map(");
    expect(privacyPage).toContain("tocSections={privacySections.map(");
    expect(warrantyPage).toContain("tocSections={warrantySections.map(");
    expect(shippingReturnsPage).toContain(
      "tocSections={shippingReturnSections.map(",
    );
  });

  it("keeps verified last-updated dates on legal pages (audit: terms/privacy/faq/accessibility already wired); shipping-returns and warranty stay without one pending an owner-verified date", () => {
    expect(termsPage).toContain("legalLastUpdated.terms");
    expect(privacyPage).toContain("legalLastUpdated.privacy");
    expect(warrantyPage).not.toContain("legalLastUpdated");
    expect(shippingReturnsPage).not.toContain("legalLastUpdated");
  });

  it("highlights size-guide table rows on hover", () => {
    expect(sizeGuideTool).toContain(
      "hover:border-foreground/50 hover:bg-muted/60 grid gap-2 rounded-md border border-[var(--glass-border)] px-3 py-2 transition-colors",
    );
  });

  it("groups jewellery-care sections by material with a distinct icon per section", () => {
    expect(jewelleryCarePage).toContain('title: "כסף 925"');
    expect(jewelleryCarePage).toContain('title: "ציפוי זהב ורוז גולד"');
    expect(jewelleryCarePage).toContain('title: "פנינים וזירקון"');
    expect(jewelleryCarePage).toContain("iconFor={(index) =>");
  });

  it("uses the same header-image aspect ratio on the blog list and blog post pages, alongside reading time on both", () => {
    expect(blogListPage).toContain("aspect-[16/9]");
    expect(blogListPage).not.toContain("aspect-[16/10]");
    expect(blogPostPage).toContain("aspect-[16/9]");
    expect(blogListPage).toContain("{post.readingMinutes} דק");
    expect(blogPostPage).toContain("{post.readingMinutes} דק");
  });

  it("unifies 404/recovery pages behind one shared component with a single catalog CTA, and adds the missing global 404", () => {
    expect(notFoundState).toContain("export function NotFoundState(");
    expect(notFoundState).toContain('href="/search"');
    expect(notFoundState).not.toContain('href="/"');
    expect(productNotFound).toContain("<NotFoundState");
    expect(categoryNotFound).toContain("<NotFoundState");
    expect(existsSync(path.join(root, "src/app/not-found.tsx"))).toBe(true);
    const globalNotFound = read("src/app/not-found.tsx");
    expect(globalNotFound).toContain("<NotFoundState");
  });
});
