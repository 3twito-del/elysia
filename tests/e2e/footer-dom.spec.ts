import { expect, test } from "@playwright/test";

const footerHeadings = ["קולקציות", "תמיכה", "Elysia", "מדיניות"] as const;
const categoryRoutes = [
  "/category/rings",
  "/category/necklaces",
  "/category/earrings",
  "/category/bracelets",
] as const;
const legacyFooterCategories =
  "\u05e7\u05d8\u05d2\u05d5\u05e8\u05d9\u05d5\u05ea";
const legacyFooterOnlineService =
  "\u05e9\u05d9\u05e8\u05d5\u05ea \u05d0\u05d5\u05e0\u05dc\u05d9\u05d9\u05df";
const legacyCatalogNavLabel =
  "\u05e0\u05d9\u05d5\u05d5\u05d8 \u05e7\u05d8\u05dc\u05d5\u05d2";
const legacyCommerceNavLabel =
  "\u05e0\u05d9\u05d5\u05d5\u05d8 \u05e9\u05d9\u05e8\u05d5\u05ea \u05d5\u05e7\u05e0\u05d9\u05d9\u05d4";

test.describe("footer DOM and accessibility structure", () => {
  test("renders a single RTL Hebrew footer without duplicate nav columns", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    const footerState = await page.evaluate(() => {
      const footers = Array.from(document.querySelectorAll("footer"));
      const footer = footers[0] ?? null;

      if (!footer) {
        return {
          footerCount: footers.length,
          disclosureOpenStates: [],
          headingTexts: [],
          htmlDir: document.documentElement.dir,
          htmlLang: document.documentElement.lang,
          lowerItemCenters: [],
          navHeadingTops: [],
          navLabels: [],
          text: "",
        };
      }

      return {
        footerCount: footers.length,
        disclosureOpenStates: Array.from(
          footer.querySelectorAll<HTMLDetailsElement>(
            "[data-footer-nav-disclosure]",
          ),
        ).map((details) => details.open),
        headingTexts: Array.from(
          footer.querySelectorAll("h1,h2,h3,h4,h5,h6"),
        ).map((heading) => (heading.textContent ?? "").trim()),
        htmlDir: document.documentElement.dir,
        htmlLang: document.documentElement.lang,
        lowerItemCenters: [
          footer.querySelector('[data-testid="footer-copyright"]'),
          footer.querySelector('[data-testid="footer-business-details"]'),
          footer.querySelector('nav[aria-label="רשתות חברתיות"]'),
        ]
          .filter((element): element is HTMLElement => element instanceof HTMLElement)
          .map((element) => {
            const rect = element.getBoundingClientRect();

            return Math.round(rect.top + rect.height / 2);
          }),
        navHeadingTops: Array.from(footer.querySelectorAll("nav h2")).map(
          (heading) => Math.round(heading.getBoundingClientRect().top),
        ),
        navLabels: Array.from(footer.querySelectorAll("nav")).map(
          (nav) => nav.getAttribute("aria-label") ?? "",
        ),
        text: (footer.textContent ?? "").replace(/\s+/g, " ").trim(),
      };
    });

    expect(footerState.footerCount).toBe(1);
    expect(footerState.htmlDir).toBe("rtl");
    expect(footerState.htmlLang).toBe("he");
    expect(footerState.headingTexts).toEqual([...footerHeadings]);
    expect(footerState.navLabels).toEqual([
      "ניווט תחתון",
      "רשתות חברתיות",
    ]);
    expect(footerState.text).not.toContain("תמיכה - המשך");
    expect(footerState.text).not.toContain("שירות אונליין");

    for (const heading of footerHeadings) {
      expect(
        footerState.headingTexts.filter((text) => text === heading),
        heading,
      ).toHaveLength(1);
    }

    const ariaSnapshot = await page.locator("body").ariaSnapshot();

    expect(countOccurrences(ariaSnapshot, "- contentinfo:")).toBe(1);
    expect(countOccurrences(ariaSnapshot, 'heading "קולקציות"')).toBe(1);
    expect(countOccurrences(ariaSnapshot, 'heading "תמיכה"')).toBe(1);
    expect(countOccurrences(ariaSnapshot, 'heading "Elysia"')).toBe(1);
    expect(countOccurrences(ariaSnapshot, 'heading "מדיניות"')).toBe(1);
    expect(ariaSnapshot).not.toContain("תמיכה - המשך");
    expect(ariaSnapshot).not.toContain("שירות אונליין");

    if ((page.viewportSize()?.width ?? 0) >= 768) {
      expect(footerState.disclosureOpenStates).toEqual([
        true,
        true,
        true,
        true,
      ]);
      if ((page.viewportSize()?.width ?? 0) >= 1024) {
        expect(
          Math.max(...footerState.navHeadingTops) -
            Math.min(...footerState.navHeadingTops),
        ).toBeLessThanOrEqual(4);
        expect(
          Math.max(...footerState.lowerItemCenters) -
            Math.min(...footerState.lowerItemCenters),
        ).toBeLessThanOrEqual(40);
      }
    } else {
      expect(footerState.disclosureOpenStates).toEqual([
        false,
        false,
        false,
        false,
      ]);

      const disclosureSummaries = page.locator(
        "footer [data-footer-nav-disclosure] summary",
      );

      await disclosureSummaries.nth(0).click();
      await expect
        .poll(() => getFooterDisclosureOpenStates(page))
        .toEqual([true, false, false, false]);

      await disclosureSummaries.nth(1).click();
      await expect
        .poll(() => getFooterDisclosureOpenStates(page))
        .toEqual([false, true, false, false]);
    }
  });

  test("keeps service page footer sections out of duplicate SSR payload", async ({
    request,
  }) => {
    const response = await request.get("/service");
    const html = await response.text();

    expect(response.ok()).toBe(true);
    expect(countOccurrences(html, "<footer")).toBe(1);
    expect(countOccurrences(html, "<main")).toBeGreaterThanOrEqual(1);
    expect(countOccurrences(html, "<header")).toBeGreaterThanOrEqual(1);
    expect(html).toContain(footerHeadings[1]);
    expect(html).not.toContain("שירות אונליין");
    expect(html).not.toContain("ניווט שירות והזמנה");
    expect(html).not.toContain("ניווט קטלוג");
  });

  test("keeps search page ordered before the single global footer", async ({
    page,
    request,
  }) => {
    const response = await request.get("/search");
    const html = await response.text();

    expect(response.ok()).toBe(true);
    expect(countOccurrences(html, "<footer")).toBe(1);
    expect(countOccurrences(html, "<main")).toBeGreaterThanOrEqual(1);
    expect(countOccurrences(html, "<header")).toBeGreaterThanOrEqual(1);
    expect(html).toContain(footerHeadings[1]);
    expect(html).not.toContain(legacyFooterOnlineService);
    expect(html).not.toContain(legacyCatalogNavLabel);
    expect(html).not.toContain(legacyCommerceNavLabel);

    await page.goto("/search", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(
      '[data-testid="search-results-summary"], [data-testid="search-empty-state"], [data-testid="search-results-grid"], [data-testid="search-results-list"]',
    );

    const searchState = await page.evaluate(() => {
      const header = document.querySelector("header");
      const main = document.querySelector("main");
      const footer = document.querySelector("footer");
      const searchContent =
        document.querySelector("#search-controls") ??
        document.querySelector("#search-results-section");
      const comesBefore = (first: Element | null, second: Element | null) =>
        Boolean(
          first &&
          second &&
          (first.compareDocumentPosition(second) &
            Node.DOCUMENT_POSITION_FOLLOWING) !==
            0,
        );

      return {
        footerCount: document.querySelectorAll("footer").length,
        footerHeadingTexts: footer
          ? Array.from(footer.querySelectorAll("h1,h2,h3,h4,h5,h6")).map(
              (heading) => (heading.textContent ?? "").trim(),
            )
          : [],
        footerText: (footer?.textContent ?? "").replace(/\s+/g, " ").trim(),
        headerBeforeMain: comesBefore(header, main),
        headerCount: document.querySelectorAll("header").length,
        mainBeforeFooter: comesBefore(main, footer),
        mainCount: document.querySelectorAll("main").length,
        navLabels: footer
          ? Array.from(footer.querySelectorAll("nav")).map(
              (nav) => nav.getAttribute("aria-label") ?? "",
            )
          : [],
        searchContentBeforeFooter: comesBefore(searchContent, footer),
        sequence: Array.from(
          document.querySelectorAll("header, main, footer"),
        ).map((element) => element.tagName.toLowerCase()),
      };
    });

    expect(searchState.headerCount).toBe(1);
    expect(searchState.mainCount).toBe(1);
    expect(searchState.footerCount).toBe(1);
    expect(searchState.headerBeforeMain).toBe(true);
    expect(searchState.mainBeforeFooter).toBe(true);
    expect(searchState.searchContentBeforeFooter).toBe(true);
    expect(searchState.sequence).toEqual(["header", "main", "footer"]);
    expect(searchState.footerHeadingTexts).toEqual([...footerHeadings]);
    expect(searchState.navLabels).toEqual([
      "\u05e0\u05d9\u05d5\u05d5\u05d8 \u05ea\u05d7\u05ea\u05d5\u05df",
      "\u05e8\u05e9\u05ea\u05d5\u05ea \u05d7\u05d1\u05e8\u05ea\u05d9\u05d5\u05ea",
    ]);
    expect(searchState.footerText).not.toContain(legacyFooterCategories);
    expect(searchState.footerText).not.toContain(legacyFooterOnlineService);
  });

  test("keeps category routes ordered as header, main content, then one footer", async ({
    page,
  }) => {
    for (const route of categoryRoutes) {
      const response = await page.goto(route, {
        waitUntil: "domcontentloaded",
      });
      expect(response?.ok(), route).toBe(true);

      const earlyState = await getCategoryFooterState(page);

      expect(earlyState.loadingShellCount, route).toBe(0);
      expect(earlyState.headerCount, route).toBe(1);
      expect(earlyState.mainCount, route).toBe(1);
      expect(earlyState.footerCount, route).toBe(1);
      expect(earlyState.headerBeforeMain, route).toBe(true);
      expect(earlyState.mainBeforeFooter, route).toBe(true);

      await page.waitForSelector(
        '[data-testid="category-results-grid"], [data-testid="category-empty-state"]',
      );

      const finalState = await getCategoryFooterState(page);

      expect(finalState.loadingShellCount, route).toBe(0);
      expect(finalState.headerCount, route).toBe(1);
      expect(finalState.mainCount, route).toBe(1);
      expect(finalState.footerCount, route).toBe(1);
      expect(finalState.productsBeforeFooter, route).toBe(true);
      expect(finalState.sequence, route).toEqual(["header", "main", "footer"]);
    }
  });
});

