import { expect, test, type Locator, type Page } from "@playwright/test";

const consentStorageKey = "elysia_cookie_consent";
const accessibilityStorageKey = "elysia.accessibility-settings";
const recentlyViewedStorageKey = "elysia_recently_viewed";
const cartStorageKey = "elysia_cart_session";
const pwaDevCleanupStorageKey = "elysia:pwa-dev-cleanup";
const cartProductSlug = "hera-bracelet";
const cartProductName = "צמיד Hera";
const madeToOrderProductSlug = "muse-pearl-earrings";
const madeToOrderProductName = "עגילי Muse Pearl";
const searchProductSlug = "venus-line-ring";
const searchProductName = "טבעת Venus Line";
const publicRoutes = [
  "/",
  "/search?q=venus",
  `/product/${cartProductSlug}`,
  "/category/earrings",
  "/gifts",
  "/branches",
  "/checkout",
  "/account",
  "/ai",
  "/stylist",
  "/size-guide",
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
    await page.goto(`/product/${cartProductSlug}`);

    await expect(
      page.getByRole("heading", { name: cartProductName }).first(),
    ).toBeVisible();
    await expect(page.getByTestId("product-gallery")).toBeVisible();
    await expect(page.getByTestId("product-variant-feedback")).toBeVisible();
    await expect(
      page.getByTestId("product-recommendation-rails"),
    ).toBeVisible();
    const galleryThumbnails = page.getByTestId("product-gallery-thumbnail");
    const galleryThumbnailCount = await galleryThumbnails.count();

    if (galleryThumbnailCount > 1) {
      await expect(galleryThumbnails.first()).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await galleryThumbnails.first().focus();
      await page.keyboard.press("ArrowRight");
      await expect(galleryThumbnails.nth(1)).toBeFocused();
      await expect(galleryThumbnails.nth(1)).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await page.keyboard.press("Home");
      await expect(galleryThumbnails.first()).toBeFocused();
      await expect(galleryThumbnails.first()).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await galleryThumbnails.nth(1).click();
      await expect(galleryThumbnails.nth(1)).toHaveAttribute(
        "aria-pressed",
        "true",
      );
    }

    await page.getByRole("button", { exact: true, name: "הוספה לסל" }).click();
    await expect(page.getByText(/נוספה לסל|הפריט נוסף לסל/)).toBeVisible();
    await expect(
      page.locator("a[href='/checkout'] .cart-count-badge"),
    ).toHaveText("1");

    await page.goto("/checkout");

    await expect(page.getByRole("heading", { name: /סל וקופה/ })).toBeVisible();
    await expect(
      page.getByRole("link", { name: new RegExp(cartProductName) }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /שמירת הזמנה/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /הוספת כמות עבור/ }),
    ).toBeVisible();
    await expect(page.getByTestId("checkout-line-total").first()).toContainText(
      "סכום שורה",
    );
    await expect(page.locator('[aria-label^="כמות "]')).toContainText("1");
  });

  test("saves a ring size locally and applies it on product pages", async ({
    page,
  }) => {
    await setCookieConsent(page, "essential");
    await page.goto("/size-guide?kind=ring");

    await expect(page.getByTestId("size-guide-tool")).toBeVisible();
    await page.locator("#size-guide-ring").fill("54");
    await page
      .getByTestId("size-guide-tool")
      .getByRole("button", { name: "שמירת מידה" })
      .click();
    await expect(page.getByText(/נשמר/).first()).toBeVisible();

    await page.goto("/product/venus-line-ring");

    await expect(page.getByTestId("product-saved-size-match")).toContainText(
      "54",
    );
    await expect(
      page.locator("button[aria-pressed='true']").first(),
    ).toContainText("54");
  });

  test("routes made-to-order products to service with product reference", async ({
    page,
  }) => {
    await setCookieConsent(page, "essential");
    await page.goto(`/product/${madeToOrderProductSlug}`);

    await expect(
      page.getByRole("heading", { name: madeToOrderProductName }).first(),
    ).toBeVisible();
    const serviceCta = page
      .getByRole("link", { name: /פתיחת בקשת התאמה/ })
      .first();

    await expect(serviceCta).toHaveAttribute("href", /\/service\?/);
    await serviceCta.click();
    await expect(page).toHaveURL(/\/service\?/);
    await expect(page.locator('input[name="productReference"]')).toHaveValue(
      new RegExp(madeToOrderProductName),
    );
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
      .getByRole("link", { exact: true, name: searchProductName })
      .first();

    const productHref = await productResultLink.getAttribute("href");

    expect(productHref).toMatch(new RegExp(`/product/${searchProductSlug}`));
    await page.goto(productHref!);

    await expect(page).toHaveURL(new RegExp(`/product/${searchProductSlug}`));
    await expect(
      page.getByRole("heading", { name: searchProductName }).first(),
    ).toBeVisible();
  });

  test("shows recoverable no-results and empty checkout states", async ({
    page,
  }) => {
    await setCookieConsent(page, "essential");

    await page.goto("/search?q=zzzz-no-match&maxPrice=1");
    await expect(page.getByTestId("search-empty-state")).toBeVisible();
    await expect(page.getByTestId("search-form")).toBeVisible();
    await expect(page.getByTestId("search-result-count")).toBeVisible();
    await expect(
      page.getByTestId("search-recovery-actions").getByRole("link").first(),
    ).toBeVisible();

    const categoryNoResultsParams = new URLSearchParams({
      material: "זהב לבן 14K",
      stone: "יהלום",
    });

    await page.goto(`/category/earrings?${categoryNoResultsParams}`);
    const categoryEmptyState = visibleByTestId(page, "category-empty-state");

    await expect(categoryEmptyState).toBeVisible();
    await expect(
      categoryEmptyState.getByRole("link", { name: "איפוס פילטרים" }),
    ).toBeVisible();

    await page.goto("/checkout");
    await expect(page.getByTestId("cart-checkout-form")).toBeVisible();
    await expect(page.getByTestId("checkout-empty-cart")).toBeVisible();
  });

  test("shows category not-found recovery", async ({ page }) => {
    await setCookieConsent(page, "essential");

    await page.goto("/category/not-a-real-category");

    const notFoundState = page.getByTestId("category-not-found-state");

    await expect(notFoundState).toBeVisible();
    await expect(
      notFoundState.getByRole("link", { name: "חיפוש בקטלוג" }),
    ).toBeVisible();
  });

  test("opens mobile navigation", async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) >= 1024, "mobile-only flow");
    await setCookieConsent(page, "essential");

    await page.goto("/");
    await page.getByTestId("mobile-nav-trigger").click();
    await expect(page.getByTestId("mobile-nav-sheet")).toBeVisible();
    await expect(page.getByTestId("mobile-nav-link").first()).toBeVisible();
    await page.getByTestId("mobile-nav-link").first().click();
    await expect(page.getByTestId("mobile-nav-sheet")).toBeHidden();
    await expect(page).toHaveURL(/\/category\/rings/);

    await page.getByTestId("mobile-nav-trigger").click();
    await expect(page.getByTestId("mobile-nav-sheet")).toBeVisible();
    await page.setViewportSize({ width: 1024, height: 900 });
    await expect(page.getByTestId("mobile-nav-sheet")).toBeHidden();
  });

  test("opens mobile category filter sheet", async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) >= 1024, "mobile-only flow");
    await setCookieConsent(page, "essential");

    await page.goto("/category/earrings", { waitUntil: "networkidle" });
    const filterTrigger = visibleByTestId(page, "category-filter-trigger");

    await expect(visibleByTestId(page, "category-results-grid")).toBeVisible();
    await expect(filterTrigger).toHaveCount(1);
    await expect(filterTrigger).toBeVisible();
    await expect(filterTrigger).toHaveAttribute("aria-expanded", "false");
    await filterTrigger.click();
    await expect(filterTrigger).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByRole("dialog")).toBeVisible();
    await page
      .getByTestId("category-filter-sheet")
      .locator("a[href*='sort=price-asc']")
      .first()
      .click();
    await expect(page.getByTestId("category-filter-sheet")).toBeHidden();
    await expect(page).toHaveURL(/sort=price-asc/);

    await page.goto("/category/earrings", { waitUntil: "networkidle" });
    const secondFilterTrigger = visibleByTestId(
      page,
      "category-filter-trigger",
    );

    await expect(secondFilterTrigger).toHaveAttribute("aria-expanded", "false");
    await secondFilterTrigger.click();
    await expect(secondFilterTrigger).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByTestId("category-filter-sheet")).toBeVisible();
    await page.setViewportSize({ width: 1024, height: 900 });
    await expect(page.getByTestId("category-filter-sheet")).toBeHidden();
  });

  test("closes mobile search filter sheet at the tablet breakpoint", async ({
    page,
  }) => {
    test.skip((page.viewportSize()?.width ?? 0) >= 768, "mobile-only flow");
    await setCookieConsent(page, "essential");

    await page.goto("/search?q=venus", { waitUntil: "networkidle" });
    const mobileControls = page.getByTestId("mobile-search-controls");

    await expect(mobileControls).toBeVisible();
    await mobileControls.getByTestId("mobile-search-filter-trigger").click();
    await expect(page.getByTestId("mobile-search-filter-sheet")).toBeVisible();

    await page.setViewportSize({ width: 768, height: 900 });
    await expect(page.getByTestId("mobile-search-filter-sheet")).toBeHidden();
  });

  test("restores focus after keyboard-closing mobile sheets", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await setCookieConsent(page, "essential");

    await page.goto("/");
    const mobileNavTrigger = page.getByTestId("mobile-nav-trigger");

    await expect(mobileNavTrigger).toHaveAttribute("aria-expanded", "false");
    await mobileNavTrigger.press("Enter");
    await expect(page.getByTestId("mobile-nav-sheet")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("mobile-nav-sheet")).toBeHidden();
    await expect(mobileNavTrigger).toBeFocused();

    await page.goto("/search?q=venus", { waitUntil: "networkidle" });
    const searchFilterTrigger = page.getByTestId(
      "mobile-search-filter-trigger",
    );

    await expect(searchFilterTrigger).toBeVisible();
    await expect(searchFilterTrigger).toHaveAttribute("aria-expanded", "false");
    await searchFilterTrigger.press("Enter");
    await expect(page.getByTestId("mobile-search-filter-sheet")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("mobile-search-filter-sheet")).toBeHidden();
    await expect(searchFilterTrigger).toBeFocused();

    await page.goto("/category/earrings", { waitUntil: "networkidle" });
    const categoryFilterTrigger = visibleByTestId(
      page,
      "category-filter-trigger",
    );

    await expect(categoryFilterTrigger).toBeVisible();
    await expect(categoryFilterTrigger).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    await categoryFilterTrigger.press("Enter");
    await expect(page.getByTestId("category-filter-sheet")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("category-filter-sheet")).toBeHidden();
    await expect(categoryFilterTrigger).toBeFocused();
  });
});

