import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("account dashboard privacy shortcut clarity", () => {
  it("keeps benchmark support evidence available", () => {
    const benchmark = read(
      "docs/qa/account-dashboard-privacy-shortcut-clarity-benchmark.md",
    );

    expect(benchmark).toContain("I-036");
    expect(benchmark).toContain("Weighted Score`: 12.0");
    expect(benchmark).toContain("Decision`: Supported");
    expect(benchmark).toContain("Cartier");
    expect(benchmark).toContain("Tiffany");
  });

  it("keeps privacy shortcut anchored and privacy actions grouped", () => {
    const accountPage = read("src/app/account/page.tsx");
    const privacyActions = read(
      "src/app/account/_components/customer-privacy-actions.tsx",
    );

    expect(accountPage).toContain('testId: "account-recovery-privacy-help"');
    expect(accountPage).toContain('href: "#account-privacy"');
    expect(accountPage).toContain('id="account-privacy"');
    expect(accountPage).toContain("<CustomerPrivacyActions />");

    expect(privacyActions).toContain(
      'data-testid="account-privacy-shortcut-context"',
    );
    expect(privacyActions).toContain('href="/account/privacy/export"');
    expect(privacyActions).toContain("DELETE_CONFIRMATION_VALUE");
    expect(privacyActions).toContain("deleteCustomerDataAction");
    expect(
      indexOf(privacyActions, 'data-testid="account-privacy-shortcut-context"'),
    ).toBeLessThan(indexOf(privacyActions, 'href="/account/privacy/export"'));
    expect(
      indexOf(privacyActions, 'href="/account/privacy/export"'),
    ).toBeLessThan(indexOf(privacyActions, 'name="confirmation"'));
  });

  it("does not add unsupported self-service account mutations", () => {
    const privacyActions = read(
      "src/app/account/_components/customer-privacy-actions.tsx",
    );

    expect(privacyActions).not.toContain("/checkout");
    expect(privacyActions).not.toContain("/admin");
    expect(privacyActions).not.toContain("shopify");
  });
});

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function indexOf(source: string, pattern: string) {
  const index = source.indexOf(pattern);

  expect(index, pattern).toBeGreaterThanOrEqual(0);

  return index;
}
