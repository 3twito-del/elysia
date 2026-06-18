import { expect, test, type Page } from "@playwright/test";

const routesToCheck = [
  "/",
  "/category/rings",
  "/category/necklaces",
  "/category/earrings",
  "/category/bracelets",
] as const;

test.describe("layout rhythm", () => {
  for (const route of routesToCheck) {
    test(`keeps repeated item groups visually aligned on ${route}`, async ({
      page,
    }) => {
      await page.goto(route, { waitUntil: "networkidle" });

      const groups = page.locator("[data-layout-equal-group]");
      const groupCount = await groups.count();

      expect(groupCount).toBeGreaterThan(0);

      for (let index = 0; index < groupCount; index += 1) {
        const group = groups.nth(index);
        const groupName = await group.getAttribute("data-layout-equal-group");
        const rowDeltas = await getRowHeightDeltas(page, index);

        for (const delta of rowDeltas) {
          expect(
            delta.delta,
            `${route} ${groupName ?? `group-${index}`} row ${delta.rowTop} height mismatch`,
          ).toBeLessThanOrEqual(2);
        }
      }
    });
  }
});

async function getRowHeightDeltas(page: Page, groupIndex: number) {
  return page.evaluate((index) => {
    const group = document.querySelectorAll("[data-layout-equal-group]")[index];
    if (!group) return [];

    const items = Array.from(group.children)
      .map((item) => item.getBoundingClientRect())
      .filter((rect) => rect.width > 0 && rect.height > 0);
    const rows = new Map<number, number[]>();

    for (const rect of items) {
      const rowTop = Math.round(rect.top);
      const heights = rows.get(rowTop) ?? [];

      heights.push(rect.height);
      rows.set(rowTop, heights);
    }

    return Array.from(rows.entries())
      .filter(([, heights]) => heights.length > 1)
      .map(([rowTop, heights]) => ({
        delta: Math.max(...heights) - Math.min(...heights),
        rowTop,
      }));
  }, groupIndex);
}
