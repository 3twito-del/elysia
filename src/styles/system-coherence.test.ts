import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("Elysia system coherence", () => {
  it("defines one semantic surface system and maps legacy visual layers to it", () => {
    const css = read("src/styles/globals.css");

    [
      "--elysia-page-bg",
      "--elysia-page-wash",
      "--elysia-surface-bg",
      "--elysia-surface-raised",
      "--elysia-surface-control",
      "--elysia-surface-inset",
      "--elysia-surface-chrome",
      "--elysia-border",
      "--elysia-border-strong",
      "--elysia-focus",
      "--elysia-media-bg",
      "--elysia-media-border",
      ".elysia-page",
      ".elysia-section",
      ".elysia-route-header",
      ".elysia-panel",
      ".elysia-card",
      ".elysia-inset",
      ".elysia-toolbar",
      ".elysia-media-frame",
      ".elysia-admin-shell",
    ].forEach((tokenOrClass) => expect(css).toContain(tokenOrClass));

    expect(css).toContain("--glass-panel-bg: var(--elysia-surface-bg);");
    expect(css).toContain("--glass-card-bg: var(--elysia-surface-raised);");
    expect(css).toContain("--glass-control-bg: var(--elysia-surface-control);");
    expect(css).toContain("--glass-inset-bg: var(--elysia-surface-inset);");
    expect(css).toContain("--glass-border: var(--elysia-border);");
    expect(css).toContain("--glass-focus: var(--elysia-focus);");
    expect(css).toContain("--boutique-surface: var(--elysia-surface-bg);");
    expect(css).toContain("--boutique-border: var(--elysia-border);");
  });

  it("routes shared primitives through the same Elysia surface hooks", () => {
    const card = read("src/components/ui/card.tsx");
    const button = read("src/components/ui/button.tsx");
    const input = read("src/components/ui/input.tsx");
    const badge = read("src/components/ui/badge.tsx");
    const table = read("src/components/ui/table.tsx");
    const sheet = read("src/components/ui/sheet.tsx");
    const dialog = read("src/components/ui/dialog.tsx");
    const emptyState = read("src/components/ui/empty-state.tsx");
    const alertDialog = read("src/components/ui/alert-dialog.tsx");
    const dropdown = read("src/components/ui/dropdown-menu.tsx");
    const select = read("src/components/ui/select.tsx");
    const textarea = read("src/components/ui/textarea.tsx");
    const inputGroup = read("src/components/ui/input-group.tsx");
    const tabs = read("src/components/ui/tabs.tsx");
    const command = read("src/components/ui/command.tsx");

    expect(card).toContain("elysia-card");
    expect(card).toContain("elysia-inset");
    expect(button).toContain("elysia-control");
    expect(input).toContain("elysia-control glass-control");
    expect(badge).toContain("elysia-control");
    expect(table).toContain("elysia-table elysia-panel");
    expect(table).toContain("elysia-inset glass-inset");
    expect(sheet).toContain("elysia-panel sheet-content");
    expect(dialog).toContain("elysia-panel popup-surface");
    expect(emptyState).toContain("elysia-panel glass-panel");
    expect(emptyState).toContain("elysia-inset glass-inset");
    expect(alertDialog).toContain("elysia-panel popup-surface");
    expect(alertDialog).toContain("elysia-inset glass-inset");
    expect(dropdown).toContain("elysia-panel popup-surface");
    expect(select).toContain("elysia-control glass-control");
    expect(select).toContain("elysia-panel popup-surface");
    expect(textarea).toContain("elysia-control glass-control");
    expect(inputGroup).toContain("elysia-control glass-control");
    expect(tabs).toContain("elysia-inset glass-inset");
    expect(tabs).toContain("elysia-control");
    expect(command).toContain("elysia-panel popup-surface");
  });

  it("marks public, commerce, product, and admin shells with the unified system", () => {
    const reveal = read("src/components/reveal.tsx");
    const hero = read("src/components/commerce-page-hero.tsx");
    const header = read("src/components/site-header.tsx");
    const footer = read("src/components/site-footer.tsx");
    const productCard = read("src/components/product-card.tsx");
    const adminShell = read("src/app/admin/_components/admin-shell.tsx");
    const home = read("src/app/page.tsx");
    const category = read("src/app/category/[slug]/page.tsx");
    const search = read("src/app/search/page.tsx");
    const product = read("src/app/product/[slug]/page.tsx");
    const account = read("src/app/account/page.tsx");

    expect(reveal).toContain("elysia-section motion-reveal");
    expect(hero).toContain("elysia-route-header commerce-page-hero");
    expect(hero).toContain("elysia-media-frame commerce-page-hero-media");
    expect(header).toContain("site-header elysia-chrome");
    expect(footer).toContain("site-footer elysia-section");
    expect(productCard).toContain("product-card-shell elysia-product-card");
    expect(productCard).toContain("elysia-media-frame brand-product-media");
    expect(adminShell).toContain("elysia-page elysia-admin-shell");
    expect(adminShell).toContain("elysia-chrome");
    expect(home).toContain("elysia-page home-luxury-page");
    expect(category).toContain('<main className="elysia-page" dir="rtl">');
    expect(search).toContain('<main className="elysia-page">');
    expect(product).toContain('className="elysia-page bg-background"');
    expect(account).toContain("elysia-page account-boutique-page");
  });
});

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}
