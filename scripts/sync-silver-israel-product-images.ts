import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import sharp from "sharp";

import { getSeedProducts } from "../prisma/seed-catalog";

const supplierOrigin = "https://silverisrael.co.il";
const sitemapIndexUrl = `${supplierOrigin}/sitemap_index.xml`;
const outputPublicPath = "/brand/silver-israel";
const outputDir = path.join(process.cwd(), "public", "brand", "silver-israel");
const manifestPath = path.join(
  process.cwd(),
  "prisma",
  "seed-silver-israel-images.ts",
);
const maxImagesPerProduct = 6;
const userAgent =
  "Mozilla/5.0 (compatible; ElysiaCatalogImageSync/1.0; +https://elysia-jewellery.com)";

type ProductImageSyncResult = {
  imageUrls: string[];
  productSlug: string;
  publicUrls: string[];
  sourceUrl: string;
};

async function main() {
  const products = getSeedProducts();
  const sitemapImagesByProductUrl = await loadSitemapProductImageMap();

  await resetOutputDirectory();

  const results: ProductImageSyncResult[] = [];
  const missing: Array<{ productSlug: string; sourceUrl: string }> = [];

  for (const [index, product] of products.entries()) {
    const imageUrls = await getProductImageUrls({
      productSlug: product.slug,
      sitemapImagesByProductUrl,
      sourceCode: product.sourceCode,
      sourceUrl: product.sourceUrl,
    });

    if (imageUrls.length === 0) {
      missing.push({ productSlug: product.slug, sourceUrl: product.sourceUrl });
      continue;
    }

    const publicUrls: string[] = [];

    for (const [imageIndex, imageUrl] of imageUrls
      .slice(0, maxImagesPerProduct)
      .entries()) {
      const filename = `${product.slug}-${String(imageIndex + 1).padStart(
        2,
        "0",
      )}.avif`;
      const targetPath = path.join(outputDir, filename);
      const image = await downloadImage(imageUrl);

      await sharp(image)
        .rotate()
        .resize({
          fit: "inside",
          height: 1400,
          width: 1400,
          withoutEnlargement: true,
        })
        .avif({ effort: 5, quality: 70 })
        .toFile(targetPath);

      publicUrls.push(`${outputPublicPath}/${filename}`);
    }

    results.push({
      imageUrls,
      productSlug: product.slug,
      publicUrls,
      sourceUrl: product.sourceUrl,
    });

    if ((index + 1) % 10 === 0 || index + 1 === products.length) {
      console.log(
        `[silver-israel-images] ${index + 1}/${products.length} products synced`,
      );
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing Silver Israel images for ${missing.length} products:\n${missing
        .map((item) => `${item.productSlug}: ${item.sourceUrl}`)
        .join("\n")}`,
    );
  }

  await writeManifest(results);

  console.log(
    JSON.stringify(
      {
        downloadedImages: results.reduce(
          (total, result) => total + result.publicUrls.length,
          0,
        ),
        manifest: path.relative(process.cwd(), manifestPath),
        products: results.length,
        publicPath: outputPublicPath,
        source: supplierOrigin,
      },
      null,
      2,
    ),
  );
}

async function loadSitemapProductImageMap() {
  const sitemapIndex = await fetchText(sitemapIndexUrl);
  const sitemapUrls = extractXmlLocs(sitemapIndex).filter((url) =>
    /\/product-sitemap\d*\.xml$/iu.test(url),
  );
  const imagesByProductUrl = new Map<string, string[]>();

  for (const sitemapUrl of sitemapUrls) {
    const sitemap = await fetchText(sitemapUrl);

    for (const block of sitemap.matchAll(/<url>[\s\S]*?<\/url>/giu)) {
      const loc = /<loc>([\s\S]*?)<\/loc>/iu.exec(block[0])?.[1];
      if (!loc) continue;

      const imageUrls = Array.from(
        block[0].matchAll(/<image:loc>([\s\S]*?)<\/image:loc>/giu),
      )
        .map((match) => decodeXml(match[1] ?? ""))
        .map(normalizeImageUrl)
        .filter(isProductImageUrl);

      if (imageUrls.length === 0) continue;

      imagesByProductUrl.set(
        normalizeProductUrl(decodeXml(loc)),
        unique(imageUrls),
      );
    }
  }

  return imagesByProductUrl;
}

async function getProductImageUrls(input: {
  productSlug: string;
  sitemapImagesByProductUrl: Map<string, string[]>;
  sourceCode: string;
  sourceUrl: string;
}) {
  const normalizedSourceUrl = normalizeProductUrl(input.sourceUrl);
  const sitemapImages =
    input.sitemapImagesByProductUrl.get(normalizedSourceUrl) ?? [];

  if (sitemapImages.length > 0) return sitemapImages;

  const html = await fetchText(input.sourceUrl).catch(() => "");
  const htmlImages = html ? extractProductImagesFromHtml(html) : [];

  if (htmlImages.length > 0) return unique(htmlImages);

  for (const term of getSourceSearchTerms(input.sourceCode)) {
    const searchHtml = await fetchText(
      `${supplierOrigin}/?s=${encodeURIComponent(term)}`,
    ).catch(() => "");
    const searchImages = searchHtml ? extractProductImagesFromHtml(searchHtml) : [];

    if (searchImages.length > 0) return unique(searchImages);
  }

  return [];
}

function extractProductImagesFromHtml(html: string) {
  const imageUrls = [
    ...Array.from(
      html.matchAll(
        /(?:data-large_image|data-src|href|src|content)=["']([^"']+\.(?:jpe?g|png|webp)(?:\?[^"']*)?)["']/giu,
      ),
    ).map((match) => match[1] ?? ""),
    ...Array.from(
      html.matchAll(
        /https?:\/\/[^"'\s<>]+?\.(?:jpe?g|png|webp)(?:\?[^"'\s<>]*)?/giu,
      ),
    ).map((match) => match[0]),
  ];

  return imageUrls
    .map(decodeXml)
    .map(normalizeImageUrl)
    .filter(isProductImageUrl);
}

async function downloadImage(url: string) {
  const response = await fetchWithRetry(url, {
    headers: {
      accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      "user-agent": userAgent,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status}`);
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.startsWith("image/")) {
    throw new Error(`Expected image response for ${url}, got ${contentType}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

async function fetchText(url: string) {
  const response = await fetchWithRetry(url, {
    headers: { "user-agent": userAgent },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  return response.text();
}

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  attempts = 3,
) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fetch(url, init);
    } catch (error) {
      lastError = error;
      await wait(500 * attempt);
    }
  }

  throw lastError;
}

async function resetOutputDirectory() {
  const publicDir = path.join(process.cwd(), "public");
  const resolvedOutputDir = path.resolve(outputDir);

  if (!resolvedOutputDir.startsWith(path.resolve(publicDir))) {
    throw new Error(`Refusing to remove output directory: ${resolvedOutputDir}`);
  }

  await rm(outputDir, { force: true, recursive: true });
  await mkdir(outputDir, { recursive: true });
}

async function writeManifest(results: ProductImageSyncResult[]) {
  const entries = results
    .sort((left, right) => left.productSlug.localeCompare(right.productSlug))
    .map(
      (result) =>
        `  ${JSON.stringify(result.productSlug)}: [${result.publicUrls
          .map((url) => JSON.stringify(url))
          .join(", ")}],`,
    );
  const source = [
    "export const seedSilverIsraelProductImages: Record<string, readonly string[]> = {",
    ...entries,
    "};",
    "",
  ].join("\n");
  const previous = await readFile(manifestPath, "utf8").catch(() => null);

  if (previous === source) return;

  await writeFile(manifestPath, source, "utf8");
}

function extractXmlLocs(xml: string) {
  return Array.from(xml.matchAll(/<loc>([\s\S]*?)<\/loc>/giu)).map((match) =>
    decodeXml(match[1] ?? ""),
  );
}

function normalizeImageUrl(value: string) {
  const trimmed = value.trim();

  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`.replace(
      /-\d+x\d+(?=\.(?:jpe?g|png|webp)(?:\?|$))/iu,
      "",
    );
  }

  const absoluteUrl = trimmed.startsWith("/wp-content/")
    ? `${supplierOrigin}${trimmed}`
    : trimmed.startsWith("wp-content/")
      ? `${supplierOrigin}/${trimmed}`
      : trimmed;

  return absoluteUrl.replace(
    /-\d+x\d+(?=\.(?:jpe?g|png|webp)(?:\?|$))/iu,
    "",
  );
}

function normalizeProductUrl(value: string) {
  const url = new URL(value);
  const decodedPathname = safeDecodeURIComponent(url.pathname)
    .replace(/\/+$/u, "")
    .toLowerCase();

  return `${url.origin.toLowerCase()}${decodedPathname}/`;
}

function safeDecodeURIComponent(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function isProductImageUrl(value: string) {
  try {
    const url = new URL(value);
    const pathname = url.pathname.toLowerCase();

    return (
      url.origin === supplierOrigin &&
      pathname.includes("/wp-content/uploads/") &&
      /\.(?:jpe?g|png|webp)$/iu.test(pathname) &&
      !/cropped|logo|banner|placeholder|youtube|google-maps|silver_israel_banner/iu.test(
        pathname,
      )
    );
  } catch {
    return false;
  }
}

function decodeXml(value: string) {
  return value
    .replace(/&amp;/gu, "&")
    .replace(/&quot;/gu, '"')
    .replace(/&#039;/gu, "'")
    .replace(/&lt;/gu, "<")
    .replace(/&gt;/gu, ">");
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function getSourceSearchTerms(sourceCode: string) {
  const trimmed = sourceCode.trim();
  const withoutVariant = trimmed.replace(/-\d+$/u, "");

  return unique([trimmed, withoutVariant]).filter(Boolean);
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
