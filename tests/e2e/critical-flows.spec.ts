import { expect, test, type Page } from "@playwright/test";

const consentStorageKey = "aphrodite_cookie_consent";
const accessibilityStorageKey = "aphrodite.accessibility-settings";
const recentlyViewedStorageKey = "aphrodite_recently_viewed";
const cartStorageKey = "aphrodite_cart_session";
const productSlug = "venus-line-ring";
const productName = "טבעת Venus Line";
const publicHeroRoutes = [
  "/",
  "/search?q=venus",
  `/product/${productSlug}`,
  "/category/earrings",
  "/gifts",
  "/branches",
  "/checkout",
  "/account",
  "/ai",
  "/stylist",
  "/about",
  "/faq",
  "/privacy",
  "/terms",
  "/accessibility",
];
const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;

test.describe("critical shopping flows", () => {
  test.beforeEach(async ({ page }) => {
    await clearBrowserState(page);
  });

  test("adds a product to cart and shows it in checkout", async ({ page }) => {
    await setCookieConsent(page, "essential");
    await page.goto(`/product/${productSlug}`);

    await expect(
      page
        .getByTestId("cinematic-page-hero")
        .getByRole("heading", { name: productName }),
    ).toBeVisible();

    await page.getByRole("button", { exact: true, name: "הוספה לסל" }).click();
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
    const productResultLink = page
      .getByTestId("search-results-grid")
      .getByRole("link", { name: new RegExp(productName) })
      .last();

    const productHref = await productResultLink.getAttribute("href");

    expect(productHref).toMatch(new RegExp(`/product/${productSlug}`));
    await page.goto(productHref!);

    await expect(page).toHaveURL(new RegExp(`/product/${productSlug}`));
    await expect(
      page
        .getByTestId("cinematic-page-hero")
        .getByRole("heading", { name: productName }),
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

test.describe("accessibility and responsive guardrails", () => {
  test.beforeEach(async ({ page }) => {
    await clearBrowserState(page);
    await setCookieConsent(page, "essential");
  });

  test("exposes keyboard skip navigation", async ({ page }) => {
    await page.goto("/");

    await page.keyboard.press("Tab");

    const skipLink = page.getByRole("link", { name: "דילוג לתוכן" });
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeVisible();

    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#main-content$/);
  });

  test("honors the site reduced-motion preference", async ({ page }) => {
    await page.addInitScript((storageKey) => {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({
          highContrast: false,
          reduceMotion: true,
          textScale: "normal",
          underlineLinks: false,
        }),
      );
    }, accessibilityStorageKey);

    await page.goto("/", { waitUntil: "networkidle" });

    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.dataset.accessibilityMotion,
        ),
      )
      .toBe("reduce");

    const revealMotion = await page
      .locator(".motion-reveal")
      .first()
      .evaluate((element) => {
        const styles = window.getComputedStyle(element);

        return {
          transform: styles.transform,
          transitionDurationsMs: styles.transitionDuration
            .split(",")
            .map((value) => value.trim())
            .map((value) =>
              value.endsWith("ms")
                ? Number.parseFloat(value)
                : Number.parseFloat(value) * 1000,
            ),
        };
      });
    const mediaTransform = await page
      .locator("[data-motion-media='true'] .motion-media-content")
      .first()
      .evaluate((element) => window.getComputedStyle(element).transform);
    const heroSequenceReduced = await page
      .getByTestId("cinematic-page-hero-sequence")
      .first()
      .getAttribute("data-motion-reduced");
    const kineticImageReduced = await page
      .locator("[data-kinetic-image]")
      .first()
      .getAttribute("data-motion-reduced");
    const kineticImageTransform = await page
      .locator("[data-kinetic-image] .kinetic-image-layer")
      .first()
      .evaluate((element) => window.getComputedStyle(element).transform);

    expect(revealMotion.transform).toBe("none");
    expect(
      revealMotion.transitionDurationsMs.every((duration) => duration <= 0.01),
    ).toBe(true);
    expect(mediaTransform).toBe("none");
    expect(heroSequenceReduced).toBe("true");
    expect(kineticImageReduced).toBe("true");
    expect(kineticImageTransform).toBe("none");
  });

  test("shows cinematic heroes and static scroll cues on all public routes", async ({
    page,
  }) => {
    test.setTimeout(90_000);

    for (const route of publicHeroRoutes) {
      await page.goto(route, { waitUntil: "domcontentloaded" });

      const hero = page.getByTestId("cinematic-page-hero");
      const heroHeading = hero.getByRole("heading").first();

      await expect(hero).toBeVisible();
      await expect(heroHeading).toBeVisible();
      await expect(heroHeading).toBeInViewport({ ratio: 0.1 });
      await expect(hero.getByTestId("hero-scroll-cue")).toBeVisible();
      await expect(
        page.locator(
          ".floating-anchor-nav, .floating-anchor-nav-mobile, .floating-anchor-nav-rail",
        ),
      ).toHaveCount(0);
    }
  });

  test("hero scroll cue clicks scroll to the section and update the hash", async ({
    page,
  }) => {
    await page.goto("/category/earrings", { waitUntil: "networkidle" });

    const scrollCue = page.getByTestId("hero-scroll-cue");

    await expect(scrollCue).toBeVisible();
    await expect(scrollCue).toHaveAttribute("href", "#category-products");
    await scrollCue.click();
    await expect(scrollCue).toHaveAttribute("data-anchor-activating", "true");
    await expect(page).toHaveURL(/#category-products$/);
    await expect(page.locator("#category-products")).toBeInViewport();
  });

  for (const route of [...publicHeroRoutes, "/admin/login"]) {
    test(`keeps ${route} inside the viewport width`, async ({ page }) => {
      await page.goto(route, { waitUntil: "networkidle" });

      await expectNoHorizontalOverflow(page);
    });
  }
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

  test("protects routed admin operations pages", async ({ page }) => {
    for (const route of [
      "/admin/orders",
      "/admin/catalog",
      "/admin/inventory",
      "/admin/customers",
      "/admin/appointments",
      "/admin/integrations",
      "/admin/audit",
    ]) {
      await page.goto(route);
      await expect(page).toHaveURL(/\/admin\/login\?next=/);
    }
  });

  test("authenticated admins can open the operations shell", async ({
    page,
  }) => {
    test.skip(
      !adminEmail || !adminPassword,
      "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD to run authenticated admin e2e.",
    );

    await page.goto("/admin/login?next=/admin/orders");
    await page.locator("#email").fill(adminEmail!);
    await page.locator("#password").fill(adminPassword!);
    await page.getByRole("button", { name: /אדמין|Admin/ }).click();

    await expect(page).toHaveURL(/\/admin\/orders/);
    await expect(page.getByRole("link", { name: /הזמנות/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: "הזמנות" })).toBeVisible();
    await expect(page.getByRole("link", { name: /אינטגרציות/ })).toBeVisible();
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

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );

  expect(overflow).toBeLessThanOrEqual(1);
}
