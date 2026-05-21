import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

describe("product card overlay budget", () => {
  it("keeps product image overlays limited to decision-critical badges", () => {
    const source = read("src/components/product-card.tsx");

    expect(countOccurrences(source, "<Badge")).toBe(2);
    expect(source).not.toContain("product.collection");
    expect(source).toContain("discountPercent");
    expect(source).toContain("לא זמין");
    expect(source).not.toContain("absolute inset-x-2.5 bottom-2.5");
    expect(source).not.toContain(
      '<Badge className="max-w-full font-normal" variant="outline">',
    );
  });

  it("keeps material and stone available as quiet card metadata instead of media overlays", () => {
    const source = read("src/components/product-card.tsx");

    expect(source).toContain(
      "const productDetails = [product.material, product.stone]",
    );
    expect(source).toContain('data-testid="product-card-attributes"');
    expect(source).toContain('data-testid="product-card-highlights"');
    expect(source).toContain("commerceHighlights.slice(0, 2)");
    expect(source).toMatch(/productDetails\.map\(\(detail, index\) =>/);
  });
});

function read(relativePath: string) {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

function countOccurrences(source: string, pattern: string) {
  return source.split(pattern).length - 1;
}
