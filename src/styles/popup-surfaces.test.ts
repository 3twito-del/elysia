import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

const popupSurfaceFiles = [
  ["Sheet", "src/components/ui/sheet.tsx"],
  ["Dialog", "src/components/ui/dialog.tsx"],
  ["AlertDialog", "src/components/ui/alert-dialog.tsx"],
  ["Dropdown", "src/components/ui/dropdown-menu.tsx"],
  ["Popover", "src/components/ui/popover.tsx"],
  ["Select", "src/components/ui/select.tsx"],
  ["Tooltip", "src/components/ui/tooltip.tsx"],
  ["Command", "src/components/ui/command.tsx"],
  ["HoverCard", "src/components/ui/hover-card.tsx"],
  ["Accessibility widget dialog", "src/components/accessibility-widget.tsx"],
] as const;

const overlayFiles = [
  ["Sheet", "src/components/ui/sheet.tsx"],
  ["Dialog", "src/components/ui/dialog.tsx"],
  ["AlertDialog", "src/components/ui/alert-dialog.tsx"],
  ["Accessibility widget", "src/components/accessibility-widget.tsx"],
] as const;

const transparentOverlayClass = /bg-\[oklch\(0\.12_0_0_\/_(16|20|34)%\)\]/;

describe("popup surfaces", () => {
  it("defines the shared popup surface as opaque", () => {
    const css = read("src/styles/globals.css");

    expect(css).toMatch(
      /\.popup-surface\s*\{[\s\S]*background:\s*var\(--popover\)\s*!important;/,
    );
    expect(css).toMatch(/\.popup-surface\s*\{[\s\S]*backdrop-filter:\s*none;/);
    expect(css).toMatch(
      /\.popup-surface\s*\{[\s\S]*-webkit-backdrop-filter:\s*none;/,
    );
    expect(css).toMatch(
      /\.popup-overlay\s*\{[\s\S]*background:\s*color-mix\(in srgb, var\(--brand-espresso\) 58%, transparent\);/,
    );
  });

  it("keeps every popup primitive on the shared opaque surface", () => {
    const missingSurfaces = popupSurfaceFiles
      .filter(([, file]) => !read(file).includes("popup-surface"))
      .map(([name, file]) => `${name}: ${file}`);

    expect(missingSurfaces).toEqual([]);
  });

  it("keeps modal overlays on the shared dimming layer", () => {
    const missingOverlays = overlayFiles
      .filter(([, file]) => !read(file).includes("popup-overlay"))
      .map(([name, file]) => `${name}: ${file}`);

    expect(missingOverlays).toEqual([]);
  });

  it("does not reintroduce the old translucent overlay utilities", () => {
    const violations = [...popupSurfaceFiles, ...overlayFiles]
      .flatMap(([, file]) => {
        const content = read(file);

        return transparentOverlayClass.test(content) ? [file] : [];
      })
      .filter((file, index, files) => files.indexOf(file) === index);

    expect(violations).toEqual([]);
  });
});

function read(file: string) {
  return readFileSync(path.join(root, file), "utf8");
}
