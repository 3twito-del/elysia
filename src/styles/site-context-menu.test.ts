import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("site context menu contract", () => {
  it("mounts the global client menu from the root layout", () => {
    const layout = read("src/app/layout.tsx");

    expect(layout).toContain(
      'import { SiteContextMenu } from "~/components/site-context-menu";',
    );
    expect(layout).toContain("<SiteContextMenu />");
  });

  it("opens from native and keyboard context-menu triggers", () => {
    const component = read("src/components/site-context-menu.tsx");

    expect(component).toContain('"use client"');
    expect(component).toContain("export function SiteContextMenu()");
    expect(component).toContain(
      'document.addEventListener("contextmenu", handleContextMenu)',
    );
    expect(component).toContain(
      'document.addEventListener("keydown", handleKeyboardOpen)',
    );
    expect(component).toContain('event.key === "ContextMenu"');
    expect(component).toContain('event.shiftKey && event.key === "F10"');
    expect(component).toContain('event.key === "Escape"');
  });

  it("keeps native browser behavior for editing, selected text, and private flows", () => {
    const component = read("src/components/site-context-menu.tsx");

    expect(component).toContain(
      'const excludedPathPrefixes = ["/admin", "/checkout"]',
    );
    expect(component).toContain("shouldUseNativeContextMenu(event)");
    expect(component).toContain("shouldUseNativeContextMenuTarget(target)");
    expect(component).toContain("nativeContextMenuSelector");
    expect(component).toContain('"input"');
    expect(component).toContain('"textarea"');
    expect(component).toContain('"select"');
    expect(component).toContain('"button"');
    expect(component).toContain("\"[contenteditable='true']\"");
    expect(component).toContain('"[data-native-context-menu]"');
    expect(component).toContain("event.ctrlKey || event.shiftKey");
    expect(component).toContain("window.getSelection()?.toString().trim()");
  });

  it("keeps the rendered surface accessible and viewport bounded", () => {
    const component = read("src/components/site-context-menu.tsx");

    expect(component).toContain('role="menu"');
    expect(component).toContain('role="menuitem"');
    expect(component).toContain('data-site-context-menu="true"');
    expect(component).toContain('dir="rtl"');
    expect(component).toContain("firstMenuItemRef.current?.focus()");
    expect(component).toContain("viewportGutter");
    expect(component).toContain("window.innerWidth - rect.width");
    expect(component).toContain("window.innerHeight - rect.height");
    expect(component).toContain("focus-visible:ring-[var(--glass-focus)]");
  });

  it("exposes the approved commerce actions without legacy turquoise styling", () => {
    const component = read("src/components/site-context-menu.tsx");

    expect(component).toContain('href: "/search"');
    expect(component).toContain('href: "/category/rings"');
    expect(component).toContain('href: "/category/necklaces"');
    expect(component).toContain('href: "/category/earrings"');
    expect(component).toContain('href: "/category/bracelets"');
    expect(component).not.toContain('href: "/gifts"');
    expect(component).toContain("resolveContextHref");
    expect(component).toContain('href: "/wishlist"');
    expect(component).toContain('href: "/size-guide"');
    expect(component).toContain('href: "/service"');
    expect(component).toContain("navigator.clipboard.writeText");
    expect(component).toContain('pathname.startsWith("/product/")');
    expect(component).toContain(
      'window.scrollTo({ behavior: "smooth", top: 0 })',
    );
    expect(component).not.toMatch(/aqua|turquoise|cyan|teal|brand-aqua/i);
    expect(component).not.toMatch(/gradient/i);
    expect(component).not.toMatch(/rounded-(lg|xl|2xl|3xl|full)/);
  });
});

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}