test.describe("hydration-sensitive responsive surfaces", () => {
  test.beforeEach(async ({ page }) => {
    await clearBrowserState(page);
    await setCookieConsent(page, "essential");
  });

  test("keeps header navigation hydration-clean across mobile and desktop reloads", async ({
    page,
  }) => {
    const hydrationIssues = trackHydrationIssues(page);

    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const mobileNavTrigger = page.getByTestId("mobile-nav-trigger");

    await expect(mobileNavTrigger).toBeVisible();
    await mobileNavTrigger.click();
    await expect(page.getByTestId("mobile-nav-sheet")).toBeVisible();

    await page.setViewportSize({ width: 1024, height: 900 });
    await expect(page.getByTestId("mobile-nav-sheet")).toBeHidden();
    await expect(mobileNavTrigger).toBeHidden();

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("mobile-nav-trigger")).toBeHidden();

    await page.setViewportSize({ width: 390, height: 900 });
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("mobile-nav-trigger")).toBeVisible();

    await expectNoHydrationRegressions(page, hydrationIssues);
  });

  test("keeps responsive filter sheets hydration-clean across breakpoints", async ({
    page,
  }) => {
    const hydrationIssues = trackHydrationIssues(page);

    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto("/search?q=venus", { waitUntil: "domcontentloaded" });

    const mobileSearchControls = page.getByTestId("mobile-search-controls");

    await expect(mobileSearchControls).toBeVisible();
    await mobileSearchControls
      .getByTestId("mobile-search-filter-trigger")
      .click();
    await expect(page.getByTestId("mobile-search-filter-sheet")).toBeVisible();

    await page.setViewportSize({ width: 768, height: 900 });
    await expect(page.getByTestId("mobile-search-filter-sheet")).toBeHidden();

    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto("/category/earrings", { waitUntil: "domcontentloaded" });

    const categoryFilterTrigger = visibleByTestId(
      page,
      "category-filter-trigger",
    );

    await expect(categoryFilterTrigger).toBeVisible();
    await categoryFilterTrigger.click();
    await expect(page.getByTestId("category-filter-sheet")).toBeVisible();

    await page.setViewportSize({ width: 1024, height: 900 });
    await expect(page.getByTestId("category-filter-sheet")).toBeHidden();
    await expect(visibleByTestId(page, "category-filter-panel")).toBeVisible();

    await expectNoHydrationRegressions(page, hydrationIssues);
  });

  test("hydrates cart count from stored client session without mismatch", async ({
    page,
  }) => {
    const sessionKey = "cart_hydration_regression_123456789";
    const seenSessionKeys: string[] = [];
    const hydrationIssues = trackHydrationIssues(page);

    await page.route("**/api/cart/count**", async (route) => {
      const requestUrl = new URL(route.request().url());

      seenSessionKeys.push(requestUrl.searchParams.get("sessionKey") ?? "");
      await route.fulfill({
        body: JSON.stringify({ itemCount: 3 }),
        contentType: "application/json",
        status: 200,
      });
    });
    await page.addInitScript(
      ({ cartStorageKey, sessionKey }) => {
        window.localStorage.setItem(cartStorageKey, sessionKey);
        document.cookie = [
          `elysia_cart_session=${encodeURIComponent(sessionKey)}`,
          "Path=/",
          "SameSite=Lax",
        ].join("; ");
      },
      { cartStorageKey, sessionKey },
    );

    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto("/", { waitUntil: "domcontentloaded" });

    await expect(
      page.locator("a[href='/checkout'] .cart-count-badge"),
    ).toHaveText("3");
    expect(seenSessionKeys).toContain(sessionKey);

    await page.setViewportSize({ width: 1280, height: 900 });
    await expect(
      page.locator("a[href='/checkout'] .cart-count-badge"),
    ).toHaveText("3");

    await expectNoHydrationRegressions(page, hydrationIssues);
  });

  test("hydrates account OTP cart session without server/client mismatch", async ({
    page,
  }) => {
    const sessionKey = "account_hydration_regression_123456789";
    const hydrationIssues = trackHydrationIssues(page);

    await page.addInitScript(
      ({ cartStorageKey, sessionKey }) => {
        window.localStorage.setItem(cartStorageKey, sessionKey);
        document.cookie = [
          `elysia_cart_session=${encodeURIComponent(sessionKey)}`,
          "Path=/",
          "SameSite=Lax",
        ].join("; ");
      },
      { cartStorageKey, sessionKey },
    );

    await page.goto("/account", { waitUntil: "domcontentloaded" });

    const accountLoginForm = visibleByTestId(page, "account-otp-request-form");

    await expect(accountLoginForm).toBeVisible();
    await expect(
      accountLoginForm.getByTestId("account-identifier-input"),
    ).toBeVisible();
    await expect(
      accountLoginForm.locator('input[name="sessionKey"]'),
    ).toHaveValue(sessionKey);
    await expectNoHydrationRegressions(page, hydrationIssues);
  });

  test("hydrates stored accessibility preferences without server/client mismatch", async ({
    page,
  }) => {
    const hydrationIssues = trackHydrationIssues(page);

    await page.addInitScript((storageKey) => {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({
          highContrast: true,
          reduceMotion: true,
          textScale: "large",
          underlineLinks: true,
        }),
      );
    }, accessibilityStorageKey);

    await page.goto("/", { waitUntil: "domcontentloaded" });

    await expect
      .poll(() =>
        page.evaluate(() => ({
          contrast: document.documentElement.dataset.accessibilityContrast,
          links: document.documentElement.dataset.accessibilityLinks,
          motion: document.documentElement.dataset.accessibilityMotion,
          text: document.documentElement.dataset.accessibilityText,
        })),
      )
      .toEqual({
        contrast: "true",
        links: "true",
        motion: "reduce",
        text: "large",
      });
    await expectNoHydrationRegressions(page, hydrationIssues);
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

  test("exposes accessible names for the home quick search", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(
      page.getByRole("search", { name: "חיפוש בקטלוג" }),
    ).toBeVisible();
    await expect(
      page.getByRole("textbox", { name: "חיפוש מוצר בקטלוג" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { exact: true, name: "חיפוש" }),
    ).toBeVisible();
  });

  test("keeps the accessibility widget keyboard-operable", async ({ page }) => {
    await page.goto("/");

    const trigger = page.locator("[data-accessibility-widget-trigger='true']");
    await expect(trigger).toBeVisible();
    await expect(trigger).toHaveAttribute(
      "aria-label",
      new RegExp("\\u05e0\\u05d2\\u05d9\\u05e9\\u05d5\\u05ea"),
    );
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    const controlledDialogId = await trigger.getAttribute("aria-controls");
    expect(controlledDialogId).toBeTruthy();

    const triggerChrome = await trigger.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const styles = window.getComputedStyle(element);

      return {
        backgroundColor: styles.backgroundColor,
        bottom: window.innerHeight - rect.bottom,
        boxShadow: styles.boxShadow,
        left: rect.left,
        opacity: styles.opacity,
        right: window.innerWidth - rect.right,
        visibility: styles.visibility,
      };
    });

    expect(triggerChrome.right).toBeLessThan(triggerChrome.left);
    expect(triggerChrome.bottom).toBeGreaterThanOrEqual(0);
    expect(triggerChrome.backgroundColor).not.toBe("rgb(66, 201, 190)");
    expect(triggerChrome.boxShadow).not.toContain("16px 36px");
    expect(triggerChrome.visibility).toBe("visible");
    expect(Number(triggerChrome.opacity)).toBe(1);

    await trigger.focus();
    await page.keyboard.press("Enter");

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute("id", controlledDialogId!);
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#main-content")).toHaveAttribute("inert", "");
    await expect(page.locator("#main-content")).toHaveAttribute(
      "aria-hidden",
      "true",
    );

    const dialogTitle = dialog.getByRole("heading", {
      name: new RegExp("\\u05e0\\u05d2\\u05d9\\u05e9\\u05d5\\u05ea"),
    });
    await expect(dialogTitle).toBeFocused();

    await page.keyboard.press("Shift+Tab");
    await expect(
      dialog.getByRole("link", {
        name: new RegExp("\\u05d4\\u05e6\\u05d4\\u05e8\\u05ea"),
      }),
    ).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(dialog.getByRole("button").first()).toBeFocused();

    const reduceMotionToggle = dialog.locator('input[type="checkbox"]').nth(2);
    await reduceMotionToggle.focus();
    await expect(reduceMotionToggle).toBeFocused();
    await page.keyboard.press("Space");
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.dataset.accessibilityMotion,
        ),
      )
      .toBe("reduce");
    await expect(dialog.getByRole("status")).toContainText(
      new RegExp("\\u05e0\\u05d2\\u05d9\\u05e9\\u05d5\\u05ea"),
    );

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(page.locator("#main-content")).not.toHaveAttribute(
      "inert",
      "",
    );
    await expect(page.locator("#main-content")).not.toHaveAttribute(
      "aria-hidden",
      "true",
    );
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            document.activeElement ===
            document.querySelector(
              "[data-accessibility-widget-trigger='true']",
            ),
        ),
      )
      .toBe(true);
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

    await page.goto("/", { waitUntil: "domcontentloaded" });

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

  test("keeps selected size controls readable on hover and focus", async ({
    page,
  }) => {
    await page.goto("/size-guide?kind=ring", { waitUntil: "domcontentloaded" });

    const selectedSizeControls = page
      .getByTestId("size-guide-tool")
      .locator("button[aria-pressed='true']");

    await expect(selectedSizeControls).toHaveCount(2);

    for (
      let index = 0;
      index < (await selectedSizeControls.count());
      index += 1
    ) {
      const control = selectedSizeControls.nth(index);

      await expectReadableControl(control, `selected size control ${index}`);
      await control.hover();
      await expectReadableControl(
        control,
        `selected size control ${index} hover`,
      );
      await control.focus();
      await expectReadableControl(
        control,
        `selected size control ${index} focus`,
      );
    }
  });

  test("does not replay entrance motion during public reloads", async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await installReloadMotionMonitor(page);

    for (const route of ["/", "/category/earrings", "/about"]) {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1200);
      await expectReloadMotionStable(page, route);

      await page.reload({ waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1200);
      await expectReloadMotionStable(page, `${route} reload`);
    }
  });

  test("keeps the cinematic hero reserved for the home route", async ({
    page,
  }) => {
    test.setTimeout(90_000);

    await page.goto("/", { waitUntil: "domcontentloaded" });

    const homeHero = page.getByTestId("cinematic-page-hero");
    const homeHeroBox = await homeHero.boundingBox();
    const viewport = page.viewportSize();

    await expect(homeHero).toBeVisible();
    await expect(homeHero.getByRole("heading").first()).toBeVisible();
    const heroCollectionLink = homeHero.locator(
      'a.home-hero-cta-primary[href="/category/rings"]',
    );

    await expect(heroCollectionLink).toBeVisible();
    await expect(
      homeHero.locator('a.home-hero-service-link[href="/service"]'),
    ).toHaveCount(0);
    const heroCollectionLinkStyles = await heroCollectionLink.evaluate(
      (element) => {
        const styles = window.getComputedStyle(element);

        return {
          backgroundColor: styles.backgroundColor,
          color: styles.color,
        };
      },
    );

    expect(heroCollectionLinkStyles.backgroundColor).toMatch(
      /^rgba?\(255, 255, 255(?:, (?:0\.9[5-9]|1))?\)$/,
    );
    expect(heroCollectionLinkStyles.color).not.toBe("rgb(255, 255, 255)");
    const heroCollectionLinkShine = await heroCollectionLink.evaluate(
      (element) => {
        const styles = window.getComputedStyle(element, "::after");

        return {
          animationName: styles.animationName,
          content: styles.content,
        };
      },
    );

    expect(heroCollectionLinkShine.content).toBe("none");
    expect(heroCollectionLinkShine.animationName).toBe("none");
    expect(homeHeroBox?.width ?? 0).toBeGreaterThanOrEqual(
      (viewport?.width ?? 0) - 2,
    );
    expect(homeHeroBox?.height ?? 0).toBeGreaterThanOrEqual(
      (viewport?.width ?? 0) < 1024 ? 440 : 480,
    );

    for (const route of publicRoutes.filter((route) => route !== "/")) {
      await page.goto(route, { waitUntil: "domcontentloaded" });

      await expect(page.getByTestId("cinematic-page-hero")).toHaveCount(0);
      await expect(page.getByRole("heading").first()).toBeVisible();
      await expect(
        page.locator(
          ".floating-anchor-nav, .floating-anchor-nav-mobile, .floating-anchor-nav-rail",
        ),
      ).toHaveCount(0);
    }
  });

  test("removes adjacent same-page hero CTAs from public task routes", async ({
    page,
  }) => {
    for (const route of [
      "/gifts",
      "/category/earrings",
      "/search?q=venus",
      "/checkout",
      "/service",
      "/account",
      "/ai",
      "/stylist",
      "/size-guide",
      "/faq",
      "/privacy",
      "/terms",
      "/accessibility",
    ]) {
      await page.goto(route, { waitUntil: "domcontentloaded" });

      await expect(
        page.locator('.commerce-page-hero-actions a[href^="#"]'),
      ).toHaveCount(0);
      await expect(page.getByRole("heading").first()).toBeVisible();
    }

    await page.goto("/gifts", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("gift-results-summary")).toBeVisible();
    await expect(page.getByTestId("gift-results-grid")).toBeVisible();
  });

  for (const route of [...publicRoutes, "/admin/login"]) {
    test(`keeps ${route} inside the viewport width`, async ({ page }) => {
      await page.goto(route, { waitUntil: "networkidle" });

      await expectNoHorizontalOverflow(page);
    });
  }

  test("keeps the top-anchored home hero clear of the desktop header", async ({
    page,
  }) => {
    test.skip((page.viewportSize()?.width ?? 0) < 1024, "desktop-only check");

    await page.goto("/", { waitUntil: "domcontentloaded" });

    const offsets = await page.evaluate(() => {
      const header = document.querySelector("header");
      const hero = document.querySelector(
        '[data-testid="cinematic-page-hero"]',
      );
      const copy = document.querySelector('[data-testid="home-hero-copy"]');
      const actions = document.querySelector(
        '[data-testid="home-hero-actions"]',
      );

      if (!header || !hero || !copy || !actions) {
        throw new Error("Missing home hero alignment targets.");
      }

      const headerRect = header.getBoundingClientRect();
      const heroRect = hero.getBoundingClientRect();
      const copyRect = copy.getBoundingClientRect();
      const actionsRect = actions.getBoundingClientRect();

      return {
        actionsBottom: Math.round(heroRect.bottom - actionsRect.bottom),
        actionsLeft: Math.round(actionsRect.left - heroRect.left),
        headerHeight: Math.round(headerRect.height),
        heroTop: Math.round(heroRect.top),
        copyRight: Math.round(heroRect.right - copyRect.right),
        copyTop: Math.round(copyRect.top - heroRect.top),
      };
    });

    expect(offsets.heroTop).toBe(0);
    expect(
      Math.abs(offsets.copyRight - offsets.actionsLeft),
    ).toBeLessThanOrEqual(1);
    expect(
      Math.abs(offsets.copyTop - offsets.actionsBottom - offsets.headerHeight),
    ).toBeLessThanOrEqual(1);
    expect(offsets.copyRight).toBeGreaterThanOrEqual(48);
    expect(offsets.copyTop).toBeGreaterThanOrEqual(offsets.headerHeight + 32);
  });
});

