import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("product gallery media fallback and thumbnail clarity", () => {
  it("keeps full-gallery benchmark support evidence available", () => {
    const benchmark = read("docs/qa/product-gallery-full-gallery-benchmark.md");

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
      'data-testid="product-gallery-fullscreen-dialog"',
    );
    expect(gallery).toContain('data-testid="product-gallery-fullscreen-stage"');
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
    expect(gallery).toContain("product-gallery-thumbnail-rail");
    expect(gallery).toContain("object-contain");
    expect(gallery).toContain("100dvh");
    expect(gallery).toContain("100dvw");
    expect(gallery).toContain("mainGalleryImageSizes");
    expect(gallery).toContain("galleryThumbnailImageSizes");
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
});

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function indexOf(source: string, pattern: string) {
  const index = source.indexOf(pattern);

  expect(index, pattern).toBeGreaterThanOrEqual(0);

  return index;
}
