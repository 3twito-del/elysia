import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const sourceRoots = ["src/app", "src/components"];
const sourceExtensions = new Set([".tsx", ".ts"]);
const root = process.cwd();

describe("image performance guardrails", () => {
  it("keeps route-level LCP priority limited to first-viewport media", () => {
    const homeSource = read("src/app/page.tsx");
    const searchSource = read("src/app/search/page.tsx");
    const categorySource = read("src/app/category/[slug]/page.tsx");
    const giftsSource = read("src/app/gifts/page.tsx");
    const aboutSource = read("src/app/about/page.tsx");
    const homeHeroVideoSource = read("src/components/home-hero-video.tsx");
    const gallerySource = read(
      "src/app/product/[slug]/_components/product-gallery.tsx",
    );
    const homeImageTags =
      homeSource.match(/<Image(?=[\s/>])[\s\S]*?\/>/g) ?? [];

    expect(homeSource).toContain(
      'className="storefront-hero-image object-cover"',
    );
    expect(homeSource).toContain("<HomeHeroVideo");
    expect(homeSource).toContain('as="image"');
    expect(homeSource).not.toContain('as="video"');
    expect(homeSource).not.toContain("href={boutiqueHeroVideoWebm}");
    expect(homeSource).toContain('fetchPriority="high"');
    expect(homeSource).toContain("posterSrc={boutiqueHeroPoster}");
    expect(homeSource).toContain("webmSrc={boutiqueHeroVideoWebm}");
    expect(aboutSource).toContain(
      'const aboutHeroImage = "/brand/boutique/about-hero-prism.avif";',
    );
    expect(aboutSource).toContain('data-testid="about-cinematic-page-hero"');
    expect(aboutSource).toContain("src={aboutHeroImage}");
    expect(aboutSource).toContain('sizes="100vw"');
    expect(aboutSource).toContain("priority");
    expect(aboutSource).toContain("about-fixed-image-band");
    expect(aboutSource).not.toContain("<CommercePageHero");
    expect(aboutSource).not.toContain("<HomeHeroVideo");
    expect(aboutSource).not.toContain('as="video"');
    expect(homeHeroVideoSource).toContain('preload="auto"');
    expect(homeHeroVideoSource).toContain('video.preload = "auto";');
    expect(homeHeroVideoSource).toContain("video.load();");
    expect(homeHeroVideoSource).toContain("void video.play().catch");
    expect(homeHeroVideoSource).not.toContain('preload="metadata"');
    expect(homeSource).toContain("src={category.image}");
    expect(homeSource).toContain("<ProductCard");
    expect(homeSource).toContain("<DeferredFixedBackgroundBand");
    expect(homeImageTags.some((tag) => tag.includes("priority"))).toBe(false);
    expect(homeSource).not.toContain("<StaticCinematicHeroSequence");
    expect(homeSource).not.toContain("imagePriority={index < 4}");
    expect(homeSource).not.toContain("imagePriority={index === 0}");
    expect(homeSource).not.toContain("priority={imagePriority}");

    expect(searchSource).toContain("imagePriority={index < 2}");
    expect(searchSource).toContain("imagePriority={index < 4}");
    expect(categorySource).toContain("priority: true");
    expect(categorySource).toContain("imagePriority={index === 0}");
    expect(giftsSource).toContain("imagePriority={index === 0}");
    expect(gallerySource).toContain("priority={activeImageIndex === 0}");
  });

  it("keeps hero media full-viewport sized and only prioritizes the first slide", () => {
    const source = read("src/components/cinematic-hero-sequence.tsx");

    expect(source).toContain('sizes = "100vw"');
    expect(source).toContain("priority={priority && index === 0}");
  });

  it("keeps product cards on a stable commerce aspect ratio with responsive image sizes", () => {
    const source = read("src/components/product-card.tsx");

    expect(source).toContain("relative aspect-[5/4] overflow-hidden");
    expect(source).toContain("sm:aspect-[4/5]");
    expect(source).toContain("DEFAULT_PRODUCT_CARD_IMAGE_SIZES");
    expect(source).toContain("(min-width: 1280px) 18rem");
    expect(source).toContain("(min-width: 640px) 50vw");
  });

  it("does not viewport-prefetch the repeated product card link", () => {
    const source = read("src/components/product-card.tsx");

    expect(source).toContain("group/product-link block min-w-0");
    expect(source.match(/prefetch=\{false\}/g)).toHaveLength(1);
  });

  it("keeps broad navigation prefetch limited to high-intent category routes", () => {
    const prefetchSource = read("src/components/category-route-prefetch.ts");
    const headerSource = read("src/components/site-header.tsx");
    const mobileNavSource = read("src/components/mobile-nav.tsx");
    const homeSource = read("src/app/page.tsx");

    expect(prefetchSource).toContain("categoryRoutePrefetchPolicy");
    expect(prefetchSource).toContain('allowedHrefPrefix: "/category/"');
    expect(prefetchSource).toContain('broadNavPrefetch: "intent-only"');
    expect(prefetchSource).toContain("connection?.saveData");
    expect(prefetchSource).toContain('"slow-2g", "2g"');

    expect(headerSource).toContain("categoryNavHrefs");
    expect(headerSource).toContain(".filter(isCategoryHref)");
    expect(headerSource).toContain(
      "onCategoryIntent={categoryPrefetch.prefetch}",
    );
    expect(headerSource).toContain(
      "onOpenCategoryPrefetch={categoryPrefetch.prefetchAll}",
    );
    expect(headerSource).not.toContain("prefetchOnHomeIdle: true");
    expect(mobileNavSource).toContain("onPointerEnter=");
    expect(mobileNavSource).toContain("onFocus=");
    expect(mobileNavSource).toContain("prefetch={false}");
    expect(headerSource).toContain('href="/account"');
    expect(headerSource).toContain('href="/search"');
    expect(headerSource).toContain('href="/service"');
    expect(headerSource).toContain('href="/wishlist"');
    expect(
      headerSource.match(/prefetch=\{false\}/g)?.length ?? 0,
    ).toBeGreaterThanOrEqual(5);
    expect(
      homeSource.match(/prefetch=\{false\}/g)?.length ?? 0,
    ).toBeGreaterThanOrEqual(3);
    expect(headerSource).not.toContain("prefetch={true}");
    expect(mobileNavSource).not.toContain("prefetch={true}");
  });

  it("defers the fixed editorial background until the band nears the viewport", () => {
    const homeSource = read("src/app/page.tsx");
    const componentSource = read(
      "src/components/deferred-fixed-background-band.tsx",
    );
    const stylesSource = read("src/styles/globals.css");
    const baseFixedBandRule =
      /\.boutique-fixed-image-band\s*\{[\s\S]*?\n\}/u.exec(stylesSource)?.[0] ??
      "";

    expect(homeSource).toContain("<DeferredFixedBackgroundBand");
    expect(componentSource).toContain("IntersectionObserver");
    expect(componentSource).toContain('rootMargin: "900px 0px"');
    expect(baseFixedBandRule).toContain("--boutique-fixed-image-url");
    expect(baseFixedBandRule).not.toContain(
      'url("/brand/boutique/category-rings.avif") center',
    );
    expect(stylesSource).toContain("clip-path: inset(0)");
    expect(stylesSource).toContain("position: fixed");
    expect(stylesSource).toContain(
      '.boutique-fixed-image-band[data-fixed-bg-loaded="true"]',
    );
    expect(stylesSource).toContain(
      '.boutique-fixed-image-band[data-fixed-bg-loaded="true"]::before',
    );
    expect(stylesSource).toContain(
      'url("/brand/boutique/category-rings.avif")',
    );
    expect(stylesSource).toContain(
      'url("/brand/boutique/product-detail.avif")',
    );
    expect(stylesSource).toContain("background-attachment: scroll, fixed");
  });

  it("serves local brand media with a long-lived immutable cache policy", () => {
    const nextConfigSource = read("next.config.js");

    expect(nextConfigSource).toContain('source: "/brand/:path*"');
    expect(nextConfigSource).toContain(
      'value: "public, max-age=31536000, immutable"',
    );
  });

  it("keeps the legacy checkout category thumbnail route backed by local media", () => {
    expect(
      existsSync(
        path.join(root, "public", "brand", "v2", "category-bracelets.avif"),
      ),
    ).toBe(true);
  });

  it("keeps external connection hints on the current media and font whitelist", () => {
    const layoutSource = read("src/app/layout.tsx");
    const nextConfigSource = read("next.config.js");
    const remoteHostnames = Array.from(
      nextConfigSource.matchAll(/hostname:\s*"(?<hostname>[^"]+)"/g),
    ).map((match) => match.groups?.hostname);

    expect(layoutSource).not.toMatch(
      /rel=["'](?:preconnect|dns-prefetch)["']/u,
    );
    expect(layoutSource).toContain("next/font/google");
    expect(remoteHostnames).toEqual([
      "images.unsplash.com",
      "res.cloudinary.com",
      "upload.wikimedia.org",
      "cdn.shopify.com",
    ]);
    expect(nextConfigSource).not.toContain("fonts.googleapis.com");
    expect(nextConfigSource).not.toContain("fonts.gstatic.com");
  });

  it("prioritizes only the initial product gallery image and lazy-loads later active images", () => {
    const source = read(
      "src/app/product/[slug]/_components/product-gallery.tsx",
    );

    expect(source).toContain("priority={activeImageIndex === 0}");
    expect(source).toContain(
      'loading={activeImageIndex === 0 ? undefined : "lazy"}',
    );
    expect(source).toContain(
      'const mainGalleryImageSizes =\n  "(min-width: 1280px) 58vw, (min-width: 1024px) 54vw, 100vw";',
    );
    expect(source).toContain('loading="lazy"');
    expect(source).toContain(
      'const galleryThumbnailImageSizes =\n  "(min-width: 1024px) 5.5rem, (min-width: 640px) 5rem, 4.5rem";',
    );
    expect(source).toContain("sizes={mainGalleryImageSizes}");
    expect(source).toContain("sizes={galleryThumbnailImageSizes}");
    expect(source).toContain('sizes="100vw"');
  });

  it("keeps category result media on explicit fixed desktop sizes", () => {
    const categorySource = read("src/app/category/[slug]/page.tsx");

    expect(categorySource).toContain(
      'imageSizes="(min-width: 1280px) 18rem, (min-width: 1024px) calc((100vw - 24rem) / 2), (min-width: 640px) 50vw, 100vw"',
    );
  });

  it("keeps recommendation and recently viewed rails on inherited product-card sizes", () => {
    const recentlyViewedSource = read(
      "src/app/product/[slug]/_components/recently-viewed-products.tsx",
    );
    const productPageSource = read("src/app/product/[slug]/page.tsx");

    expect(recentlyViewedSource).toContain("<ProductCard");
    expect(recentlyViewedSource).not.toContain("imagePriority=");
    expect(recentlyViewedSource).not.toContain("imageSizes=");
    expect(productPageSource).toContain(
      "data-testid={`product-recommendation-rail-${rail.id}`}",
    );
    expect(productPageSource).toContain("contextLabel={rail.cardContextLabel}");
    expect(productPageSource).not.toContain("imagePriority={");
  });

  it("keeps fill-based next/image usage paired with explicit sizes", () => {
    const offenders = listSourceFiles(sourceRoots).flatMap((filePath) => {
      const source = readFileSync(filePath, "utf8");
      const imageTags = source.match(/<Image(?=[\s/>])[\s\S]*?\/>/g) ?? [];

      return imageTags
        .filter((tag) => /\bfill\b/.test(tag) && !/\bsizes=/.test(tag))
        .map((tag) => ({
          file: normalizePath(filePath),
          line: getLineNumber(source, tag),
        }));
    });

    expect(offenders).toEqual([]);
  });

  it("does not prioritize image surfaces that are hidden by default", () => {
    const offenders = listSourceFiles(sourceRoots).flatMap((filePath) => {
      const source = readFileSync(filePath, "utf8");
      const mediaTags =
        source.match(/<(?:Image|BrandMediaPanel)(?=[\s/>])[\s\S]*?\/>/g) ?? [];

      return mediaTags
        .filter(
          (tag) =>
            /\bpriority(?:[\s/>=]|$)/.test(tag) &&
            /\bclassName="[^"]*\bhidden\b[^"]*"/.test(tag),
        )
        .map((tag) => ({
          file: normalizePath(filePath),
          line: getLineNumber(source, tag),
        }));
    });

    expect(offenders).toEqual([]);
  });

  it("does not prioritize media inside hidden aria-hidden sections", () => {
    const offenders = listSourceFiles(sourceRoots).flatMap((filePath) => {
      const source = readFileSync(filePath, "utf8");
      const hiddenSections =
        source.match(
          /<RevealSection(?=[^>]*aria-hidden="true")(?=[^>]*className="hidden")[^>]*>[\s\S]*?<\/RevealSection>/g,
        ) ?? [];

      return hiddenSections
        .filter((section) => /\bpriority(?:[\s/>=]|$)/.test(section))
        .map((section) => ({
          file: normalizePath(filePath),
          line: getLineNumber(source, section),
        }));
    });

    expect(offenders).toEqual([]);
  });
});

function listSourceFiles(roots: string[]) {
  return roots.flatMap((root) => walk(root));
}

function walk(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const fullPath = path.join(directory, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) return walk(fullPath);

    return sourceExtensions.has(path.extname(fullPath)) ? [fullPath] : [];
  });
}

function getLineNumber(source: string, snippet: string) {
  return source.slice(0, source.indexOf(snippet)).split("\n").length;
}

function normalizePath(filePath: string) {
  return filePath.replaceAll(path.sep, "/");
}

function read(relativePath: string) {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}
