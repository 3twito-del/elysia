import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("visible site improvement affordances", () => {
  it("keeps the search query clear action visible and route-backed", () => {
    const page = read("src/app/search/page.tsx");
    const controls = read("src/app/search/_components/search-controls.tsx");

    expect(page).toContain("clearSearchHref");
    expect(page).toContain(
      "createSearchHref({ mode: input.mode, view: viewMode })",
    );
    expect(controls).toContain('data-testid="search-clear-query"');
    expect(controls).toContain('aria-label="ניקוי חיפוש"');
    expect(controls).toContain("SearchClearQueryLink");
    expect(controls).toContain("scroll={false}");
  });

  it("keeps the gifts page discovery chips visible and routed to search", () => {
    const gifts = read("src/app/gifts/page.tsx");

    expect(gifts).toContain("giftBudgetChips");
    expect(gifts).toContain("giftRecipientChips");
    expect(gifts).toContain("giftOccasionChips");
    expect(gifts).toContain('data-testid="gift-discovery-chips"');
    expect(gifts).toContain("GiftChipGroup");
    expect(gifts).toContain("/search?q=%D7%9E%D7%AA%D7%A0%D7%94");
  });

  it("keeps FAQ topic filters visible above grouped answers", () => {
    const faq = read("src/app/faq/page.tsx");

    expect(faq).toContain('data-testid="faq-topic-filter-list"');
    expect(faq).toContain("faqGroups.map((group, index)");
    expect(faq).toContain("#faq-group-${index + 1}");
    expect(faq).toContain('id="faq-groups"');
  });

  it("keeps the branches online-only status explicit", () => {
    const branches = read("src/app/branches/page.tsx");

    expect(branches).toContain('data-testid="branches-online-status-banner"');
    expect(branches).toContain('data-testid="branches-online-only-state"');
    expect(branches).toContain(
      'data-testid="branches-online-service-continuity"',
    );
  });

  it("keeps the size guide measurement overview and print ruler visible", () => {
    const sizeGuide = read("src/app/size-guide/page.tsx");

    expect(sizeGuide).toContain("printRulerTicks");
    expect(sizeGuide).toContain("sizeMeasurementSteps");
    expect(sizeGuide).toContain(
      'data-testid="size-guide-measurement-overview"',
    );
    expect(sizeGuide).toContain('data-testid="size-guide-print-ruler"');
  });
});

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}
