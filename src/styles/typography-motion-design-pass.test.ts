import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

const css = read("src/styles/globals.css");
const analyticsLiveConsole = read(
  "src/app/admin/insights/live/_components/analytics-live-console.tsx",
);
const blogMarkdown = read("src/components/blog-markdown.tsx");
const button = read("src/components/ui/button.tsx");
const faqPage = read("src/app/faq/page.tsx");
const productPage = read("src/app/product/[slug]/page.tsx");
const layout = read("src/app/layout.tsx");
const pageTransitionFade = read("src/components/page-transition-fade.tsx");

describe("typography + motion design pass (owner-selected DP 78-89)", () => {
  it("routes every price through the shared thousands-grouped formatter, including an admin spot that bypassed it", () => {
    expect(analyticsLiveConsole).toContain(
      'import { formatPrice } from "~/lib/format";',
    );
    expect(analyticsLiveConsole).toContain(
      "${event.order.orderNumber} · ${formatPrice(event.order.total)}",
    );
    expect(analyticsLiveConsole).not.toContain("₪${event.order.total}");
  });

  it("gives blog markdown a defined emphasis and blockquote treatment instead of raw browser defaults", () => {
    expect(blogMarkdown).toContain("blockquote({ children }) {");
    expect(blogMarkdown).toContain("border-s-2 border-[var(--glass-border-strong)]");
    expect(blogMarkdown).toContain("strong({ children }) {");
  });

  it("keeps public letter-spacing normal-only (audit: already enforced by an existing sitewide guardrail test)", () => {
    expect(button).not.toMatch(/\btracking-(?!normal\b)/);
  });

  it("applies tabular-nums to numerals sitewide so prices and tables never jitter", () => {
    expect(css).toContain("font-variant-numeric: tabular-nums;");
  });

  it("gives buttons a subtle press-down feel that respects the global reduced-motion override", () => {
    expect(button).toContain("active:scale-[0.98]");
    expect(button).toContain("transition-[background-color,border-color,color,box-shadow,outline-color,opacity,scale]");
  });

  it("gives the main content area a subtle entrance fade on route change", () => {
    expect(layout).toContain("<PageTransitionFade>{children}</PageTransitionFade>");
    expect(pageTransitionFade).toContain('key={pathname}');
    expect(css).toContain(".page-transition-fade {");
    expect(css).toContain("@keyframes page-transition-fade-in {");
  });

  it("keeps the added-to-cart message docked to the purchase button, not a distant toast (audit: already correct)", () => {
    expect(css).toContain(".motion-status-pop {");
  });

  it("unifies the FAQ accordion chevron curve with the shared --ease-standard token used by sheets", () => {
    expect(faqPage).toContain("ease-[var(--ease-standard)] group-open:rotate-180");
    expect(productPage).toContain(
      "ease-[var(--ease-standard)] group-open:rotate-180",
    );
    expect(css).toContain("--ease-standard: cubic-bezier(0.2, 0, 0, 1);");
  });
});
