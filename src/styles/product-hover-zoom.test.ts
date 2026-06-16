import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("product image hover zoom", () => {
  it("keeps PDP hover zoom pointer-focused, bounded, and motion-aware", () => {
    const gallery = read(
      "src/app/product/[slug]/_components/product-gallery.tsx",
    );
    const css = read("src/styles/globals.css");

    expect(gallery).toContain("hoverFinePointerQuery");
    expect(gallery).toContain("data-gallery-hover-zoom=");
    expect(gallery).toContain('data-testid="product-gallery-hover-zoom-layer"');
    expect(gallery).toContain(
      'target.closest("[data-gallery-hover-zoom-exempt]")',
    );
    expect(gallery).toContain('event.pointerType === "touch"');
    expect(gallery).toContain(
      "window.matchMedia(hoverFinePointerQuery).matches",
    );
    expect(gallery).toContain('data-testid="product-gallery-main-image"');
    expect(gallery).toContain("--gallery-hover-origin-x");
    expect(gallery).toContain("--gallery-hover-origin-y");
    expect(gallery).toContain("clamp(");
    expect(css).toContain("--gallery-main-image-shift-x:");
    expect(css).toContain("--gallery-main-image-scale: 1;");
    expect(css).toContain(
      "--gallery-main-image-shift-x: clamp(1rem, 2vw, 2.5rem);",
    );
    expect(css).toContain("--gallery-main-image-scale: 1.12;");
    expect(css).toContain("--gallery-hover-zoom-scale: 1.42;");
    expect(css).toContain(".product-gallery-hover-zoom-layer");
    expect(css).toContain(
      "transform: translate3d(var(--gallery-main-image-shift-x), 0, 0)",
    );
    expect(css).toContain("transform-origin: var(--gallery-hover-origin-x)");
    expect(css).toContain(
      '.product-gallery-main-frame[data-gallery-hover-zoom="true"]',
    );
    expect(css).toContain("cursor: zoom-in;");
    expect(css).toContain(
      'html[data-accessibility-motion="reduce"] .product-gallery-hover-zoom-layer',
    );
    expect(css).toContain(
      ".product-gallery-hover-zoom-layer,\n  .sheet-content",
    );
  });

  it("keeps product card hover media visibly enlarged without layout movement", () => {
    const source = read("src/components/product-card.tsx");
    const css = read("src/styles/globals.css");

    expect(source).toContain("group-hover/card:scale-[1.045]");
    expect(source).toContain("group-focus-within/card:scale-[1.045]");
    expect(source).toContain("group-hover/card:scale-[1.055]");
    expect(source).toContain("group-focus-within/card:scale-[1.055]");
    expect(source).toContain("product-card-hover-image");
    expect(source).toContain("relative aspect-[5/4] overflow-hidden");
    expect(css).toContain(".product-card-shell:hover .product-card-image");
    expect(css).toContain(
      ".product-card-shell:focus-within .product-card-hover-image",
    );
    expect(css).toContain("will-change: opacity, scale;");
  });
});

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}
