import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const SOURCE_ROOTS = ["src/app", "src/components"] as const;

function listTsxFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const absolutePath = path.join(directory, entry);
    const stats = statSync(absolutePath);

    if (stats.isDirectory()) return listTsxFiles(absolutePath);
    if (!absolutePath.endsWith(".tsx")) return [];

    return [absolutePath];
  });
}

function getLineNumber(source: string, index: number) {
  return source.slice(0, index).split("\n").length;
}

describe("accessibility guardrails", () => {
  it("keeps shared focus ring tokens visible across themes", () => {
    const css = readFileSync(
      path.join(process.cwd(), "src/styles/globals.css"),
      "utf8",
    );

    expect(css).toContain("--brand-gold-muted: #b49a6a;");
    expect(css).toContain("--elysia-focus: rgb(180 154 106 / 26%);");
    expect(css).toContain("--elysia-focus: rgb(226 232 236 / 42%);");
    expect(css).toContain("--elysia-focus: oklch(0 0 0 / 52%);");
    expect(css).toContain("--glass-focus: var(--elysia-focus);");
  });

  it("keeps the skip link as the first keyboard recovery target", () => {
    const layout = readFileSync(
      path.join(process.cwd(), "src/app/layout.tsx"),
      "utf8",
    );
    const css = readFileSync(
      path.join(process.cwd(), "src/styles/globals.css"),
      "utf8",
    );
    const providerIndex = layout.indexOf("<PwaProvider>");
    const skipLinkIndex = layout.indexOf('className="skip-link"');
    const mainTargetIndex = layout.indexOf('id="main-content"');

    expect(providerIndex).toBeGreaterThan(-1);
    expect(skipLinkIndex).toBeGreaterThan(providerIndex);
    expect(skipLinkIndex).toBeLessThan(mainTargetIndex);
    expect(layout).toContain('href="#main-content"');
    expect(layout).toContain('id="main-content"');
    expect(layout).toContain("tabIndex={-1}");
    expect(css).toContain(".skip-link:focus,\n.skip-link:focus-visible");
    expect(css).toContain("transform: translateY(0);");
    expect(css).toContain("outline: 3px solid var(--glass-focus);");
    expect(css).toContain("#main-content:focus");
    expect(css).toContain("outline: none;");
  });

  it("keeps focus-visible ring tokens on core interactive primitives", () => {
    const focusSources = [
      "src/components/ui/button.tsx",
      "src/components/ui/input.tsx",
      "src/components/ui/textarea.tsx",
      "src/components/ui/select.tsx",
      "src/components/ui/sheet.tsx",
      "src/components/ui/dialog.tsx",
      "src/components/site-header.tsx",
      "src/components/mobile-nav.tsx",
      "src/styles/globals.css",
    ];
    const offenders = focusSources.filter((file) => {
      const source = readFileSync(path.join(process.cwd(), file), "utf8");

      return (
        !source.includes("focus-visible") ||
        !source.includes("var(--glass-focus)")
      );
    });
    const css = readFileSync(
      path.join(process.cwd(), "src/styles/globals.css"),
      "utf8",
    );

    expect(offenders).toEqual([]);
    expect(css).toContain(
      ":where(.site-header-link, .site-header-action):focus-visible",
    );
    expect(css).toContain(".public-select-trigger:focus-visible");
    expect(css).toContain(".skip-link:focus-visible");
  });

  it("keeps literal icon-sized buttons accessible by name", () => {
    const offenders = SOURCE_ROOTS.flatMap((root) =>
      listTsxFiles(path.join(process.cwd(), root)),
    ).flatMap((file) => {
      const source = readFileSync(file, "utf8");
      const iconButtons =
        source.matchAll(
          /<Button(?=[^>]*\bsize="icon")[^>]*>[\s\S]*?<\/Button>/g,
        ) ?? [];

      return Array.from(iconButtons)
        .filter((match) => {
          const button = match[0];

          return !(
            /\baria-label=|\baria-labelledby=/.test(button) ||
            /<span[^>]*className="[^"]*\bsr-only\b/.test(button) ||
            /<CartCountLink\b/.test(button)
          );
        })
        .map((match) => ({
          file: path.relative(process.cwd(), file).replaceAll(path.sep, "/"),
          line: getLineNumber(source, match.index),
        }));
    });

    expect(offenders).toEqual([]);
  });

  it("keeps menu and select highlighted states visually distinct", () => {
    const files = [
      "src/components/ui/dropdown-menu.tsx",
      "src/components/ui/select.tsx",
    ];
    const offenders = files.filter((file) => {
      const source = readFileSync(path.join(process.cwd(), file), "utf8");

      return (
        !source.includes("data-[highlighted]:bg-accent") ||
        source.includes("focus:bg-[oklch(0.18_0_0_/_5%)]")
      );
    });

    expect(offenders).toEqual([]);
  });

  it("keeps select scroll buttons named and their icons decorative", () => {
    const source = readFileSync(
      path.join(process.cwd(), "src/components/ui/select.tsx"),
      "utf8",
    );

    expect(source).toContain('"aria-label": ariaLabel = "גלילה למעלה"');
    expect(source).toContain('"aria-label": ariaLabel = "גלילה למטה"');
    expect(source).toContain('<ChevronUpIcon aria-hidden="true" />');
    expect(source).toContain('<ChevronDownIcon aria-hidden="true" />');
  });

  it("keeps legal routes landmarked, readable, and keyboard navigable", () => {
    const layout = readFileSync(
      path.join(process.cwd(), "src/app/layout.tsx"),
      "utf8",
    );
    const legalRoutes = [
      {
        file: "src/app/terms/page.tsx",
        requiredLinkTestId: "terms-service-recovery-link",
      },
      {
        file: "src/app/privacy/page.tsx",
        requiredLinkTestId: "privacy-service-recovery-link",
      },
      {
        file: "src/app/accessibility/page.tsx",
        requiredLinkTestId: "accessibility-service-recovery-link",
      },
    ];

    expect(layout).toContain('href="#main-content"');
    expect(layout).toContain('id="main-content"');
    expect(layout).toContain("tabIndex={-1}");

    for (const route of legalRoutes) {
      const source = readFileSync(path.join(process.cwd(), route.file), "utf8");
      const sectionLabels = source.match(/<section aria-labelledby=/g) ?? [];

      expect(source).toContain('<main className="elysia-page">');
      expect(source).toContain("<SiteHeader />");
      expect(source).toContain("<CompactPageIntro");
      expect(source).toContain('variant="content"');
      expect(source).toContain("max-w-5xl");
      expect(source).toContain(`data-testid="${route.requiredLinkTestId}"`);
      expect(sectionLabels.length).toBeGreaterThanOrEqual(2);
    }

    expect(
      readFileSync(
        path.join(process.cwd(), "src/app/privacy/page.tsx"),
        "utf8",
      ),
    ).toContain("<CookiePreferencesPanel />");
  });

  it("keeps legal routes readable in print without interactive chrome", () => {
    const css = readFileSync(
      path.join(process.cwd(), "src/styles/globals.css"),
      "utf8",
    );
    const printBlock = extractCssBlock(css, "@media print");

    expect(printBlock).toContain("background: #fff !important;");
    expect(printBlock).toContain("color: #000 !important;");
    expect(printBlock).toContain(".site-header");
    expect(printBlock).toContain("footer");
    expect(printBlock).toContain('[data-cookie-consent-banner="true"]');
    expect(printBlock).toContain('[data-accessibility-widget-trigger="true"]');
    expect(printBlock).toContain("#main-content");
    expect(printBlock).toContain("main");
    expect(printBlock).toContain("box-shadow: none !important;");
    expect(printBlock).toContain("break-inside: avoid;");
  });

  it("keeps high-contrast product and checkout surfaces legible", () => {
    const css = readFileSync(
      path.join(process.cwd(), "src/styles/globals.css"),
      "utf8",
    );
    const contrastBlock = extractCssBlock(
      css,
      'html[data-accessibility-contrast="true"]',
    );

    expect(contrastBlock).toContain("--background: oklch(1 0 0);");
    expect(contrastBlock).toContain("--foreground: oklch(0 0 0);");
    expect(contrastBlock).toContain("--glass-border-strong");

    expect(css).toContain(
      'html[data-accessibility-contrast="true"] .product-card-media',
    );
    expect(css).toContain(
      'html[data-accessibility-contrast="true"] .product-card-status-badge',
    );
    expect(css).toContain(
      'html[data-accessibility-contrast="true"] .product-card-favorite',
    );
    expect(css).toContain(
      'html[data-accessibility-contrast="true"] .public-select-trigger',
    );
    expect(css).toContain(
      'html[data-accessibility-contrast="true"] .public-select-content',
    );
    expect(css).toContain(
      'html[data-accessibility-contrast="true"] .sheet-content',
    );
    expect(css).toContain(
      'html[data-accessibility-contrast="true"] [data-slot="badge"]',
    );
    expect(css).toContain(
      'html[data-accessibility-contrast="true"] .product-card-media::after',
    );
    expect(css).toContain("backdrop-filter: none;");
    expect(css).toContain(
      ":where(input, textarea, select, .public-select-trigger)",
    );
  });

  it("keeps public header utilities visible in high contrast mode", () => {
    const css = readFileSync(
      path.join(process.cwd(), "src/styles/globals.css"),
      "utf8",
    );
    const header = readFileSync(
      path.join(process.cwd(), "src/components/site-header.tsx"),
      "utf8",
    );

    expect(css).toContain(
      'html[data-accessibility-contrast="true"] .site-header',
    );
    expect(css).toContain(
      '.site-header[data-over-media="true"][data-header-state="transparent"]',
    );
    expect(css).toContain("--site-header-link-color: var(--foreground);");
    expect(css).toContain("--site-header-link-hover: var(--foreground);");
    expect(css).toContain("border-bottom-color: var(--glass-border-strong);");
    expect(css).toContain(
      'html[data-accessibility-contrast="true"] .site-header .site-header-action',
    );
    expect(css).toContain(
      ":where(.site-header-link, .site-header-action):focus-visible",
    );
    expect(header).toContain("brand-header-mark site-header-link");
    expect(header).toContain("site-header-action");
    expect(header).toContain("site-header-label-action");
    expect(header).toContain('href="/search"');
    expect(header).toContain('href="/service"');
    expect(header).toContain('href="/wishlist"');
    expect(header).toContain('href="/account"');
    expect(header).toContain("CartCountLink");
    expect(header.match(/data-icon-tooltip=/g)).toHaveLength(3);
  });

  it("keeps product image alt text descriptive without duplicating decorative thumbnails", () => {
    const productCard = readFileSync(
      path.join(process.cwd(), "src/components/product-card.tsx"),
      "utf8",
    );
    const productPage = readFileSync(
      path.join(process.cwd(), "src/app/product/[slug]/page.tsx"),
      "utf8",
    );
    const productGallery = readFileSync(
      path.join(
        process.cwd(),
        "src/app/product/[slug]/_components/product-gallery.tsx",
      ),
      "utf8",
    );
    const recentlyViewed = readFileSync(
      path.join(
        process.cwd(),
        "src/app/product/[slug]/_components/recently-viewed-products.tsx",
      ),
      "utf8",
    );

    expect(productCard).toContain("alt={publicProductName}");
    expect(productCard).toContain("aria-label={`");
    expect(productCard).toContain("publicProductName");
    expect(productPage).toContain("productName={publicProductName}");
    expect(productPage).toContain("getPublicProductName(product.name)");
    expect(productGallery).toContain("productName");
    expect(productGallery).toContain("activeImagePosition");
    expect(productGallery).toContain("galleryImageCount");
    expect(productGallery).toContain('alt=""');
    expect(productGallery).toContain("aria-label={`");
    expect(recentlyViewed).toContain("<ProductCard");
  });

  it("keeps admin table actions named with record context", () => {
    const ordersPage = readFileSync(
      path.join(process.cwd(), "src/app/admin/orders/page.tsx"),
      "utf8",
    );
    const orderActions = readFileSync(
      path.join(
        process.cwd(),
        "src/app/admin/_components/admin-order-actions.tsx",
      ),
      "utf8",
    );

    expect(ordersPage).toContain("aria-label={`");
    expect(ordersPage).toContain("order.id");
    expect(ordersPage).toContain("order.shopifyOrderName");
    expect(ordersPage).toContain("order.shopifyOrderId");
    expect(orderActions).toContain("targetLabel={orderId}");
    expect(orderActions).toContain("accessibleLabel");
    expect(orderActions).toContain("aria-label={accessibleLabel}");
    expect(orderActions).toContain("aria-label={`");
    expect(orderActions).toContain("orderId");
    expect(orderActions).not.toContain("aria-label={label}");
  });
});

function extractCssBlock(source: string, selector: string) {
  const selectorIndex = source.indexOf(selector);
  expect(selectorIndex).toBeGreaterThanOrEqual(0);

  const blockStart = source.indexOf("{", selectorIndex);
  expect(blockStart).toBeGreaterThanOrEqual(0);

  let depth = 0;

  for (let index = blockStart; index < source.length; index += 1) {
    const char = source[index];

    if (char === "{") depth += 1;

    if (char === "}") {
      depth -= 1;

      if (depth === 0) {
        return source.slice(blockStart, index + 1);
      }
    }
  }

  throw new Error(`Could not extract CSS block for ${selector}`);
}
