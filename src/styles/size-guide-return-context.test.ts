import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("size guide save context and product return path", () => {
  it("keeps benchmark support evidence available", () => {
    const benchmark = read(
      "docs/QA_EVIDENCE.md",
    );

    expect(benchmark).toContain("I-045");
    expect(benchmark).toContain("Weighted Score`: 12.0");
    expect(benchmark).toContain("Decision`: Supported");
    expect(benchmark).toContain("Cartier");
    expect(benchmark).toContain("Tiffany");
  });

  it("passes product return context from PDP to the size guide", () => {
    const panel = read(
      "src/app/product/[slug]/_components/product-purchase-panel.tsx",
    );
    const sizeFit = read("src/lib/size-fit.ts");

    expect(panel).toContain("getSizeGuideHref(sizeKind, {");
    expect(panel).toContain("productName");
    expect(panel).toContain("returnTo: `/product/${productSlug}`");
    expect(sizeFit).toContain(
      "options?: { productName?: string; returnTo?: string }",
    );
    expect(sizeFit).toContain('params.set("returnTo", options.returnTo)');
  });

  it("renders safe product return and save context on the size guide", () => {
    const page = read("src/app/size-guide/page.tsx");
    const returnHelper = read("src/app/size-guide/_lib/size-guide-return.ts");
    const tool = read("src/app/size-guide/_components/size-guide-tool.tsx");

    expect(page).toContain("getSafeSizeGuideReturnContext");
    expect(returnHelper).toContain("productPathPattern");
    expect(returnHelper).toContain("categoryPathPattern");
    expect(returnHelper).toContain('value.startsWith("//")');
    expect(returnHelper).toContain('value.includes("://")');
    expect(page).toContain('data-testid="size-guide-product-return-context"');
    expect(page).toContain("<SizeGuideTool initialKind={initialKind} />");
    expect(tool).toContain('data-testid="size-guide-save-context"');
    expect(tool).toContain('href="/account#account-sizes"');
    expect(tool).not.toContain("/checkout");
  });
});

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}
