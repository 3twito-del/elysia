import { expect, test } from "@playwright/test";

const footerHeadings = ["קטלוג", "שירות וקנייה", "מידע"] as const;

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
      "ניווט קטלוג",
      "ניווט שירות וקנייה",
      "ניווט מידע",
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
});

function countOccurrences(source: string, pattern: string) {
  return source.split(pattern).length - 1;
}