function countOccurrences(source: string, pattern: string) {
  return source.split(pattern).length - 1;
}

async function getCategoryFooterState(page: {
  evaluate: <T>(callback: () => T) => Promise<T>;
}) {
  return page.evaluate(() => {
    const header = document.querySelector("header");
    const main = document.querySelector("main");
    const footer = document.querySelector("footer");
    const products = document.querySelector("#category-products");
    const absoluteTop = (element: Element) => {
      const rect = element.getBoundingClientRect();

      return rect.top + window.scrollY;
    };
    const absoluteBottom = (element: Element) => {
      const rect = element.getBoundingClientRect();

      return rect.bottom + window.scrollY;
    };
    const comesBefore = (first: Element | null, second: Element | null) =>
      Boolean(
        first &&
        second &&
        (first.compareDocumentPosition(second) &
          Node.DOCUMENT_POSITION_FOLLOWING) !==
          0,
      );

    return {
      footerCount: document.querySelectorAll("footer").length,
      headerBeforeMain: comesBefore(header, main),
      headerCount: document.querySelectorAll("header").length,
      loadingShellCount: document.querySelectorAll(
        '[data-testid="category-loading-state"]',
      ).length,
      mainBeforeFooter: comesBefore(main, footer),
      mainCount: document.querySelectorAll("main").length,
      productsBeforeFooter: Boolean(
        products && footer && absoluteBottom(products) <= absoluteTop(footer),
      ),
      sequence: Array.from(
        document.querySelectorAll("header, main, footer"),
      ).map((element) => element.tagName.toLowerCase()),
    };
  });
}

async function getFooterDisclosureOpenStates(page: {
  evaluate: <T>(callback: () => T) => Promise<T>;
}) {
  return page.evaluate(() =>
    Array.from(
      document.querySelectorAll<HTMLDetailsElement>(
        "footer [data-footer-nav-disclosure]",
      ),
    ).map((details) => details.open),
  );
}
