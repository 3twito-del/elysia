import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("public metadata contract", () => {
  it("keeps root and homepage share previews complete", () => {
    const layout = read("src/app/layout.tsx");
    const home = read("src/app/page.tsx");

    expect(layout).toContain(
      'metadataBase: new URL(env.SITE_URL ?? "https://elysia-jewellery.com")',
    );
    expect(layout).toContain('canonical: "/"');
    expect(layout).toContain('url: "/"');
    expect(layout).toContain("images: [{ url: sharePreviewImage }]");
    expect(layout).toContain("images: [sharePreviewImage]");

    expect(home).toContain('canonical: "/"');
    expect(home).toContain('url: "/"');
    expect(home).toContain(
      'images: [{ url: "/brand/v2/editorial-home.avif" }]',
    );
    expect(home).toContain("twitter:");
  });

  it("keeps product, category, and search routes canonical and shareable", () => {
    const product = read("src/app/product/[slug]/page.tsx");
    const category = read("src/app/category/[slug]/page.tsx");
    const search = read("src/app/search/page.tsx");

    expect(product).toContain("canonical: `/product/${slug}`");
    expect(product).toContain("url: `/product/${slug}`");
    expect(product).toContain('card: "summary_large_image"');
    expect(product).toContain("images: [product.image]");

    expect(category).toContain("canonical: `/category/${slug}`");
    expect(category).toContain("url: `/category/${slug}`");
    expect(category).toContain("getCategoryBrandSlides(slug)[0]?.src");
    expect(category).toContain('card: "summary_large_image"');

    expect(search).toContain('canonical: "/search"');
    expect(search).toContain('url: "/search"');
    expect(search).toContain(
      'images: [{ url: "/brand/v2/editorial-home.avif" }]',
    );
  });
});

const root = process.cwd();

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}
