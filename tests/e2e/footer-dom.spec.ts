import { expect, test } from "@playwright/test";

const footerHeadings = ["קטלוג", "שירות וקנייה", "מידע"] as const;
const categoryRoutes = [
  "/category/rings",
  "/category/necklaces",
  "/category/earrings",
  "/category/bracelets",
] as const;

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
          footer.querySelector('nav[aria-label="קישורי מדיניות"]'),
          footer.querySelector('nav[aria-label="רשתות חברתיות"]'),
        ].map((element) => {
          if (!(element instanceof HTMLElement)) return 0;

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
      "קישורי מדיניות",
      "רשתות חברתיות",
    ]);
    expect(footerState.text).not.toContain("שירות וקנייה - המשך");
    expect(footerState.text).not.toContain("שירות אונליין");

    for (const heading of footerHeadings) {
      expect(
        footerState.headingTexts.filter((text) => text === heading),
        heading,
      ).toHaveLength(1);
    }

    const ariaSnapshot = await page.locator("body").ariaSnapshot();

    expect(countOccurrences(ariaSnapshot, "- contentinfo:")).toBe(1);
    expect(countOccurrences(ariaSnapshot, 'heading "קטלוג"')).toBe(1);
    expect(countOccurrences(ariaSnapshot, 'heading "שירות וקנייה"')).toBe(1);
    expect(countOccurrences(ariaSnapshot, 'heading "מידע"')).toBe(1);
    expect(ariaSnapshot).not.toContain("שירות וקנייה - המשך");
    expect(ariaSnapshot).not.toContain("שירות אונליין");

    if ((page.viewportSize()?.width ?? 0) >= 768) {
      expect(footerState.disclosureOpenStates).toEqual([true, true, true]);
      expect(
        Math.max(...footerState.navHeadingTops) -
          Math.min(...footerState.navHeadingTops),
      ).toBeLessThanOrEqual(4);
      expect(
        Math.max(...footerState.lowerItemCenters) -
          Math.min(...footerState.lowerItemCenters),
      ).toBeLessThanOrEqual(8);
    } else {
      expect(footerState.disclosureOpenStates).toEqual([false, false, false]);
    }
  });

  test("keeps service page footer sections out of duplicate SSR payload", async ({
    request,
  }) => {
    const response = await request.get("/service");
    const html = await response.text();

    expect(response.ok()).toBe(true);
    expect(countOccurrences(html, "<footer")).toBe(1);
    expect(countOccurrences(html, "<main")).toBe(1);
    expect(countOccurrences(html, "<header")).toBe(1);
    expect(countOccurrences(html, "שירות וקנייה")).toBe(1);
    expect(countOccurrences(html, "קטגוריות")).toBe(0);
    expect(html).not.toContain("שירות אונליין");
    expect(html).not.toContain("ניווט שירות וקנייה");
    expect(html).not.toContain("ניווט קטלוג");
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
