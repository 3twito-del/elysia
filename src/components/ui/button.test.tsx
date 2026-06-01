import { readFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Button } from "./button";

describe("Button", () => {
  it("defaults native buttons to type button", () => {
    expect(renderToStaticMarkup(<Button>Action</Button>)).toContain(
      'type="button"',
    );
  });

  it("preserves explicit submit buttons", () => {
    expect(renderToStaticMarkup(<Button type="submit">Save</Button>)).toContain(
      'type="submit"',
    );
  });

  it("does not add a button type to asChild links", () => {
    const markup = renderToStaticMarkup(
      <Button asChild>
        <a href="/search">Search</a>
      </Button>,
    );

    expect(markup).toContain("<a ");
    expect(markup).not.toContain("type=");
  });

  it("lets custom outline button colors override the base variant", () => {
    const markup = renderToStaticMarkup(
      <Button className="bg-white/10 text-white" variant="outline">
        Action
      </Button>,
    );

    expect(markup).toContain("bg-white/10");
    expect(markup).toContain("text-white");
    expect(markup).not.toContain("bg-background");
    expect(markup).not.toContain("text-foreground");
  });

  it("keeps modal-like surfaces on Radix focus management with named close controls", () => {
    const dialog = read("src/components/ui/dialog.tsx");
    const sheet = read("src/components/ui/sheet.tsx");
    const searchControls = read(
      "src/app/search/_components/search-controls.tsx",
    );

    expect(dialog).toContain("DialogPrimitive.Root");
    expect(dialog).toContain("DialogPrimitive.Content");
    expect(dialog).toContain(
      'DialogPrimitive.Close data-slot="dialog-close" asChild',
    );
    expect(dialog).toContain('<span className="sr-only">');
    expect(dialog).not.toContain("onKeyDown");

    expect(sheet).toContain("SheetPrimitive.Root");
    expect(sheet).toContain("onOpenChange={handleOpenChange}");
    expect(sheet).toContain("SheetPrimitive.Trigger");
    expect(sheet).toContain("SheetPrimitive.Content");
    expect(sheet).toContain(
      'SheetPrimitive.Close data-slot="sheet-close" asChild',
    );
    expect(sheet).toContain("useHydrated()");

    expect(searchControls).toContain('event.key === "Escape"');
    expect(searchControls).toContain("closeList({ focusTrigger: true })");
  });
});

const root = process.cwd();

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}
