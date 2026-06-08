import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("massive ready design items implementation", () => {
  it("keeps mobile search controls compressed while preserving the filter sheet trigger", () => {
    const controls = read("src/app/search/_components/search-controls.tsx");

    expect(controls).toContain('data-testid="mobile-search-controls"');
    expect(controls).toContain('data-testid="mobile-search-filter-trigger"');
    expect(controls).toContain("sr-only sm:not-sr-only");
    expect(controls).toContain("סינון ומיון");
  });

  it("keeps gifts guided through a compact decision bar before the grid", () => {
    const gifts = read("src/app/gifts/page.tsx");

    expect(gifts).toContain("const giftDecisionGroups");
    expect(gifts).toContain('data-testid="gift-finder-decision-bar"');
    expect(gifts).toContain("חיפוש מתנה רחב");
    expect(gifts).toContain('data-testid="gift-results-grid"');
  });

  it("keeps the category mobile result bar specific and compact", () => {
    const category = read("src/app/category/[slug]/page.tsx");

    expect(category).toContain("categoryVisibleRangeLabel");
    expect(category).toContain(
      'data-testid="category-mobile-filter-sort-summary"',
    );
    expect(category).toContain("סינון");
    expect(category).not.toContain("category-sort-control-row");
  });

  it("adds service, size, wishlist, offline, and branches public recovery cues", () => {
    const service = read("src/app/service/page.tsx");
    const sizeGuide = read("src/app/size-guide/page.tsx");
    const wishlist = read(
      "src/app/wishlist/_components/guest-wishlist-products.tsx",
    );
    const offline = read("src/app/offline/page.tsx");
    const branches = read("src/app/branches/page.tsx");

    expect(service).toContain("const servicePriorityActions");
    expect(service).toContain('data-testid="service-priority-triage"');
    expect(sizeGuide).toContain("const sizeGuideConfidenceNotes");
    expect(sizeGuide).toContain('data-testid="size-guide-confidence-strip"');
    expect(wishlist).toContain(
      'data-testid="wishlist-guest-shortlist-onboarding"',
    );
    expect(offline).toContain("const offlineCapabilityGroups");
    expect(offline).toContain('data-testid="offline-capability-split"');
    expect(offline).not.toContain('href="/checkout"');
    expect(branches).toContain(
      'data-testid="branches-online-compact-highlights"',
    );
  });

  it("keeps legal cookie preference access and PDP gallery status visible", () => {
    const legalCallout = read(
      "src/components/legal-cookie-preferences-callout.tsx",
    );
    const terms = read("src/app/terms/page.tsx");
    const accessibility = read("src/app/accessibility/page.tsx");
    const gallery = read(
      "src/app/product/[slug]/_components/product-gallery.tsx",
    );

    expect(legalCallout).toContain("cookiePreferencesLink.href");
    expect(terms).toContain('testId="terms-cookie-preferences-callout"');
    expect(accessibility).toContain(
      'testId="accessibility-cookie-preferences-callout"',
    );
    expect(gallery).toContain("data-testid={`${input.testId}-summary`}");
    expect(gallery).toContain("תמונה {activeImagePosition} מתוך");
  });

  it("implements the final ready design items for search, home, and PDP", () => {
    const searchIntent = read("src/server/ai/search-intent.ts");
    const styles = read("src/styles/globals.css");
    const purchasePanel = read(
      "src/app/product/[slug]/_components/product-purchase-panel.tsx",
    );
    const purchaseUtils = read(
      "src/app/product/[slug]/_components/product-purchase-utils.ts",
    );

    expect(searchIntent).not.toContain(
      'console.error("[semantic-search:intent]"',
    );
    expect(searchIntent).toContain("Public search must degrade silently");
    expect(styles).toContain("clamp(32rem, 78svh, 48rem)");
    expect(styles).toContain("clamp(28rem, 72svh, 38rem)");
    expect(purchasePanel).toContain(
      'data-testid="product-before-order-summary"',
    );
    expect(purchasePanel).toContain("beforeOrderSummaryItems.map");
    expect(purchaseUtils).toContain("getBeforeOrderSummaryItems");
  });
});

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}
