import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("public floating chrome contract", () => {
  it("keeps the accessibility trigger available while sticky commerce bars are visible", () => {
    const css = read("src/styles/globals.css");

    expect(css).toContain(
      'html[data-public-floating-bar-visible="true"]\n  .public-floating-trigger:not([data-accessibility-widget-trigger="true"])',
    );
    expect(css).toContain(
      'html[data-cookie-banner-open="true"]\n  .public-floating-trigger:not([data-accessibility-widget-trigger="true"])',
    );
    expect(css).toContain(
      'html[data-public-floating-collision="true"]\n  .public-floating-trigger:not([data-accessibility-widget-trigger="true"])',
    );
    expect(css).not.toContain(
      '.public-floating-trigger[data-accessibility-widget-trigger="true"]',
    );
    expect(css).not.toContain(
      "top: calc(var(--site-header-height) + 1rem + env(safe-area-inset-top))",
    );
    expect(css).toContain(
      'html[data-public-floating-bar-visible="true"] .public-motion-content',
    );
    expect(css).toContain(
      'html[data-cookie-banner-placement="top"] .public-motion-content',
    );
    expect(css).not.toContain(
      'html[data-cookie-banner-open="true"] .public-motion-content',
    );
    expect(css).not.toContain(
      'html[data-cookie-banner-open="true"] .home-hero-copy',
    );
    expect(css).not.toContain("var(--public-bottom-safe-offset, 0px)");
    expect(css).toContain(
      "[data-icon-tooltip]:not(.fixed):not(.absolute):not(.sticky)",
    );
    expect(css).not.toContain("[data-icon-tooltip] {\n  position: relative;");
  });

  it("renders the accessibility trigger as a neutral RTL bottom action", () => {
    const widget = read("src/components/accessibility-widget.tsx");

    expect(widget).toContain('data-accessibility-widget-trigger="true"');
    expect(widget).toContain("fixed right-3");
    expect(widget).toContain("var(--public-floating-bar-offset,0.75rem)");
    expect(widget).toContain("usesCheckoutTopPlacement");
    expect(widget).toContain("--floating-stack-top");
    expect(widget).toContain("top-[calc(var(--site-header-height)");
    expect(widget).toContain('data-icon-tooltip="תפריט נגישות"');
    expect(widget).toContain("hideFloatingTriggerForPage");
    expect(widget).toContain("הסתרת הכפתור בדף זה");
    expect(widget).toContain("left-auto");
    expect(widget).toContain('variant="outline"');
    expect(widget).toContain("bg-background");
    expect(widget).toContain("text-foreground");
    expect(widget).toContain("shadow-none");
    expect(widget).toContain("focus-visible:ring-0");
    expect(widget).toContain("focus-visible:ring-transparent");
    expect(widget).toContain("focus-visible:outline-foreground/50");
    expect(widget).toContain("focus-visible:outline-solid");
    expect(widget).not.toContain("fixed bottom");
    expect(widget).not.toContain("left-4");
    expect(widget).not.toContain("var(--public-bottom-safe-offset");
    expect(widget).not.toContain('variant="default"');
  });

  it("does not server-render the cookie banner before consent storage is known", () => {
    const hook = read("src/lib/use-cookie-consent.ts");
    const banner = read("src/components/cookie-consent-banner.tsx");

    expect(hook).toContain("export type CookieConsentSnapshot");
    expect(hook).toContain("return undefined;");
    expect(banner).toContain("consentValue === undefined");
    expect(banner).toContain('data-cookie-consent-banner="true"');
  });

  it("keeps the cookie banner fixed without reserving document space", () => {
    const banner = read("src/components/cookie-consent-banner.tsx");

    expect(banner).toContain("--floating-stack-bottom");
    expect(banner).toContain("--floating-stack-top");
    expect(banner).toContain("usesCheckoutTopPlacement");
    expect(banner).toContain("cookieBannerPlacement");
    expect(banner).toContain('data-public-floating-avoid="true"');
    expect(banner).toContain(
      'root.style.setProperty("--floating-stack-bottom", `${height + 16}px`)',
    );
    expect(banner).toContain(
      'root.style.setProperty("--floating-stack-top", `${height + 16}px`)',
    );
    expect(banner).not.toContain("--public-bottom-safe-offset");
    expect(banner).not.toContain("--public-cookie-top-offset");
    expect(countOccurrences(banner, "--floating-stack-bottom")).toBe(5);
    expect(countOccurrences(banner, "--floating-stack-top")).toBe(5);
    expect(banner).toContain("sm:w-[min(calc(100vw-2rem),20rem)]");
    expect(banner).toContain(
      "bottom-[calc(0.75rem+env(safe-area-inset-bottom))]",
    );
    expect(banner).toContain(
      "top-[calc(var(--site-header-height)+0.75rem+env(safe-area-inset-top))]",
    );
    expect(banner).not.toContain("fixed inset-x-0 bottom-0");
  });

  it("does not reserve mobile purchase or checkout space before sticky bars exist", () => {
    const productPage = read("src/app/product/[slug]/page.tsx");
    const checkoutForm = read(
      "src/app/checkout/_components/cart-checkout-form.tsx",
    );

    expect(productPage).not.toContain("pb-24");
    expect(productPage).not.toContain("md:pb-0");
    expect(checkoutForm).not.toContain("pb-28");
    expect(checkoutForm).toContain('data-public-floating-bar="true"');
  });

  it("observes both mobile and desktop floating corners for collisions", () => {
    const provider = read("src/components/public-motion-provider.tsx");

    expect(provider).toContain("const floatingGuardAreas = [");
    expect(provider).toContain("left: 0");
    expect(provider).toContain("left: window.innerWidth - guardSize");
  });

  it("keeps product sticky purchase hidden until the main CTA has left view", () => {
    const purchasePanel = read(
      "src/app/product/[slug]/_components/product-purchase-panel.tsx",
    );

    expect(purchasePanel).toContain("setShowStickyBar(rect.bottom <= 0)");
    expect(purchasePanel).toContain('rootMargin: "0px"');
    expect(purchasePanel).toContain('data-public-floating-avoid="true"');
    expect(purchasePanel).toContain(
      'data-testid="product-sticky-purchase-bar"',
    );
    expect(purchasePanel).toContain(
      'data-testid="product-sticky-variant-state"',
    );
    expect(purchasePanel).toContain(
      'data-public-floating-bar-kind="product-purchase"',
    );
  });

  it("keeps mobile checkout summary hidden until progress leaves view", () => {
    const checkoutForm = read(
      "src/app/checkout/_components/cart-checkout-form.tsx",
    );

    expect(checkoutForm).toContain("checkoutProgressRef");
    expect(checkoutForm).toContain("showMobileCheckoutBar");
    expect(checkoutForm).toContain(
      "setShowMobileCheckoutBar(rect.bottom <= 0)",
    );
    expect(checkoutForm).toContain('data-testid="checkout-progress-steps"');
    expect(checkoutForm).toContain("ref={checkoutProgressRef}");
    expect(checkoutForm).toContain(
      "canRenderStickyBar && hasOwnItems && showMobileCheckoutBar",
    );
    expect(checkoutForm).toContain(
      'data-public-floating-bar-kind="checkout-summary"',
    );
  });
});

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function countOccurrences(source: string, pattern: string) {
  return source.split(pattern).length - 1;
}
