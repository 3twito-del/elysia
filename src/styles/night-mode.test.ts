import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("storefront night mode", () => {
  it("keeps the dark palette warm and brand-coherent", () => {
    const css = read("src/styles/globals.css");

    expect(css).toContain("color-scheme: light;");
    expect(css).toContain("color-scheme: dark;");
    expect(css).toContain("--background: #161210;");
    expect(css).toContain("--foreground: #f3ede6;");
    expect(css).toContain("--muted-foreground: #b5aa9e;");
    expect(css).toContain(
      "--elysia-focus: color-mix(in srgb, var(--brand-champagne) 65%, transparent);",
    );
    // The legacy teal dark palette must not return.
    expect(css).not.toContain("oklch(0.15 0.025 195)");
    expect(css).not.toContain("oklch(0.78 0.05 190)");
  });

  it("re-homes hardcoded light storefront surfaces in dark mode", () => {
    const css = read("src/styles/globals.css");

    expect(css).toContain(".dark .storefront-home-page");
    expect(css).toContain('.dark .site-header[data-header-state="solid"]');
    expect(css).toContain(".dark .product-card-status-badge");
    expect(css).toContain(".dark .product-gallery-viewer-dialog");
    expect(css).toContain(".dark .motion-sticky-purchase");
    expect(css).toContain(".dark .storefront-final-panel");
  });

  it("applies the stored preference before paint and keeps admin light-only", () => {
    const layout = read("src/app/layout.tsx");
    const preference = read("src/components/theme-preference.ts");

    expect(layout).toContain("suppressHydrationWarning");
    expect(layout).toContain('localStorage.getItem("elysia.theme-preference")');
    expect(layout).toContain('location.pathname.indexOf("/admin")!==0');
    expect(layout).toContain("<ThemeSync />");
    expect(preference).toContain(
      'window.location.pathname.startsWith("/admin")',
    );
    expect(preference).toContain('root.classList.toggle("dark", isDark)');
    expect(preference).toContain('meta[name="theme-color"]');
  });

  it("exposes an accessible toggle inside the mobile nav drawer", () => {
    const header = read("src/components/site-header.tsx");
    const mobileNav = read("src/components/mobile-nav.tsx");
    const toggle = read("src/components/theme-toggle.tsx");

    expect(header).not.toContain("ThemeToggle");
    expect(mobileNav).toContain("<ThemeToggle");
    expect(mobileNav).toContain("mobile-nav-theme-footer");
    expect(mobileNav).toContain("mobile-nav-scroll-region");
    expect(toggle).toContain('role="switch"');
    expect(toggle).toContain("aria-checked={isDark}");
    expect(toggle).toContain("mobile-nav-theme-switch");
    expect(toggle).toContain("useSyncExternalStore");
  });
});

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}
