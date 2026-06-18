import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("content route service recovery links", () => {
  it("keeps the I-027 benchmark gate attached to content route recovery", () => {
    const benchmark = read(
      "docs/qa/faq-content-service-recovery-links-benchmark.md",
    );

    expect(benchmark).toContain("`Backlog Item`: I-027");
    expect(benchmark).toContain("`Weighted Score`: 16.5");
    expect(benchmark).toContain("`Decision`: Supported");
    expect(benchmark).toContain(
      "Recovery links point to existing `/service` topic routes",
    );
  });

  it("routes FAQ and legal recovery to supported service topics", () => {
    const faq = read("src/app/faq/page.tsx");
    const terms = read("src/app/terms/page.tsx");

    expect(faq).toContain('data-testid="faq-service-recovery-link"');
    expect(faq).toContain('href="/service?topic=general"');
    expect(terms).toContain('data-testid="terms-service-recovery-link"');
    expect(terms).toContain('href="/service?topic=order"');
  });

  it("routes privacy and accessibility recovery through the shared service topic", () => {
    const privacy = read("src/app/privacy/page.tsx");
    const accessibility = read("src/app/accessibility/page.tsx");

    expect(privacy).toContain('data-testid="privacy-service-recovery-link"');
    expect(privacy).toContain('href="/service?topic=accessibility-privacy"');
    expect(accessibility).toContain(
      'data-testid="accessibility-service-recovery-link"',
    );
    expect(accessibility).toContain(
      'href="/service?topic=accessibility-privacy"',
    );
  });

  it("keeps existing contact cards and avoids unsupported service channels", () => {
    const pages = [
      read("src/app/faq/page.tsx"),
      read("src/app/privacy/page.tsx"),
      read("src/app/terms/page.tsx"),
      read("src/app/accessibility/page.tsx"),
    ];

    for (const source of pages) {
      expect(source).toContain("mailto:");
      expect(source).toContain("phoneHref");
      expect(source).not.toContain("wa.me");
      expect(source).not.toContain("/stylist");
      expect(source).not.toContain('href="#');
    }
  });
});

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}