test.describe("cookie consent flow", () => {
  test.beforeEach(async ({ page }) => {
    await clearBrowserState(page);
  });

  test("does not flash the cookie banner after consent is already stored", async ({
    page,
  }) => {
    await setCookieConsent(page, "all");
    await page.addInitScript(() => {
      const win = window as Window & { __cookieBannerSeen?: boolean };
      const markBannerIfPresent = () => {
        if (document.querySelector('[data-cookie-consent-banner="true"]')) {
          win.__cookieBannerSeen = true;
        }
      };

      win.__cookieBannerSeen = false;
      document.addEventListener("DOMContentLoaded", markBannerIfPresent);
      new MutationObserver(markBannerIfPresent).observe(
        document.documentElement,
        {
          childList: true,
          subtree: true,
        },
      );
    });

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(100);

    await expect(
      page.locator('[data-cookie-consent-banner="true"]'),
    ).toHaveCount(0);
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (window as Window & { __cookieBannerSeen?: boolean })
              .__cookieBannerSeen,
        ),
      )
      .toBe(false);

    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(100);

    await expect(
      page.locator('[data-cookie-consent-banner="true"]'),
    ).toHaveCount(0);
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (window as Window & { __cookieBannerSeen?: boolean })
              .__cookieBannerSeen,
        ),
      )
      .toBe(false);
  });

  test("blocks analytics until approval and clears it when switching to essential", async ({
    page,
  }) => {
    await page.goto(`/product/${searchProductSlug}`);

    await expect(
      page.getByRole("region", { name: "בחירת קוקיז" }),
    ).toBeVisible();
    await expectRecentlyViewed(page, searchProductSlug, false);

    const acceptCookiesButton = page.getByRole("button", {
      name: "אישור הכל",
    });
    await expect(acceptCookiesButton).toHaveCSS(
      "background-color",
      "rgb(16, 19, 20)",
    );
    await acceptCookiesButton.click();

    await expect(
      page.getByRole("region", { name: "בחירת קוקיז" }),
    ).toBeHidden();
    await expectCookieConsent(page, "all");
    await expectRecentlyViewed(page, searchProductSlug, true);

    await page.goto("/privacy");
    await page
      .getByRole("region", { name: "ניהול העדפות קוקיז" })
      .getByRole("button", { name: "הכרחי בלבד" })
      .click();

    await expectCookieConsent(page, "essential");
    await expectRecentlyViewed(page, searchProductSlug, false);

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

    const accountLoginForm = visibleByTestId(page, "account-otp-request-form");

    await expect(accountLoginForm).toBeVisible();
    await expect(
      accountLoginForm.getByTestId("account-identifier-input"),
    ).toBeVisible();
    await expect(
      page.getByTestId("account-code-input").filter({ visible: true }),
    ).toHaveCount(0);

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
  await page.addInitScript((storageKey) => {
    window.sessionStorage.setItem(storageKey, "1");
  }, pwaDevCleanupStorageKey);
  await page.goto("/offline", { waitUntil: "domcontentloaded" });
  await page.evaluate(
    ({
      cartStorageKey,
      consentStorageKey,
      pwaDevCleanupStorageKey,
      recentlyViewedStorageKey,
    }) => {
      window.sessionStorage.setItem(pwaDevCleanupStorageKey, "1");
      window.localStorage.removeItem(consentStorageKey);
      window.localStorage.removeItem(recentlyViewedStorageKey);
      window.localStorage.removeItem(cartStorageKey);
      document.cookie = "elysia_cart_session=; Path=/; Max-Age=0";
    },
    {
      cartStorageKey,
      consentStorageKey,
      pwaDevCleanupStorageKey,
      recentlyViewedStorageKey,
    },
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

async function expectReadableControl(locator: Locator, label: string) {
  const readability = await locator.evaluate((element) => {
    const styles = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    const text = (element.textContent ?? "").trim();
    const foreground = parseCssColor(styles.color) ?? {
      a: 1,
      b: 0,
      g: 0,
      r: 0,
    };
    const background = getEffectiveBackgroundColor(element);

    return {
      contrast: getContrastRatio(foreground, background),
      height: rect.height,
      opacity: Number(styles.opacity),
      text,
      visibility: styles.visibility,
      width: rect.width,
    };

    function getEffectiveBackgroundColor(target: Element) {
      const colors: RgbaColor[] = [];
      let current: Element | null = target;

      while (current) {
        const color = parseCssColor(
          window.getComputedStyle(current).backgroundColor,
        );

        if (color && color.a > 0) {
          colors.unshift(color);
        }

        current = current.parentElement;
      }

      return colors.reduce(
        (background, color) => compositeColor(color, background),
        { a: 1, b: 255, g: 255, r: 255 } satisfies RgbaColor,
      );
    }

    function parseCssColor(value: string): RgbaColor | null {
      const match = /^rgba?\(([^)]+)\)$/u.exec(value);

      if (!match) return null;

      const parts = match[1]!
        .split(",")
        .map((part) => Number.parseFloat(part.trim()));
      const [r, g, b, a = 1] = parts;

      if (![r, g, b, a].every((part) => Number.isFinite(part))) return null;

      return { a, b: b!, g: g!, r: r! };
    }

    function compositeColor(foreground: RgbaColor, background: RgbaColor) {
      const alpha = foreground.a + background.a * (1 - foreground.a);

      if (alpha <= 0) return { a: 0, b: 0, g: 0, r: 0 };

      return {
        a: alpha,
        b:
          (foreground.b * foreground.a +
            background.b * background.a * (1 - foreground.a)) /
          alpha,
        g:
          (foreground.g * foreground.a +
            background.g * background.a * (1 - foreground.a)) /
          alpha,
        r:
          (foreground.r * foreground.a +
            background.r * background.a * (1 - foreground.a)) /
          alpha,
      };
    }

    function getContrastRatio(foreground: RgbaColor, background: RgbaColor) {
      const lighter = Math.max(
        getRelativeLuminance(foreground),
        getRelativeLuminance(background),
      );
      const darker = Math.min(
        getRelativeLuminance(foreground),
        getRelativeLuminance(background),
      );

      return (lighter + 0.05) / (darker + 0.05);
    }

    function getRelativeLuminance(color: RgbaColor) {
      const [r, g, b] = [color.r, color.g, color.b].map((channel) => {
        const normalized = channel / 255;

        return normalized <= 0.03928
          ? normalized / 12.92
          : ((normalized + 0.055) / 1.055) ** 2.4;
      });

      return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
    }
  });

  expect(readability.text, `${label} has visible text`).not.toBe("");
  expect(readability.visibility, `${label} is visible`).toBe("visible");
  expect(readability.opacity, `${label} is opaque`).toBeGreaterThan(0.95);
  expect(readability.width, `${label} has width`).toBeGreaterThan(0);
  expect(readability.height, `${label} has height`).toBeGreaterThan(0);
  expect(readability.contrast, `${label} contrast`).toBeGreaterThanOrEqual(4.5);
}

type RgbaColor = {
  a: number;
  b: number;
  g: number;
  r: number;
};

async function installReloadMotionMonitor(page: Page) {
  await page.addInitScript(() => {
    const win = window as Window & {
      __reloadMotionMetrics?: {
        layoutShift: number;
        maxMovingElements: number;
        movingSamples: string[];
      };
    };
    const metrics = {
      layoutShift: 0,
      maxMovingElements: 0,
      movingSamples: [] as string[],
    };
    const trackedSelector = [
      ".motion-reveal",
      ".motion-reveal-item",
      ".motion-hero-copy .motion-copy-item",
    ].join(",");
    const describeElement = (element: Element) =>
      [
        element.getAttribute("data-testid"),
        element.id ? `#${element.id}` : "",
        element.className.toString().split(/\s+/).slice(0, 2).join("."),
      ]
        .filter(Boolean)
        .join(" ");
    const isIdentityTransform = (value: string) =>
      value === "none" ||
      value === "matrix(1, 0, 0, 1, 0, 0)" ||
      value === "matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)";

    win.__reloadMotionMetrics = metrics;

    if (
      "PerformanceObserver" in window &&
      PerformanceObserver.supportedEntryTypes.includes("layout-shift")
    ) {
      try {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            const layoutShift = entry as PerformanceEntry & {
              hadRecentInput?: boolean;
              value?: number;
            };

            if (!layoutShift.hadRecentInput) {
              metrics.layoutShift += layoutShift.value ?? 0;
            }
          });
        });

        observer.observe({ buffered: true, type: "layout-shift" });
      } catch {
        // Older browser builds may expose the type without accepting observe options.
      }
    }

    const startedAt = performance.now();
    const sample = () => {
      const movingElements = Array.from(
        document.querySelectorAll<HTMLElement>(trackedSelector),
      ).filter((element) => {
        const styles = window.getComputedStyle(element);

        return (
          !isIdentityTransform(styles.transform) ||
          styles.animationName !== "none"
        );
      });

      if (movingElements.length > 0) {
        metrics.maxMovingElements = Math.max(
          metrics.maxMovingElements,
          movingElements.length,
        );
        if (metrics.movingSamples.length < 8) {
          metrics.movingSamples.push(
            movingElements.map(describeElement).join(", "),
          );
        }
      }

      if (performance.now() - startedAt < 900) {
        window.requestAnimationFrame(sample);
      }
    };

    window.requestAnimationFrame(sample);
  });
}

