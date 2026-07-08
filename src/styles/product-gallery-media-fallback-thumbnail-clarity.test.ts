import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("product gallery media fallback and thumbnail clarity", () => {
  it("keeps full-gallery benchmark support evidence available", () => {
    const benchmark = read("docs/QA_EVIDENCE.md");

    expect(benchmark).toContain("I-034");
    expect(benchmark).toContain("Weighted Score`: 37.5");
    expect(benchmark).toContain("Decision`: Supported");
    expect(benchmark).toContain("Cartier");
    expect(benchmark).toContain("Tiffany");
    expect(benchmark).toContain("David Yurman");
    expect(benchmark).toContain("Kendra Scott");
  });

  it("keeps product gallery selected-state, full-screen viewer, and fallback clarity testable", () => {
    const gallery = read(
      "src/app/product/[slug]/_components/product-gallery.tsx",
    );

    expect(gallery).toContain('data-testid="product-gallery-empty"');
    expect(gallery).toContain('data-testid="product-gallery-selection-status"');
    expect(gallery).toContain('aria-live="polite"');
    expect(gallery).toContain("data-gallery-selected=");
    expect(gallery).toContain('thumbnailTestId: "product-gallery-thumbnail"');
    expect(gallery).toContain('testId: "product-gallery-thumbnail-rail"');
    expect(gallery).toContain(
      'data-testid="product-gallery-fullscreen-trigger"',
    );
    expect(gallery).toContain(
      'data-testid="product-gallery-touch-zoom-trigger"',
    );
    expect(gallery).toContain(
      'data-testid="product-gallery-fullscreen-dialog"',
    );
    expect(gallery).toContain('data-testid="product-gallery-fullscreen-stage"');
    expect(gallery).toContain('data-testid="product-gallery-fullscreen-media"');
    expect(gallery).toContain(
      'data-testid="product-gallery-fullscreen-zoom-toggle"',
    );
    expect(gallery).toContain(
      'data-testid="product-gallery-fullscreen-status"',
    );
    expect(gallery).toContain('data-testid="product-gallery-previous"');
    expect(gallery).toContain('data-testid="product-gallery-next"');
    expect(gallery).toContain(
      'testId: "product-gallery-fullscreen-thumbnail-rail"',
    );
    expect(gallery).toContain("activeImagePosition");
    expect(gallery).toContain("galleryImageCount");
    expect(gallery).toContain("aria-current={activeImageIndex === index}");
    expect(gallery).toContain("aria-pressed={activeImageIndex === index}");
    expect(gallery).toContain("product-gallery-main-frame");
    expect(gallery).toContain("product-gallery-integrated-layout");
    expect(gallery).toContain(
      'data-testid="product-gallery-integrated-layout"',
    );
    expect(gallery).toContain('data-testid="product-gallery-secondary-stack"');
    expect(gallery).toContain('"product-gallery-secondary-tile"');
    expect(gallery).toContain('"product-gallery-more-images-trigger"');
    expect(gallery).toContain("getSecondaryGalleryImages");
    expect(gallery).toContain("hiddenGalleryImageCount");
    expect(gallery).toContain("openViewerFromSecondaryTile");
    expect(gallery).toContain("product-gallery-thumbnail-rail");
    expect(gallery).toContain("data-gallery-hover-zoom=");
    expect(gallery).toContain('data-testid="product-gallery-hover-zoom-layer"');
    expect(gallery).toContain("syncGalleryHoverZoom");
    expect(gallery).toContain("resetGalleryHoverZoom");
    expect(gallery).toContain("hoverFinePointerQuery");
    expect(gallery).toContain('event.pointerType === "touch"');
    expect(gallery).toContain("object-contain");
    expect(gallery).toContain("data-gallery-zoomed=");
    expect(gallery).toContain("product-gallery-viewer-dialog");
    expect(gallery).toContain("product-gallery-viewer-header");
    expect(gallery).toContain("product-gallery-viewer-stage");
    expect(gallery).toContain("product-gallery-viewer-media-shell");
    expect(gallery).toContain("product-gallery-viewer-nav");
    expect(gallery).toContain("product-gallery-viewer-filmstrip-shell");
    expect(gallery).toContain('variant: "viewer"');
    expect(gallery).toContain("viewerPendingZoomRef.current = true");
    expect(gallery).toContain("aria-pressed={isViewerZoomed}");
    expect(gallery).toContain("100dvw");
    expect(gallery).toContain("viewerThumbnailRefs.current[activeImageIndex]");
    expect(gallery).toContain('inline: "center"');
    expect(gallery).toContain("mainGalleryImageSizes");
    expect(gallery).toContain("galleryThumbnailImageSizes");
    expect(gallery).toContain("integratedGallerySecondaryImageSizes");
    expect(gallery).toContain("viewerGalleryImageSizes");
    expect(gallery).not.toContain('data-testid="product-gallery-zoom-dialog"');
    expect(gallery).not.toContain('data-testid="product-gallery-zoom-trigger"');
    expect(gallery).toContain(
      "alt={`${productName}, תמונה ${activeImagePosition} מתוך ${galleryImageCount}`}",
    );
  });

  it("keeps gallery clarity inside the gallery before thumbnail controls", () => {
    const gallery = read(
      "src/app/product/[slug]/_components/product-gallery.tsx",
    );

    expect(indexOf(gallery, 'data-testid="product-gallery"')).toBeLessThan(
      indexOf(gallery, 'data-testid="product-gallery-selection-status"'),
    );
    expect(
      indexOf(gallery, 'data-testid="product-gallery-selection-status"'),
    ).toBeLessThan(
      indexOf(gallery, 'testId: "product-gallery-thumbnail-rail"'),
    );
  });

  it("keeps desktop mosaic styling separate from the mobile thumbnail rail", () => {
    const css = read("src/styles/globals.css");

    expect(css).toContain(".product-gallery-integrated-layout");
    expect(css).toContain(".product-gallery-secondary-stack");
    expect(css).toContain(".product-gallery-secondary-tile");
    expect(css).toContain(".product-gallery-more-images-veil");
    expect(css).toContain(".product-gallery-more-images-label");
    expect(css).toContain("backdrop-filter: blur(4px) saturate(0.92);");
    expect(css).toContain(".product-gallery-thumbnail-rail button");
    expect(css).toContain(".product-gallery-viewer-dialog");
    expect(css).toContain(".product-gallery-viewer-header");
    expect(css).toContain(".product-gallery-viewer-stage");
    expect(css).toContain("100dvh");
    expect(css).toContain(".product-gallery-viewer-media-shell");
    expect(css).toContain(".product-gallery-viewer-media-shell-zoomed");
    expect(css).toContain(
      ".product-gallery-viewer-stage-zoomed::-webkit-scrollbar",
    );
    expect(css).toContain("scrollbar-width: none;");
    expect(css).toContain(".product-gallery-viewer-nav-previous");
    expect(css).toContain(".product-gallery-viewer-nav-next");
    expect(css).toContain(".product-gallery-viewer-filmstrip-shell");
    expect(css).toContain(".product-gallery-viewer-thumbnail-rail");
  });
});

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function indexOf(source: string, pattern: string) {
  const index = source.indexOf(pattern);

  expect(index, pattern).toBeGreaterThanOrEqual(0);

  return index;
}
