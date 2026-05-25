import { expect, test, type Page } from "@playwright/test";

import { HEADER_BENCHMARK_VIEWPORTS } from "../../scripts/header-benchmark";
import { captureBenchmarkSnapshot } from "../../scripts/benchmarks/core";
import { benchmarkParts } from "../../scripts/benchmarks/extractors/public-parts";

const desktop = HEADER_BENCHMARK_VIEWPORTS.find(
  (viewport) => viewport.name === "desktop",
)!;
const mobile = HEADER_BENCHMARK_VIEWPORTS.find(
  (viewport) => viewport.name === "mobile",
)!;

test.describe("header benchmark extractor", () => {
  test("extracts Elysia header metrics on desktop and mobile", async ({
    page,
  }) => {
    for (const viewport of [desktop, mobile]) {
      await page.setViewportSize({
        height: viewport.height,
        width: viewport.width,
      });
      await page.goto("/", { waitUntil: "domcontentloaded" });

      const headerPart = benchmarkParts.find((part) => part.id === "header")!;
      const snapshot = await captureBenchmarkSnapshot(
        page,
        headerPart,
        { name: "Elysia", role: "local", sourceUrl: "/", weight: 0 },
        viewport,
        { label: "home", path: "/" },
      );

      expect(snapshot.loadStatus).toBe("ok");
      expect(snapshot.enoughData).toBe(true);
      expect(snapshot.metrics.headerFound).toBe(true);
      expect(snapshot.metrics.brandWordmarkOnly).toBe(true);
      expect(snapshot.metrics.hasSearchEntry).toBe(true);

      if (viewport.name === "desktop") {
        expect(snapshot.metrics.desktopNavVisible).toBe(true);
        expect(snapshot.metrics.linkCount).toBe(9);
        expect(snapshot.metrics.buttonCount).toBe(4);
      } else {
        expect(snapshot.metrics.desktopNavVisible).toBe(false);
        expect(snapshot.metrics.linkCount).toBe(3);
        expect(snapshot.metrics.buttonCount).toBe(3);
        expect(snapshot.metrics.mobileNavTriggerVisible).toBe(true);
      }
    }
  });

  test("extracts every configured public benchmark part locally", async ({
    page,
  }) => {
    await page.setViewportSize({
      height: desktop.height,
      width: desktop.width,
    });

    for (const part of benchmarkParts) {
      const target = part.localTargets[0]!;

      await page.goto(target.path, { waitUntil: "domcontentloaded" });
      await page
        .waitForLoadState("networkidle", { timeout: 5_000 })
        .catch(() => undefined);

      if (part.id === "plp") {
        await waitForVisibleSelector(
          page,
          "[data-testid='category-results-grid'], [data-testid='search-results-grid'], [data-testid='gift-results-grid']",
        );
      }

      if (part.id === "product-card") {
        await waitForVisibleSelector(page, "[data-testid='product-card']");
      }

      const snapshot = await captureBenchmarkSnapshot(
        page,
        part,
        { name: "Elysia", role: "local", sourceUrl: "/", weight: 0 },
        desktop,
        target,
      );

      expect(snapshot.loadStatus, part.id).toBe("ok");
      expect(snapshot.enoughData, part.id).toBe(true);
      expect(snapshot.metrics.elementFound, part.id).toBe(true);

      if (part.id === "plp" || part.id === "product-card") {
        expect(snapshot.metrics.priceTextPresent, part.id).toBe(true);
        expect(
          Number(snapshot.metrics.productLinkCount),
          part.id,
        ).toBeGreaterThan(0);
        expect(Number(snapshot.metrics.imageCount), part.id).toBeGreaterThan(0);
      }
    }
  });
});

async function waitForVisibleSelector(page: Page, selector: string) {
  await expect
    .poll(() => page.evaluate(isSelectorVisible, selector))
    .toBe(true);
}

function isSelectorVisible(selector: string) {
  const element = document.querySelector(selector);

  if (!(element instanceof HTMLElement)) return false;

  const styles = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();

  return (
    styles.display !== "none" &&
    styles.visibility !== "hidden" &&
    Number(styles.opacity) > 0 &&
    rect.height > 0 &&
    rect.width > 0
  );
}
