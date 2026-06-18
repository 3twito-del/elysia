import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("account recovery shortcuts", () => {
  it("keeps account recovery shortcuts compact and service-backed", () => {
    const accountPage = read("src/app/account/page.tsx");

    expect(accountPage).toContain('data-testid="account-recovery-shortcuts"');
    expect(accountPage).toContain('testId: "account-recovery-order-help"');
    expect(accountPage).toContain('testId: "account-recovery-return-help"');
    expect(accountPage).toContain('testId: "account-recovery-supplier-help"');
    expect(accountPage).toContain('testId: "account-recovery-privacy-help"');
    expect(accountPage).toContain('data-testid="account-shopify-service-link"');
    expect(accountPage).toContain("createAccountServiceHref");
    expect(accountPage).toContain('href: "#account-privacy"');
  });

  it("keeps order detail recovery routed through service prefill", () => {
    const orderPage = read("src/app/account/orders/[id]/page.tsx");

    expect(orderPage).toContain('data-testid="order-recovery-shortcuts"');
    expect(orderPage).toContain('topic: "order"');
    expect(orderPage).toContain('topic: "returns"');
    expect(orderPage).toContain("createAccountServiceHref");
  });

  it("lets service page and form accept account recovery defaults", () => {
    const servicePage = read("src/app/service/page.tsx");
    const serviceForm = read(
      "src/app/service/_components/service-request-form.tsx",
    );

    expect(servicePage).toContain(
      "const defaultTopicSlug = firstParam(query.topic)",
    );
    expect(servicePage).toContain(
      "const defaultOrderNumber = firstParam(query.orderNumber)",
    );
    expect(servicePage).toContain(
      "const defaultMessage = firstParam(query.message)",
    );
    expect(serviceForm).toContain("defaultTopicSlug");
    expect(serviceForm).toContain("defaultOrderNumber");
    expect(serviceForm).toContain("defaultMessage");
    expect(serviceForm).toContain("const initialSelectedTopic = topics.some");
    expect(serviceForm).toContain("(topic) => topic.slug === defaultTopicSlug");
    expect(serviceForm).toContain("useState(initialSelectedTopic)");
  });

  it("keeps benchmark support evidence available after backlog replacement", () => {
    const benchmark = read(
      "docs/qa/account-recovery-service-shortcuts-benchmark.md",
    );

    expect(benchmark).toContain("Weighted Score`: 12.0");
    expect(benchmark).toContain("Decision`: Supported");
    expect(benchmark).toContain("Cartier");
    expect(benchmark).toContain("Tiffany");
  });
});

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}
