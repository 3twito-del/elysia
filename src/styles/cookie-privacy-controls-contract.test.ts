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
    const banner = read("src/components/cookie-consent-banner.tsx");

    expect(panel).toContain('data-testid="cookie-preferences-panel"');
    expect(panel).toContain('id="cookie-preferences-status"');
    expect(panel).toContain('role="status"');
    expect(panel).toContain('aria-live="polite"');
    expect(panel).toContain('aria-describedby="cookie-preferences-status"');
    expect(panel).toContain('aria-pressed={consentValue === "essential"}');
    expect(panel).toContain('aria-pressed={consentValue === "all"}');
    expect(panel.match(/type="button"/g)).toHaveLength(2);
    expect(panel).toContain('onClick={() => chooseConsent("essential")}');
    expect(panel).toContain('onClick={() => chooseConsent("all")}');
    expect(banner.match(/type="button"/g)).toHaveLength(2);
    expect(banner).toContain('aria-describedby="cookie-consent-summary"');
    expect(banner).toContain('onClick={() => chooseConsent("essential")}');
    expect(banner).toContain('onClick={() => chooseConsent("all")}');

    expect(privacyPage).toContain("<CookiePreferencesPanel />");
    expect(privacyPage).toContain(
      'href="/service?topic=accessibility-privacy"',
    );
  });

  it("documents local-only guest storage and consent-gated measurement", () => {
    const privacyPage = read("src/app/privacy/page.tsx");
    const guestWishlist = read("src/lib/guest-wishlist.ts");
    const pwaOffline = read("src/lib/pwa-offline.ts");

    expect(guestWishlist).toContain(
      'GUEST_WISHLIST_STORAGE_KEY = "elysia_guest_wishlist"',
    );
    expect(pwaOffline).toContain('deviceStorageKey = "elysia_pwa_device_id"');
    expect(privacyPage).toContain('data-testid="privacy-local-storage-notice"');
    expect(privacyPage).toContain("מועדפים של אורחים");
    expect(privacyPage).toContain("פריטים שנצפו לאחרונה");
    expect(privacyPage).toContain("מזהה מכשיר PWA");
    expect(privacyPage).toContain("בבאנר");
    expect(privacyPage).toContain("עוגיות ובהעדפות");
    expect(privacyPage).toContain("העוגיות בעמוד זה");
  });

  it("keeps the PWA device id local and documented as browser-controlled", () => {
    const privacyPage = read("src/app/privacy/page.tsx");
    const pwaOffline = read("src/lib/pwa-offline.ts");
    const noticeStart = privacyPage.indexOf(
      'data-testid="privacy-local-storage-notice"',
    );
    const localStorageNotice = privacyPage.slice(
      noticeStart,
      privacyPage.indexOf("</section>", noticeStart),
    );

    expect(noticeStart).toBeGreaterThan(-1);
    expect(pwaOffline).toContain(
      'const deviceStorageKey = "elysia_pwa_device_id"',
    );
    expect(pwaOffline).toContain(
      "writeLocalStorage(deviceStorageKey, deviceId)",
    );
    expect(pwaOffline).toContain('await putMeta("deviceId", deviceId)');
    expect(pwaOffline).toContain("deviceId: await getPwaDeviceId()");
    expect(pwaOffline).not.toContain('fetch("/api/pwa/device');
    expect(localStorageNotice).toContain("privacy-local-storage");
    expect(localStorageNotice).toContain("PWA");
  });
});

const root = process.cwd();

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}
