import { expect, test } from "@playwright/test";

import { signInCustomerWithFixture } from "./helpers/customer-auth";

test.describe("authenticated customer fixture", () => {
  test.setTimeout(60_000);

  test("opens the account dashboard with reusable customer state", async ({
    page,
  }, testInfo) => {
    const fixture = await signInCustomerWithFixture(
      page,
      testInfo.project.name,
    );

    const visibleAccountSurface = (testId: string) =>
      page.locator(`[data-testid="${testId}"]:visible`);

    await expect(visibleAccountSurface("account-local-order")).toHaveCount(1);
    await expect(visibleAccountSurface("account-local-order")).toBeVisible();
    await expect(
      visibleAccountSurface("account-shopify-mirror-order"),
    ).toBeVisible();
    await expect(
      visibleAccountSurface("account-wishlist-decision-support"),
    ).toBeVisible();
    await expect(
      visibleAccountSurface("account-saved-sizes-form"),
    ).toBeVisible();
    await expect(
      visibleAccountSurface("account-privacy-shortcut-context"),
    ).toBeVisible();

    // The export endpoint is browser-independent and deliberately allows only
    // five requests per customer. Exercise it once while retaining the full
    // account UI flow across every browser and viewport project.
    if (testInfo.project.name === "chromium-desktop") {
      const exportResponse = await page.request.get("/account/privacy/export");
      const exportBody = (await exportResponse.json()) as {
        customer?: {
          email?: string | null;
          orders?: unknown[];
          savedSizes?: unknown[];
          shopifyOrderMirrors?: unknown[];
        };
      };

      expect(exportResponse.status()).toBe(200);
      expect(exportBody.customer?.email).toBe(fixture.email);
      expect(exportBody.customer?.orders?.length).toBeGreaterThan(0);
      expect(exportBody.customer?.savedSizes?.length).toBeGreaterThan(0);
      expect(exportBody.customer?.shopifyOrderMirrors?.length).toBeGreaterThan(
        0,
      );
    }

    await page.goto(`/account/orders/${fixture.localOrderId}`, {
      waitUntil: "domcontentloaded",
    });
    const orderTimeline = page.locator(
      '[data-testid="order-status-timeline"]:visible',
    );

    await expect(orderTimeline).toHaveCount(1);
    await expect(orderTimeline).toBeVisible();
    await expect(
      page.locator('[data-testid="order-recovery-shortcuts"]:visible'),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: fixture.localOrderNumber,
      }),
    ).toBeVisible();
  });

  test("a service request submitted while logged in appears with its timeline on /account/service (H-05)", async ({
    page,
  }, testInfo) => {
    const fixture = await signInCustomerWithFixture(
      page,
      `${testInfo.project.name}-service`,
    );
    // A unique token per run: the fixture customer/email is reused across
    // repeated local runs (deterministic namespace), so a fixed message would
    // match multiple accumulated requests on rerun.
    const uniqueMessage = `H-05 e2e ${Date.now()}: מעקב אחר סטטוס הפנייה מהאזור האישי.`;

    await page.goto("/service", { waitUntil: "domcontentloaded" });
    await page.locator("#name").fill("H-05 E2E");
    await page.locator("#phone").fill("050-0000000");
    await page.locator("#email").fill(fixture.email);
    await page.locator("#message").fill(uniqueMessage);
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes("/service") && response.status() < 400,
      ),
      page.getByRole("button", { name: "שליחה" }).click(),
    ]);

    await expect(
      page.locator('[data-testid="service-request-success-reference"]'),
    ).toBeVisible();

    await page.goto("/account/service", { waitUntil: "domcontentloaded" });
    // Newest-first ordering: the request just created is always the first
    // card, regardless of how many prior requests this reused fixture
    // customer has accumulated across local test reruns.
    const newestCard = page
      .locator('[data-testid="account-service-request-card"]')
      .first();

    await expect(newestCard).toContainText(uniqueMessage);
    await expect(
      newestCard.locator('[data-testid="account-service-request-timeline"]'),
    ).toContainText("הפנייה התקבלה");
  });
});
