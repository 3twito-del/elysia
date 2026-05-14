import { expect, test, type Page } from "@playwright/test";

const consentStorageKey = "aphrodite_cookie_consent";
const accessibilityStorageKey = "aphrodite.accessibility-settings";
const recentlyViewedStorageKey = "aphrodite_recently_viewed";
const cartStorageKey = "aphrodite_cart_session";
const cartProductSlug = "test-bracelet-sivan-halo-174";
const cartProductName = "צמיד Sivan הילה פתוחה";
const searchProductSlug = "venus-line-ring";
const searchProductName = "טבעת Venus Line";
const publicHeroRoutes = [
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
      page
        .getByTestId("cinematic-page-hero")
        .getByRole("heading", { name: cartProductName }),
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
      page.getByRole("link", { name: /סל קניות, 1 פריטים/ }),
    ).toBeVisible();

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
    await expect(page.locator('[aria-label^="כמות "]')).toContainText("1");
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
      .getByRole("link", { name: new RegExp(searchProductName) })
      .last();

    const productHref = await productResultLink.getAttribute("href");

    expect(productHref).toMatch(new RegExp(`/product/${searchProductSlug}`));
    await page.goto(productHref!);

    await expect(page).toHaveURL(new RegExp(`/product/${searchProductSlug}`));
    await expect(
      page
        .getByTestId("cinematic-page-hero")
        .getByRole("heading", { name: searchProductName }),
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
    await expect(page.getByTestId("category-empty-state")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "איפוס פילטרים" }),
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
    const filterTrigger = page.getByTestId("category-filter-trigger");

    await expect(page.getByTestId("category-results-grid")).toBeVisible();
    await expect(filterTrigger).toHaveCount(1);
    await expect(filterTrigger).toBeVisible();
    await filterTrigger.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page
      .getByTestId("category-filter-sheet")
      .locator("a[href*='sort=price-asc']")
      .first()
      .click();
    await expect(page.getByTestId("category-filter-sheet")).toBeHidden();
    await expect(page).toHaveURL(/sort=price-asc/);

    await page.goto("/category/earrings", { waitUntil: "networkidle" });
    await page.getByTestId("category-filter-trigger").click();
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

    await mobileNavTrigger.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("mobile-nav-sheet")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("mobile-nav-sheet")).toBeHidden();
    await expect(mobileNavTrigger).toBeFocused();

    await page.goto("/search?q=venus", { waitUntil: "domcontentloaded" });
    const searchFilterTrigger = page.getByTestId(
      "mobile-search-filter-trigger",
    );

    await expect(searchFilterTrigger).toBeVisible();
    await searchFilterTrigger.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("mobile-search-filter-sheet")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("mobile-search-filter-sheet")).toBeHidden();
    await expect(searchFilterTrigger).toBeFocused();

    await page.goto("/category/earrings", { waitUntil: "domcontentloaded" });
    const categoryFilterTrigger = page.getByTestId("category-filter-trigger");

    await expect(categoryFilterTrigger).toBeVisible();
    await categoryFilterTrigger.focus();
    await page.keyboard.press("Enter");
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

    const categoryFilterTrigger = page.getByTestId("category-filter-trigger");

    await expect(categoryFilterTrigger).toBeVisible();
    await categoryFilterTrigger.click();
    await expect(page.getByTestId("category-filter-sheet")).toBeVisible();

    await page.setViewportSize({ width: 1024, height: 900 });
    await expect(page.getByTestId("category-filter-sheet")).toBeHidden();
    await expect(page.getByTestId("category-filter-panel")).toBeVisible();

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
          `aphrodite_cart_session=${encodeURIComponent(sessionKey)}`,
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
          `aphrodite_cart_session=${encodeURIComponent(sessionKey)}`,
          "Path=/",
          "SameSite=Lax",
        ].join("; ");
      },
      { cartStorageKey, sessionKey },
    );

    await page.goto("/account", { waitUntil: "domcontentloaded" });

    await expect(page.locator("#identifier")).toBeVisible();
    await expect(page.locator('input[name="sessionKey"]')).toHaveValue(
      sessionKey,
    );
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

    const trigger = page.locator(".public-floating-trigger");
    await expect(trigger).toBeVisible();
    await expect(trigger).toHaveAttribute(
      "aria-label",
      new RegExp("\\u05e0\\u05d2\\u05d9\\u05e9\\u05d5\\u05ea"),
    );
    await trigger.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
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

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
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
      const heroBox = await hero.boundingBox();
      const viewport = page.viewportSize();
      expect(heroBox?.width ?? 0).toBeGreaterThanOrEqual(
        (viewport?.width ?? 0) - 2,
      );
      expect(heroBox?.height ?? 0).toBeGreaterThanOrEqual(
        (viewport?.height ?? 0) - 80,
      );
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
    const header = page.locator("header.site-chrome");

    await expect(scrollCue).toBeVisible();
    await expect(scrollCue).toHaveAttribute("href", "#category-products");
    await scrollCue.click();
    await expect(scrollCue).toHaveAttribute("data-anchor-activating", "true");
    await expect(page).toHaveURL(/#category-products$/);
    expect(page.url()).not.toMatch(/#.*#/);
    await expect(page.locator("#category-products")).toBeInViewport();
    await expectElementAtViewportTop(page, "#category-products");
    await expect(header).toHaveAttribute("data-scroll", "hidden");
  });

  test("home scroll cue normalizes an existing hash instead of duplicating it", async ({
    page,
  }) => {
    await page.goto("/#quick-search", { waitUntil: "networkidle" });

    await page
      .getByTestId("hero-scroll-cue")
      .evaluate((element: HTMLElement) => element.click());

    await expect(page).toHaveURL(/\/#quick-search$/);
    expect(page.url()).not.toContain("#quick-search#quick-search");
    await expectElementAtViewportTop(page, "#quick-search");
  });

  test("clears stale anchor hashes at the page top before reload", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    await page.getByTestId("hero-scroll-cue").click();
    await expectElementAtViewportTop(page, "#quick-search");

    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "auto" }));
    await expect.poll(() => page.evaluate(() => window.location.hash)).toBe("");
    await expectPageAtViewportTop(page);

    await page.reload({ waitUntil: "networkidle" });

    await expectPageAtViewportTop(page);
    expect(page.url()).not.toContain("#");
  });

  for (const route of [...publicHeroRoutes, "/admin/login"]) {
    test(`keeps ${route} inside the viewport width`, async ({ page }) => {
      await page.goto(route, { waitUntil: "networkidle" });

      await expectNoHorizontalOverflow(page);
    });
  }

  test("keeps the home hero offsets balanced on desktop", async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) < 1024, "desktop-only check");

    await page.goto("/", { waitUntil: "networkidle" });

    const offsets = await page.evaluate(() => {
      const hero = document.querySelector(
        '[data-testid="cinematic-page-hero"]',
      );
      const copy = document.querySelector('[data-testid="home-hero-copy"]');
      const actions = document.querySelector(
        '[data-testid="home-hero-actions"]',
      );

      if (!hero || !copy || !actions) {
        throw new Error("Missing home hero alignment targets.");
      }

      const heroRect = hero.getBoundingClientRect();
      const copyRect = copy.getBoundingClientRect();
      const actionsRect = actions.getBoundingClientRect();

      return {
        actionsBottom: Math.round(heroRect.bottom - actionsRect.bottom),
        actionsLeft: Math.round(actionsRect.left - heroRect.left),
        copyRight: Math.round(heroRect.right - copyRect.right),
        copyTop: Math.round(copyRect.top - heroRect.top),
      };
    });

    expect(
      Math.abs(offsets.copyRight - offsets.actionsLeft),
    ).toBeLessThanOrEqual(1);
    expect(
      Math.abs(offsets.copyTop - offsets.actionsBottom),
    ).toBeLessThanOrEqual(1);
    expect(offsets.copyRight).toBeGreaterThanOrEqual(48);
  });
});

test.describe("cookie consent flow", () => {
  test.beforeEach(async ({ page }) => {
    await clearBrowserState(page);
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
      "rgb(66, 201, 190)",
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

async function expectElementAtViewportTop(page: Page, selector: string) {
  await expect
    .poll(
      () =>
        page
          .locator(selector)
          .evaluate((element) =>
            Math.round(Math.abs(element.getBoundingClientRect().top)),
          ),
      { timeout: 10_000 },
    )
    .toBeLessThanOrEqual(2);
}

async function expectPageAtViewportTop(page: Page) {
  await expect
    .poll(() => page.evaluate(() => Math.round(Math.abs(window.scrollY))))
    .toBeLessThanOrEqual(2);
}