async function expectReloadMotionStable(page: Page, label: string) {
  const metrics = await page.evaluate(() => {
    const win = window as Window & {
      __reloadMotionMetrics?: {
        layoutShift: number;
        maxMovingElements: number;
        movingSamples: string[];
      };
    };

    return win.__reloadMotionMetrics ?? null;
  });

  expect(metrics, label).not.toBeNull();
  expect(metrics?.layoutShift ?? 0, label).toBeLessThanOrEqual(0.03);
  expect(metrics?.maxMovingElements ?? 0, label).toBe(0);
  expect(metrics?.movingSamples ?? [], label).toEqual([]);
}

function visibleByTestId(page: Page, testId: string) {
  return page.getByTestId(testId).filter({ visible: true });
}

function trackHydrationIssues(page: Page) {
  const hydrationIssuePattern =
    /hydration|hydrate|server rendered|server-rendered|text content does not match|did not match/i;
  const hydrationIssues: string[] = [];

  page.on("console", (message) => {
    if (
      (message.type() === "error" || message.type() === "warning") &&
      hydrationIssuePattern.test(message.text())
    ) {
      hydrationIssues.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    if (hydrationIssuePattern.test(error.message)) {
      hydrationIssues.push(error.message);
    }
  });

  return hydrationIssues;
}

async function expectNoHydrationRegressions(
  page: Page,
  hydrationIssues: string[],
) {
  await expect(
    page.locator(
      "[data-nextjs-dialog], [data-nextjs-dialog-overlay], [data-nextjs-error-overlay]",
    ),
  ).toHaveCount(0);
  expect(hydrationIssues).toEqual([]);
}
