import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("content route service recovery links", () => {
  it("keeps the I-027 benchmark gate attached to content route recovery", () => {
    const benchmark = read(
      "docs/QA_EVIDENCE.md",
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

    // Recovery targets are passed as props into the shared LegalContactSection,
    // so assert on the topic/testId values rather than raw attribute syntax.
    expect(faq).toContain("faq-service-recovery-link");
    expect(faq).toContain("/service?topic=general");
    expect(terms).toContain("terms-service-recovery-link");
    expect(terms).toContain("/service?topic=order");
  });

  it("routes privacy and accessibility recovery through the shared service topic", () => {
    const privacy = read("src/app/privacy/page.tsx");
    const accessibility = read("src/app/accessibility/page.tsx");

    expect(privacy).toContain("privacy-service-recovery-link");
    expect(privacy).toContain("/service?topic=accessibility-privacy");
    expect(accessibility).toContain("accessibility-service-recovery-link");
    expect(accessibility).toContain("/service?topic=accessibility-privacy");
  });

  it("keeps existing contact cards and avoids unsupported service channels", () => {
    // The email/phone cards now live in the shared contact section component.
    const contactSection = read("src/components/legal-contact-section.tsx");
    expect(contactSection).toContain("mailto:");
    expect(contactSection).toContain("phoneHref");

    const pages = [
      read("src/app/faq/page.tsx"),
      read("src/app/privacy/page.tsx"),
      read("src/app/terms/page.tsx"),
      read("src/app/accessibility/page.tsx"),
    ];

    for (const source of pages) {
      expect(source).toContain("<LegalContactSection");
      expect(source).not.toContain("wa.me");
      expect(source).not.toContain("/stylist");
      expect(source).not.toContain('href="#');
    }
  });
});

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}
