import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("cookie and privacy controls contract", () => {
  it("keeps the cookie banner described and inside floating collision rules", () => {
    const banner = read("src/components/cookie-consent-banner.tsx");

    expect(banner).toContain('aria-describedby="cookie-consent-summary"');
    expect(banner).toContain('id="cookie-consent-summary"');
    expect(banner).toContain('data-cookie-consent-banner="true"');
    expect(banner).toContain('data-public-floating-avoid="true"');
    expect(banner).toContain('aria-describedby="cookie-consent-summary"');
  });

  it("keeps privacy cookie preferences state-linked and keyboard-friendly", () => {
    const panel = read("src/components/cookie-preferences-panel.tsx");
    const privacyPage = read("src/app/privacy/page.tsx");

    expect(panel).toContain('data-testid="cookie-preferences-panel"');
    expect(panel).toContain('id="cookie-preferences-status"');
    expect(panel).toContain('role="status"');
    expect(panel).toContain('aria-live="polite"');
    expect(panel).toContain('aria-describedby="cookie-preferences-status"');
    expect(panel).toContain('aria-pressed={consentValue === "essential"}');
    expect(panel).toContain('aria-pressed={consentValue === "all"}');

    expect(privacyPage).toContain("<CookiePreferencesPanel />");
    expect(privacyPage).toContain(
      'href="/service?topic=accessibility-privacy"',
    );
  });
});

const root = process.cwd();

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}
