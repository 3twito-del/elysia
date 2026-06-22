import { expect, test, type Page } from "@playwright/test";

const consentStorageKey = "elysia_cookie_consent";
const supplierProductSlug = "elysia-supplier-silver-halo-ring";

test.describe("exclusive details accordions", () => {
  test.beforeEach(async ({ page }) => {
    await setCookieConsent(page, "essential");
  });

  test("keeps FAQ questions single-open across grouped sections", async ({
    page,
  }) => {
    await page.goto("/faq");
    await waitForExclusiveDetailsProvider(page);

    const faqDetails = page.locator("#faq-groups details");
    await expect(faqDetails.nth(0)).toBeVisible();
    await expect(faqDetails.nth(3)).toBeVisible();

    await faqDetails.nth(0).locator("summary").click();
    await expectOnlyDetailsOpen(page, "#faq-groups details", [0]);

    await faqDetails.nth(1).locator("summary").click();
    await expectOnlyDetailsOpen(page, "#faq-groups details", [1]);

    await faqDetails.nth(3).locator("summary").click();
    await expectOnlyDetailsOpen(page, "#faq-groups details", [3]);
  });

  test("keeps product details and product FAQ accordions single-open", async ({
    page,
  }) => {
    await page.goto(`/product/${supplierProductSlug}`);
    await waitForExclusiveDetailsProvider(page);
    await waitForPublicMotionReady(page);
    await expect(page.getByTestId("product-purchase-panel")).toHaveAttribute(
      "data-client-ready",
      "true",
    );

    const commerceDetails = page.locator(
      '[data-testid="product-commerce-details"] details',
    );
    await expect(commerceDetails.nth(0)).toBeVisible();
    await expect(commerceDetails.nth(1)).toBeVisible();

    await clickDetailsSummary(commerceDetails.nth(0));
    await expectOnlyDetailsOpen(
      page,
      '[data-testid="product-commerce-details"] details',
      [0],
    );

    await clickDetailsSummary(commerceDetails.nth(1));
    await expectOnlyDetailsOpen(
      page,
      '[data-testid="product-commerce-details"] details',
      [1],
    );

    const productFaqDetails = page.locator(
      '[data-testid="product-faq"] details',
    );
    await productFaqDetails.nth(0).scrollIntoViewIfNeeded();
    await expect(productFaqDetails.nth(0)).toBeVisible();
    await expect(productFaqDetails.nth(1)).toBeVisible();

    await clickDetailsSummary(productFaqDetails.nth(0));
    await expectOnlyDetailsOpen(
      page,
      '[data-testid="product-faq"] details',
      [0],
    );

    await clickDetailsSummary(productFaqDetails.nth(1));
    await expectOnlyDetailsOpen(
      page,
      '[data-testid="product-faq"] details',
      [1],
    );
  });
});

async function expectOnlyDetailsOpen(
  page: Page,
  selector: string,
  openIndexes: number[],
) {
  const total = await page.locator(selector).count();
  const expectedStates = Array.from({ length: total }, (_, index) =>
    openIndexes.includes(index),
  );

  await expect
    .poll(() =>
      page.evaluate((detailsSelector) => {
        return Array.from(
          document.querySelectorAll<HTMLDetailsElement>(detailsSelector),
        ).map((details) => details.open);
      }, selector),
    )
    .toEqual(expectedStates);
}

async function clickDetailsSummary(details: ReturnType<Page["locator"]>) {
  const summary = details.locator("summary");

  await summary.evaluate((element) => {
    element.scrollIntoView({ block: "center", inline: "nearest" });
  });
  await summary.click();
}

async function waitForExclusiveDetailsProvider(page: Page) {
  await page.waitForFunction(
    () => document.documentElement.dataset.exclusiveDetailsReady === "true",
  );
}

async function waitForPublicMotionReady(page: Page) {
  await expect(page.locator("html")).toHaveAttribute(
    "data-public-motion-ready",
    "true",
  );
}

async function setCookieConsent(page: Page, value: "essential" | "all") {
  await page.addInitScript(
    ({ consentStorageKey, value }) => {
      window.localStorage.setItem(
        consentStorageKey,
        JSON.stringify({ value, updatedAt: new Date().toISOString() }),
      );
    },
    { consentStorageKey, value },
  );
}
