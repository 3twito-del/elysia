import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("account order timeline clarity", () => {
  it("adds local order timeline cues without changing supplier mirror actions", () => {
    const accountPage = read("src/app/account/page.tsx");
    const orderPage = read("src/app/account/orders/[id]/page.tsx");

    expect(accountPage).toContain("createAccountOrderTimeline");
    expect(accountPage).toContain("getCurrentOrderTimelineEvent");
    expect(accountPage).toContain('data-testid="account-local-order-timeline"');
    expect(accountPage).toContain(
      'data-testid="account-shopify-mirror-order-timeline"',
    );
    expect(orderPage).toContain("createAccountOrderTimeline");
    expect(orderPage).toContain('data-testid="order-status-timeline"');
    expect(orderPage).toContain("formatOptionalHebrewDateTime");
    expect(accountPage).toContain('data-testid="account-shopify-service-link"');
  });

  it("records high-jewelry benchmark support for account order timelines", () => {
    const benchmark = read(
      "docs/qa/account-order-timeline-clarity-benchmark.md",
    );

    expect(benchmark).toContain("Weighted Score`: 12.0");
    expect(benchmark).toContain("Decision`: Supported");
    expect(benchmark).toContain("Boucheron");
    expect(benchmark).toContain("Chopard");
  });
});

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}
