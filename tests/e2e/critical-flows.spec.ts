import { expect, test, type Page } from "@playwright/test";

const consentStorageKey = "aphrodite_cookie_consent";
const recentlyViewedStorageKey = "aphrodite_recently_viewed";
const cartStorageKey = "aphrodite_cart_session";
const productSlug = "venus-line-ring";
const productName = "טבעת Venus Line";

test.describe("critical shopping flows", () => {
  test.beforeEach(async ({ page }) => {
    await clearBrowserState(page);
  });

  test("adds a product to cart and shows it in checkout", async ({ page }) => {
    await setCookieConsent(page, "essential");
    await page.goto(`/product/${productSlug}`);

    await expect(
      page.getByRole("heading", { name: productName }),
    ).toBeVisible();

    await page.getByRole("button", { name: /הוספה לסל/ }).click();
    await expect(page.getByText(/הפריט נוסף לסל/)).toBeVisible();
    await expect(
      page.getByRole("link", { name: /סל קניות, 1 פריטים/ }),
    ).toBeVisible();

    await page.goto("/checkout");

    await expect(page.getByRole("heading", { name: /סל וקופה/ })).toBeVisible();
    await expect(
      page.getByRole("link", { exact: true, name: productName }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /שמירת הזמנה/ }),
    ).toBeVisible();
  });

  test("finds a product from search and opens its product page", async ({
    page,
  }) => {
    await setCookieConsent(page, "essential");
    await page.goto("/search?q=venus");

    await expect(
      page.getByRole("heading", { name: /חיפוש בקטלוג/ }),
    ).toBeVisible();
    await page
      .getByRole("link", { name: new RegExp(productName) })
      .first()
      .click();

    await expect(page).toHaveURL(new RegExp(`/product/${productSlug}`));
    await expect(
      page.getByRole("heading", { name: productName }),
    ).toBeVisible();
  });

  test("shows recoverable no-results and empty checkout states", async ({
    page,
  }) => {
    await setCookieConsent(page, "essential");

    await page.goto("/search?q=zzzz-no-match&maxPrice=1");
    await expect(page.getByTestId("search-empty-state")).toBeVisible();
    await expect(page.getByTestId("search-form")).toBeVisible();

    await page.goto("/checkout");
    await expect(page.getByTestId("cart-checkout-form")).toBeVisible();
    await expect(page.getByTestId("checkout-empty-cart")).toBeVisible();
  });

  test("opens mobile navigation", async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) >= 1024, "mobile-only flow");
    await setCookieConsent(page, "essential");

    await page.goto("/");
    await page.getByTestId("mobile-nav-trigger").click();
    await expect(page.getByTestId("mobile-nav-sheet")).toBeVisible();
    await expect(page.getByTestId("mobile-nav-link").first()).toBeVisible();
  });

  test("opens mobile category filter sheet", async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) >= 1024, "mobile-only flow");
    await setCookieConsent(page, "essential");

    await page.goto("/category/earrings", { waitUntil: "networkidle" });
    const filterTrigger = page.getByTestId("category-filter-trigger");

    await expect(page.getByTestId("category-results-grid")).toBeVisible();
    await expect(filterTrigger).toHaveCount(1);
    await expect(filterTrigger).toBeVisible();
    await filterTrigger.click();
    await expect(page.getByRole("dialog")).toBeVisible();
  });
});

test.describe("cookie consent flow", () => {
  test.beforeEach(async ({ page }) => {
    await clearBrowserState(page);
  });

  test("blocks analytics until approval and clears it when switching to essential", async ({
    page,
  }) => {
    await page.goto(`/product/${productSlug}`);

    await expect(
      page.getByRole("region", { name: "בחירת קוקיז" }),
    ).toBeVisible();
    await expectRecentlyViewed(page, productSlug, false);

    await page.getByRole("button", { name: "אישור הכל" }).click();

    await expect(
      page.getByRole("region", { name: "בחירת קוקיז" }),
    ).toBeHidden();
    await expectCookieConsent(page, "all");
    await expectRecentlyViewed(page, productSlug, true);

    await page.goto("/privacy");
    await page
      .getByRole("region", { name: "ניהול העדפות קוקיז" })
      .getByRole("button", { name: "הכרחי בלבד" })
      .click();

    await expectCookieConsent(page, "essential");
    await expectRecentlyViewed(page, productSlug, false);

    await page.reload();
    await expect(page.getByRole("region", { name: "בחירת קוקיז" })).toHaveCount(
      0,
    );
  });
});

test.describe("access control surfaces", () => {
  test.beforeEach(async ({ page }) => {
    await clearBrowserState(page);
    await setCookieConsent(page, "essential");
  });

  test("routes unauthenticated admin users to a sanitized login target", async ({
    page,
  }) => {
    await page.goto("/admin");

    await expect(page).toHaveURL(/\/admin\/login\?next=/);
    await expect(page.locator('input[name="next"]')).toHaveValue("/admin");
    await expect(page.locator("#email")).toBeVisible();

    await page.goto("/admin/login?next=https://evil.example/admin");
    await expect(page.locator('input[name="next"]')).toHaveValue("/admin");
  });

  test("shows customer login and rejects unauthenticated data export", async ({
    page,
  }) => {
    await page.goto("/account");

    await expect(page.locator("#identifier")).toBeVisible();
    await expect(page.locator("#code")).toBeVisible();

    const response = await page.request.get("/account/privacy/export");
    const body: unknown = await response.json();

    expect(response.status()).toBe(401);
    expect(response.headers()["content-type"]).toContain("application/json");
    expect(body).toEqual({
      ok: false,
      error: "Unauthorized.",
    });
  });
});

async function clearBrowserState(page: Page) {
  await page.goto("/");
  await page.evaluate(
    ({ cartStorageKey, consentStorageKey, recentlyViewedStorageKey }) => {
      window.localStorage.removeItem(consentStorageKey);
      window.localStorage.removeItem(recentlyViewedStorageKey);
      window.localStorage.removeItem(cartStorageKey);
      document.cookie = "aphrodite_cart_session=; Path=/; Max-Age=0";
    },
    { cartStorageKey, consentStorageKey, recentlyViewedStorageKey },
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

async function expectCookieConsent(
  page: Page,
  expectedValue: "essential" | "all",
) {
  await expect
    .poll(() =>
      page.evaluate((consentStorageKey) => {
        const stored = window.localStorage.getItem(consentStorageKey);

        return stored ? (JSON.parse(stored) as { value?: string }).value : null;
      }, consentStorageKey),
    )
    .toBe(expectedValue);
}

async function expectRecentlyViewed(
  page: Page,
  expectedSlug: string,
  shouldInclude: boolean,
) {
  await expect
    .poll(() =>
      page.evaluate(
        ({ expectedSlug, recentlyViewedStorageKey }) => {
          const stored = window.localStorage.getItem(recentlyViewedStorageKey);
          const viewed = stored ? (JSON.parse(stored) as unknown) : [];

          return (
            Array.isArray(viewed) &&
            viewed.some(
              (value) => typeof value === "string" && value === expectedSlug,
            )
          );
        },
        { expectedSlug, recentlyViewedStorageKey },
      ),
    )
    .toBe(shouldInclude);
}
