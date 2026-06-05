import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const forbiddenLegacyUiPatterns = [
  /brand-aqua/i,
  /42c9be/i,
  /66\s+201\s+190/i,
  /#eef6f7/i,
  /#effcfb/i,
  /elysia-aqua/i,
];

const approvedBoutiqueTokens = [
  "--brand-porcelain",
  "--brand-ivory",
  "--brand-blush",
  "--brand-champagne",
  "--brand-sage",
  "--brand-pearl",
  "--brand-ink",
  "--brand-espresso",
  "--brand-gold-muted",
];

const productPurchasePanelPath = path.join(
  root,
  "src/app/product/[slug]/_components/product-purchase-panel.tsx",
);
const productCardPath = path.join(root, "src/components/product-card.tsx");

describe("public UI color guard", () => {
  it("keeps legacy aqua color names and tokens out of public UI and hero files", () => {
    const files = [
      path.join(root, "src/styles/globals.css"),
      ...walk(path.join(root, "src/components")).filter(isUiFile),
      ...walk(path.join(root, "src/app")).filter(
        (file) =>
          isUiFile(file) &&
          !file.includes(
            `${path.sep}src${path.sep}app${path.sep}admin${path.sep}`,
          ),
      ),
      path.join(root, "src/lib/brand-media.ts"),
    ].filter((file) => !file.includes(".test."));

    const violations = files.flatMap((file) => {
      const content = removeApprovedWarmColorExceptions(
        file,
        readFileSync(file, "utf8"),
      );

      return forbiddenLegacyUiPatterns
        .filter((pattern) => pattern.test(content))
        .map((pattern) => `${path.relative(root, file)} matched ${pattern}`);
    });

    expect(violations).toEqual([]);
  });

  it("keeps boutique palette tokens explicit in global CSS", () => {
    const css = readFileSync(path.join(root, "src/styles/globals.css"), "utf8");

    for (const token of approvedBoutiqueTokens) {
      expect(css).toContain(`${token}:`);
    }
  });

  it("keeps hero media alt text material-neutral", () => {
    const brandMedia = readFileSync(
      path.join(root, "src/lib/brand-media.ts"),
      "utf8",
    );

    expect(brandMedia).not.toMatch(/\baqua\b/i);
  });

  it("keeps product blur placeholders warm-neutral and free of legacy aqua", () => {
    const productCardSource = readFileSync(
      path.join(root, "src/components/product-card.tsx"),
      "utf8",
    );
    const decodedBlurData = decodeDataUrl(
      extractProductImageBlurDataUrl(productCardSource),
    );

    const violations = forbiddenLegacyUiPatterns
      .filter((pattern) => pattern.test(decodedBlurData))
      .map((pattern) => `PRODUCT_IMAGE_BLUR_DATA_URL matched ${pattern}`);

    expect(decodedBlurData).toContain("#f3eee8");
    expect(violations).toEqual([]);
  });

  it("documents product material swatches as the only public warm-color exception", () => {
    const productPurchasePanel = readFileSync(productPurchasePanelPath, "utf8");
    const productCard = readFileSync(productCardPath, "utf8");
    const swatchBlock = extractFunctionBlock(
      productPurchasePanel,
      "function getMetalSwatchStyle",
    );
    const cardSwatchBlock = extractFunctionBlock(
      productCard,
      "function getProductCardSwatchStyle",
    );

    expect(productPurchasePanel).toContain('data-material-swatch="true"');
    expect(productCard).toContain('data-material-swatch="true"');
    expect(swatchBlock).toMatch(/linear-gradient/);
    expect(cardSwatchBlock).toMatch(/linear-gradient/);
    expect(swatchBlock).toMatch(/#fff0b8|#d4a63d|#f7d7c7|#c98e79/);
    expect(cardSwatchBlock).toMatch(/#fff0b8|#d4a63d|#f7d7c7|#c98e79/);
  });
});

function removeApprovedWarmColorExceptions(file: string, content: string) {
  if (file === productPurchasePanelPath) {
    return content.replace(
      extractFunctionBlock(content, "function getMetalSwatchStyle"),
      "",
    );
  }

  if (file === productCardPath) {
    return content.replace(
      extractFunctionBlock(content, "function getProductCardSwatchStyle"),
      "",
    );
  }

  return content;
}

function extractProductImageBlurDataUrl(source: string) {
  const match = /const PRODUCT_IMAGE_BLUR_DATA_URL\s*=\s*"([^"]+)";/.exec(
    source,
  );

  if (!match?.[1]) {
    throw new Error("Could not find PRODUCT_IMAGE_BLUR_DATA_URL");
  }

  return match[1];
}

function decodeDataUrl(dataUrl: string) {
  const [, metadata, data] = /^data:([^,]+),(.*)$/.exec(dataUrl) ?? [];

  if (!metadata || !data) {
    throw new Error("Invalid product image blur data URL");
  }

  if (metadata.includes(";base64")) {
    return Buffer.from(data, "base64").toString("utf8");
  }

  return decodeURIComponent(data);
}

function extractFunctionBlock(source: string, signature: string) {
  const functionIndex = source.indexOf(signature);
  expect(functionIndex).toBeGreaterThanOrEqual(0);

  const blockStart = source.indexOf("{", functionIndex);
  expect(blockStart).toBeGreaterThanOrEqual(0);

  let depth = 0;

  for (let index = blockStart; index < source.length; index += 1) {
    const char = source[index];

    if (char === "{") {
      depth += 1;
    }

    if (char === "}") {
      depth -= 1;

      if (depth === 0) {
        return source.slice(functionIndex, index + 1);
      }
    }
  }

  throw new Error(`Could not extract function block for ${signature}`);
}

function walk(dir: string): string[] {
  if (!statSync(dir, { throwIfNoEntry: false })?.isDirectory()) return [];

  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(dir, entry.name);

    if (entry.isDirectory()) return walk(entryPath);
    if (entry.isFile()) return [entryPath];

    return [];
  });
}

function isUiFile(file: string) {
  return file.endsWith(".css") || file.endsWith(".tsx");
}
