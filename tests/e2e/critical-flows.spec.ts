import { expect, test, type Locator, type Page } from "@playwright/test";

import {
  createAdminAuthFixture,
  signInAdminWithFixture,
} from "./helpers/admin-auth";
import {
  createDisposableAdminProduct,
  deleteDisposableAdminProduct,
  getTestDb,
} from "./helpers/db";

const consentStorageKey = "elysia_cookie_consent";
const accessibilityStorageKey = "elysia.accessibility-settings";
const recentlyViewedStorageKey = "elysia_recently_viewed";
const cartStorageKey = "elysia_cart_session";
const pwaDevCleanupStorageKey = "elysia:pwa-dev-cleanup";
const cartProductSlug = "hera-bracelet";
const cartProductName = "צמיד Hera";
const supplierProductSlug = "elysia-supplier-silver-halo-ring";
const madeToOrderProductSlug = "muse-pearl-earrings";
const madeToOrderProductName = "עגילי Muse Pearl";
const searchProductSlug = "venus-line-ring";
const searchProductName = "טבעת Venus Line";
const checkoutEmptyTitle = "התחילי מהנמכרים ביותר";
const checkoutEmptySupportCopy = "שלושה תכשיטים שנבחרים שוב ושוב";
const checkoutCatalogCta = "התחילי מהנמכרים ביותר";
const checkoutGiftCta = "מצאי מתנה";
const homeHeroTitle = "The Elysia Experience";
const homeHeroDirection = "ltr";
const zeroShekelPattern = /^\D*0\D*\u20aa\D*$/u;
const forbiddenCheckoutStateText = [
  "\u05d8\u05d5\u05e2\u05df \u05e1\u05dc...",
  "\u05d9\u05e6\u05d9\u05e8\u05ea \u05e1\u05dc \u05de\u05e7\u05d5\u05de\u05d9 \u05e2\u05d3\u05d9\u05d9\u05df \u05d1\u05d8\u05e2\u05d9\u05e0\u05d4.",
  "\u05e1\u05dc \u05de\u05e7\u05d5\u05de\u05d9",
] as const;
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
  "/blog",
  "/blog/elysia-jewellery-care-guide",
  "/about",
  "/faq",
  "/privacy",
  "/terms",
  "/accessibility",
];
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
    await waitForProductPurchasePanelClientReady(page);
    await expect(
      page.getByTestId("product-recommendation-rails"),
    ).toBeVisible();
    await expectProductGalleryFullScreenNavigation(page, {
      requireMultiple: false,
    });

    await page.getByRole("button", { exact: true, name: "הוספה לסל" }).click();
    await expect(page.getByText(/נוספה לסל|התכשיט נוסף לסל/)).toBeVisible();
    await expect(page.getByTestId("product-cart-checkout-link")).toBeVisible();

    await page.goto("/checkout");

    await expect(page.getByRole("heading", { name: /סל קניות/ })).toBeVisible();
    await expect(
      page.getByRole("link", { name: new RegExp(cartProductName) }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /המשיכי לתשלום/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /הוספת כמות עבור/ }),
    ).toBeVisible();
    await expect(page.getByTestId("checkout-progress-steps")).toContainText(
      "סקירה",
    );
    await expect(page.getByTestId("checkout-progress-steps")).toContainText(
      "תשלום",
    );
    await expect(page.getByTestId("checkout-line-total").first()).toContainText(
      "סה״כ",
    );
    await expect(
      page.getByTestId("checkout-line-total-amount").first(),
    ).not.toHaveText(zeroShekelPattern);
    await expect(page.getByTestId("checkout-item-count")).toContainText(
      "סוג תכשיט",
    );
    await expect(page.getByTestId("checkout-item-quantity")).toContainText("1");
    await expect(page.getByTestId("checkout-items-price")).not.toHaveText(
      zeroShekelPattern,
    );
    await expect(page.getByTestId("checkout-shipping")).not.toHaveText(
      zeroShekelPattern,
    );
    await expect(page.getByTestId("checkout-subtotal")).not.toHaveText(
      zeroShekelPattern,
    );
    await expect(page.getByTestId("checkout-order-total")).not.toHaveText(
      zeroShekelPattern,
    );
    await expect(page.getByTestId("checkout-order-total")).not.toContainText(
      "לאישור",
    );
    await expect(page.locator('[aria-label^="כמות "]')).toContainText("1");
  });

  test("navigates a multi-image PDP gallery in full screen", async ({
    page,
  }) => {
    await setCookieConsent(page, "essential");
    await page.goto(`/product/${cartProductSlug}`);

    await expect(
      page.getByRole("heading", { name: cartProductName }).first(),
    ).toBeVisible();
    await expectProductGalleryFullScreenNavigation(page);
  });

  test("keeps desktop PDP imagery visible while purchase details scroll", async ({
    page,
  }) => {
    test.skip((page.viewportSize()?.width ?? 0) < 1024, "desktop-only layout");

    await setCookieConsent(page, "essential");
    await page.goto(`/product/${supplierProductSlug}`);

    await expect(page.getByTestId("product-gallery")).toBeVisible();
    await waitForProductPurchasePanelClientReady(page);
    await waitForPublicMotionReady(page);
    await page.getByTestId("product-commerce-trust").scrollIntoViewIfNeeded();

    const layout = await page.evaluate(() => {
      const gallery = document.querySelector('[data-testid="product-gallery"]');
      const trust = document.querySelector(
        '[data-testid="product-commerce-trust"]',
      );

      if (!gallery || !trust) {
        throw new Error("Missing PDP layout elements.");
      }

      const galleryRect = gallery.getBoundingClientRect();
      const trustRect = trust.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const getVisibleHeight = (rect: DOMRect) =>
        Math.max(
          0,
          Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0),
        );

      return {
        galleryVisibleHeight: Math.round(getVisibleHeight(galleryRect)),
        trustVisibleHeight: Math.round(getVisibleHeight(trustRect)),
        viewportHeight,
      };
    });

    expect(layout.trustVisibleHeight).toBeGreaterThan(120);
    expect(layout.galleryVisibleHeight).toBeGreaterThan(
      Math.round(layout.viewportHeight * 0.38),
    );
  });

  test("keeps desktop PDP primary gallery crop optically right-balanced", async ({
    page,
  }) => {
    test.skip((page.viewportSize()?.width ?? 0) < 1024, "desktop-only layout");

    await setCookieConsent(page, "essential");
    await page.goto(`/product/${supplierProductSlug}`);

    await expect(page.getByTestId("product-gallery")).toBeVisible();
    await expect(page.getByTestId("product-gallery-main-image")).toBeVisible();

    const crop = await page.evaluate(() => {
      const frame = document.querySelector('[data-testid="product-gallery"]');
      const image = document.querySelector(
        '[data-testid="product-gallery-main-image"]',
      );

      if (!frame || !image) {
        throw new Error("Missing PDP gallery crop elements.");
      }

      const frameRect = frame.getBoundingClientRect();
      const imageRect = image.getBoundingClientRect();

      return {
        frameLeft: Math.round(frameRect.left),
        frameRight: Math.round(frameRect.right),
        imageLeft: Math.round(imageRect.left),
        imageRight: Math.round(imageRect.right),
        mediaCenterOffset: Math.round(
          (imageRect.left + imageRect.right) / 2 -
            (frameRect.left + frameRect.right) / 2,
        ),
      };
    });

    expect(crop.imageLeft).toBeLessThanOrEqual(crop.frameLeft + 2);
    expect(crop.imageRight).toBeGreaterThanOrEqual(crop.frameRight + 18);
    expect(crop.mediaCenterOffset).toBeGreaterThanOrEqual(16);
  });

  test("keeps desktop PDP service details centered with inset icons", async ({
    page,
  }) => {
    test.skip((page.viewportSize()?.width ?? 0) < 1024, "desktop-only layout");

    await setCookieConsent(page, "essential");
    await page.goto(`/product/${supplierProductSlug}`);

    await page
      .getByTestId("product-service-details-layout")
      .scrollIntoViewIfNeeded();

    const layout = await page.evaluate(() => {
      const details = document.querySelector(
        '[data-testid="product-service-details-layout"]',
      );
      const summary = document.querySelector(
        '[data-testid="product-service-summary"]',
      );
      const row = document.querySelector('[data-testid="product-service-row"]');
      const icon = document.querySelector(
        '[data-testid="product-service-row-icon"]',
      );

      if (!details || !summary || !row || !icon) {
        throw new Error("Missing PDP service detail layout elements.");
      }

      const detailsRect = details.getBoundingClientRect();
      const summaryRect = summary.getBoundingClientRect();
      const rowRect = row.getBoundingClientRect();
      const iconRect = icon.getBoundingClientRect();

      return {
        detailsLeftGap: Math.round(detailsRect.left),
        detailsRightGap: Math.round(window.innerWidth - detailsRect.right),
        detailsWidth: Math.round(detailsRect.width),
        iconRightInset: Math.round(rowRect.right - iconRect.right),
        summaryWidth: Math.round(summaryRect.width),
      };
    });

    expect(
      Math.abs(layout.detailsLeftGap - layout.detailsRightGap),
    ).toBeLessThanOrEqual(64);
    expect(layout.summaryWidth).toBeGreaterThan(
      Math.round(layout.detailsWidth * 0.86),
    );
    expect(layout.iconRightInset).toBeGreaterThanOrEqual(20);
  });

  test("shows supplier-only checkout without local order fields", async ({
    page,
  }) => {
    await setCookieConsent(page, "essential");
    await page.goto(`/product/${supplierProductSlug}`);

    await expect(page.getByTestId("product-variant-feedback")).toBeVisible();
    await waitForProductPurchasePanelClientReady(page);
    const addToCartButton = page.getByTestId("product-add-to-cart-button");

    await clickAddToCartAndExpectCheckoutLink(page, addToCartButton);

    await page.goto("/checkout");

    await expect(
      page.getByTestId("checkout-supplier-only-message"),
    ).toBeVisible();
    await expect(
      page.getByTestId("checkout-dropship-only-summary"),
    ).toBeVisible();
    await expect(
      page.getByTestId("checkout-source-group-dropship_shopify"),
    ).toBeVisible();
    await expect(
      page.getByTestId("shopify-dropship-checkout-button"),
    ).toBeVisible();
    await expect(page.getByTestId("checkout-dropship-subtotal")).not.toHaveText(
      zeroShekelPattern,
    );
    await expect(page.getByTestId("checkout-progress-steps")).toHaveCount(0);
    await expect(page.getByTestId("local-checkout-submit-button")).toHaveCount(
      0,
    );
    await expect(page.locator("#name")).toHaveCount(0);
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
      page
        .locator("[data-testid='product-purchase-panel']")
        .getByRole("button", { name: /^54\b/ }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(
      page
        .locator("[data-testid='product-purchase-panel']")
        .getByRole("button", { name: /^54\b/ }),
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
      .getByRole("link", { name: /יצירת קשר להזמנה/ })
      .filter({ visible: true })
      .first();

    const serviceHref = await serviceCta.getAttribute("href");

    expect(serviceHref).toMatch(/\/service\?/);
    await page.goto(serviceHref!, { waitUntil: "domcontentloaded" });
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
      page.getByRole("heading", { name: /חיפוש תכשיטים/ }),
    ).toBeVisible();
    const productResultLink = page
      .getByTestId("search-results-grid")
      .getByRole("link", { name: new RegExp(escapeRegExp(searchProductName)) })
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
    const searchMain = page.locator("#main-content");

    await expect(searchMain.getByTestId("search-empty-state")).toBeVisible();
    await expect(searchMain.getByTestId("search-form")).toBeVisible();
    await expect(searchMain.getByTestId("search-result-count")).toBeVisible();
    await expect(
      searchMain
        .getByTestId("search-recovery-actions")
        .getByRole("link")
        .first(),
    ).toBeVisible();

    const categoryNoResultsParams = new URLSearchParams({
      material: "זהב לבן 14K",
      stone: "יהלום",
    });

    await page.goto(`/category/earrings?${categoryNoResultsParams}`);
    const categoryEmptyState = visibleByTestId(page, "category-empty-state");

    await expect(categoryEmptyState).toBeVisible();
    await expect(
      categoryEmptyState.getByRole("link", { name: "איפוס סינונים" }),
    ).toBeVisible();

    await page.goto("/checkout");
    await expect(page.getByTestId("cart-checkout-form")).toBeVisible();
    const checkoutEmptyState = page.getByTestId("checkout-empty-cart");

    await expect(checkoutEmptyState).toBeVisible();
    await expect(checkoutEmptyState).toContainText(checkoutEmptyTitle);
    await expect(
      checkoutEmptyState.getByRole("link", { name: checkoutCatalogCta }),
    ).toBeVisible();
    await expect(
      checkoutEmptyState.getByRole("link", {
        exact: true,
        name: checkoutGiftCta,
      }),
    ).toBeVisible();
    await expect(
      page.getByTestId("checkout-empty-recommended-product"),
    ).toHaveCount(3);
    await expect(page.getByTestId("checkout-empty-actions")).toContainText(
      cartProductName,
    );

    for (const stateText of forbiddenCheckoutStateText) {
      await expect(page.locator("body")).not.toContainText(stateText);
    }
  });

  test("renders empty checkout content in the initial HTML", async ({
    request,
  }) => {
    const response = await request.get("/checkout");

    expect(response.ok()).toBe(true);

    const html = await response.text();

    expect(html).toContain(checkoutEmptyTitle);
    expect(html).toContain(checkoutEmptySupportCopy);
    expect(html).toContain(checkoutCatalogCta);
    expect(html).toContain(checkoutGiftCta);
    expect(html).toContain("checkout-empty-recommended-product");
    expect(html).not.toContain("checkout-loading-skeleton");

    for (const stateText of forbiddenCheckoutStateText) {
      expect(html).not.toContain(stateText);
    }
  });

  test("renders empty checkout fallback without JavaScript", async ({
    baseURL,
    browser,
  }) => {
    const context = await browser.newContext({
      javaScriptEnabled: false,
      locale: "he-IL",
      viewport: { height: 844, width: 390 },
    });
    const page = await context.newPage();

    try {
      await page.goto(
        new URL("/checkout", baseURL ?? "http://localhost:3000").toString(),
      );
      const checkoutEmptyState = page.getByTestId("checkout-empty-cart");

      await expect(checkoutEmptyState).toBeVisible();
      await expect(checkoutEmptyState).toContainText(checkoutEmptyTitle);
      await expect(checkoutEmptyState).toContainText(checkoutEmptySupportCopy);
      await expect(
        checkoutEmptyState.getByRole("link", { name: checkoutCatalogCta }),
      ).toBeVisible();
      await expect(
        checkoutEmptyState.getByRole("link", {
          exact: true,
          name: checkoutGiftCta,
        }),
      ).toBeVisible();
      await expect(
        page.getByTestId("checkout-empty-recommended-product"),
      ).toHaveCount(3);

      for (const stateText of forbiddenCheckoutStateText) {
        await expect(page.locator("body")).not.toContainText(stateText);
      }
    } finally {
      await context.close();
    }
  });

  test("shows category not-found recovery", async ({ page }) => {
    await setCookieConsent(page, "essential");

    await page.goto("/category/not-a-real-category");

    const notFoundState = page.getByTestId("category-not-found-state");

    await expect(notFoundState).toBeVisible();
    await expect(
      notFoundState.getByRole("link", { name: "חיפוש במבחר" }),
    ).toBeVisible();
  });

  test("shows product not-found recovery", async ({ page }) => {
    await setCookieConsent(page, "essential");

    await page.goto("/product/not-a-real-product");

    const notFoundState = page.getByTestId("product-not-found-empty-state");

    await expect(notFoundState).toBeVisible();
    await expect(
      notFoundState.getByRole("link", { name: "חיפוש במבחר" }),
    ).toBeVisible();
  });

  test("opens mobile navigation", async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) >= 768, "mobile-only flow");
    await setCookieConsent(page, "essential");

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.getByTestId("mobile-nav-trigger").click();
    await expect(page.getByTestId("mobile-nav-sheet")).toBeVisible();
    const ringsNavLink = page.locator(
      '[data-testid="mobile-nav-link"][href="/category/rings"]',
    );

    await expect(ringsNavLink).toBeVisible();
    await ringsNavLink.click();
    await expect(page.getByTestId("mobile-nav-sheet")).toBeHidden();
    await expect(page).toHaveURL(/\/category\/rings/);

    await page.getByTestId("mobile-nav-trigger").click();
    await expect(page.getByTestId("mobile-nav-sheet")).toBeVisible();
    await page.setViewportSize({ width: 1024, height: 900 });
    await expect(page.getByTestId("mobile-nav-sheet")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("mobile-nav-sheet")).toBeHidden();
  });

  test("opens mobile category filter sheet", async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) >= 1024, "mobile-only flow");
    await setCookieConsent(page, "essential");

    await page.goto("/category/earrings", { waitUntil: "domcontentloaded" });
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

    await page.goto("/category/earrings", { waitUntil: "domcontentloaded" });
    const secondFilterTrigger = visibleByTestId(
      page,
      "category-filter-trigger",
    );

    await expect(secondFilterTrigger).toHaveAttribute("aria-expanded", "false");
    await secondFilterTrigger.click();
    await expect(secondFilterTrigger).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByTestId("category-filter-sheet")).toBeVisible();
    await page.setViewportSize({ width: 1024, height: 900 });
    await expect(page.getByTestId("category-filter-sheet")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("category-filter-sheet")).toBeHidden();
  });

  test("closes mobile search filter sheet at the tablet breakpoint", async ({
    page,
  }) => {
    test.skip((page.viewportSize()?.width ?? 0) >= 768, "mobile-only flow");
    await setCookieConsent(page, "essential");

    await page.goto("/search?q=venus", { waitUntil: "networkidle" });
    const mobileControls = visibleByTestId(page, "mobile-search-controls");

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

    await page.goto("/", { waitUntil: "domcontentloaded" });
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

    await page.goto("/category/earrings", { waitUntil: "domcontentloaded" });
    const categoryFilterTrigger = visibleByTestId(
      page,
      "category-filter-trigger",
    );

    await expect(categoryFilterTrigger).toBeVisible();
    await expect(categoryFilterTrigger).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    await expect(categoryFilterTrigger).toBeEnabled();
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
    await expect(page.getByTestId("mobile-nav-sheet")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("mobile-nav-sheet")).toBeHidden();
    await expect(mobileNavTrigger).toBeVisible();

    await reloadCurrentPage(page);
    await expectDomSelectorVisible(page, "[data-testid='mobile-nav-trigger']");

    await page.setViewportSize({ width: 390, height: 900 });
    await reloadCurrentPage(page);
    await expectDomSelectorVisible(page, "[data-testid='mobile-nav-trigger']");

    await expectNoHydrationRegressions(page, hydrationIssues);
  });

  test("keeps responsive filter sheets hydration-clean across breakpoints", async ({
    page,
  }) => {
    const hydrationIssues = trackHydrationIssues(page);

    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto("/search?q=venus", { waitUntil: "domcontentloaded" });

    const mobileSearchControls = visibleByTestId(
      page,
      "mobile-search-controls",
    );

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
    await expect(page.getByTestId("category-filter-sheet")).toBeVisible();
    await expect(visibleByTestId(page, "category-filter-panel")).toHaveCount(0);
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("category-filter-sheet")).toBeHidden();

    await expectNoHydrationRegressions(page, hydrationIssues);
  });

  test("keeps stored cart sessions from causing public hydration mismatch", async ({
    page,
  }) => {
    const sessionKey = "cart_hydration_regression_123456789";
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

    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("mobile-nav-trigger")).toBeVisible();

    await page.setViewportSize({ width: 1280, height: 900 });
    await expect(
      page.locator("header").getByRole("link", {
        exact: true,
        name: "חיפוש",
      }),
    ).toBeVisible();

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

  test("exposes keyboard skip navigation", async ({ browserName, page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await waitForPublicMotionReady(page);

    const skipLink = page.getByRole("link", { name: "דילוג לתוכן" });
    if (browserName === "webkit") {
      await skipLink.focus();
    } else {
      await page.keyboard.press("Tab");
    }

    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeVisible();

    await skipLink.press("Enter");
    await expect(page.locator("html")).toHaveAttribute(
      "data-anchor-scroll-active",
      "true",
    );
  });

  test("exposes accessible names for the home search entry points", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    await expect(
      page.getByRole("heading", { level: 1, name: homeHeroTitle }),
    ).toBeVisible();
    await expect(page.getByTestId("home-hero-copy")).toHaveAttribute(
      "data-hero-copy-direction",
      homeHeroDirection,
    );
    await expect(page.getByTestId("home-hero-copy")).toHaveAttribute(
      "dir",
      homeHeroDirection,
    );
    await expect(page.getByTestId("home-hero-primary-cta")).toHaveAttribute(
      "href",
      "/search",
    );

    await page.goto("/search");

    await page
      .locator("#main-content")
      .getByTestId("search-controls-toggle")
      .click();
    await expect(
      page
        .getByRole("search", { name: /חיפוש תכשיטים|חיפוש מהיר/ })
        .filter({ visible: true })
        .first(),
    ).toBeVisible();
    await expect(
      page
        .getByRole("textbox", {
          name: "חיפוש תכשיט, חומר, אבן, אירוע או מחיר",
        })
        .first(),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { exact: true, name: "חיפוש" }).first(),
    ).toBeVisible();
  });

  test("keeps the accessibility widget keyboard-operable", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

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

    await trigger.press("Enter");

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
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(trigger).toBeVisible();
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
    const kineticImageReduced = await page
      .locator("[data-kinetic-image]")
      .first()
      .getAttribute("data-motion-reduced");
    const kineticImageTransform = await page
      .locator("[data-kinetic-image] .kinetic-image-layer")
      .first()
      .evaluate((element) => window.getComputedStyle(element).transform);

    expect(isIdentityCssTransform(revealMotion.transform)).toBe(true);
    expect(
      revealMotion.transitionDurationsMs.every((duration) => duration <= 0.01),
    ).toBe(true);
    expect(kineticImageReduced).toBe("true");
    expect(isIdentityCssTransform(kineticImageTransform)).toBe(true);
  });

  test("keeps selected size controls readable on hover and focus", async ({
    page,
  }) => {
    await page.goto("/size-guide?kind=ring", { waitUntil: "domcontentloaded" });

    const selectedSizeControls = page
      .getByTestId("size-guide-tool")
      .locator("button[aria-pressed='true']");

    await expect(selectedSizeControls).toHaveCount(3);

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

      await reloadCurrentPage(page);
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
    await expect(
      homeHero.getByRole("heading", { level: 1, name: homeHeroTitle }),
    ).toBeVisible();
    const heroCollectionLink = homeHero.locator(
      'a.home-hero-cta-primary[href="/search"]',
    );

    await expect(heroCollectionLink).toBeVisible();
    await expect(page.getByTestId("home-hero-statement")).toBeVisible();
    await expect(
      homeHero.locator('a.home-hero-cta-secondary[href="/gifts"]'),
    ).toHaveCount(0);
    await expect(page.getByTestId("home-hero-secondary-line")).toHaveCount(0);
    await expect(page.getByTestId("home-commerce-entry-links")).toHaveCount(0);
    await expect(
      homeHero.locator('a.home-hero-service-link[href="/service"]'),
    ).toHaveCount(0);
    await expect(homeHero.locator(".home-hero-help-cta")).toHaveCount(0);
    await expect(page.getByTestId("home-hero-trust-notes")).toHaveCount(0);
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
      /^rgba?\(255, 250, 244(?:, (?:0\.9[0-9]|1))?\)$/,
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
    await expectDomSelectorVisible(
      page,
      "[data-testid='gift-results-summary']",
    );
    await expectDomSelectorVisible(page, "[data-testid='gift-results-grid']");
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
      const statement = document.querySelector(
        '[data-testid="home-hero-statement"]',
      );
      const actions = document.querySelector(
        '[data-testid="home-hero-actions"]',
      );

      if (!header || !hero || !copy || !statement || !actions) {
        throw new Error("Missing home hero alignment targets.");
      }

      const headerRect = header.getBoundingClientRect();
      const heroRect = hero.getBoundingClientRect();
      const copyRect = copy.getBoundingClientRect();
      const statementRect = statement.getBoundingClientRect();
      const actionsRect = actions.getBoundingClientRect();

      return {
        headerHeight: Math.round(headerRect.height),
        heroTop: Math.round(heroRect.top),
        copyRight: Math.round(heroRect.right - copyRect.right),
        copyTop: Math.round(copyRect.top - heroRect.top),
        copyBottom: Math.round(heroRect.bottom - copyRect.bottom),
        ctaAfterStatement: Math.round(actionsRect.top - statementRect.bottom),
      };
    });

    expect(offsets.heroTop).toBe(0);
    expect(offsets.copyRight).toBeGreaterThanOrEqual(48);
    expect(offsets.copyTop).toBeGreaterThanOrEqual(offsets.headerHeight + 48);
    expect(offsets.copyBottom).toBeGreaterThanOrEqual(40);
    expect(offsets.ctaAfterStatement).toBeGreaterThanOrEqual(24);
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

    await expectNoCookieConsentBanner(page);
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (window as Window & { __cookieBannerSeen?: boolean })
              .__cookieBannerSeen,
        ),
      )
      .toBe(false);

    await reloadCurrentPage(page);
    await page.waitForTimeout(100);

    await expectNoCookieConsentBanner(page);
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

  test("records first-party analytics by default and clears it when switching to essential", async ({
    page,
  }) => {
    await page.goto(`/product/${searchProductSlug}`);

    await expect(
      page.getByRole("region", { name: "בחירת קוקיז" }),
    ).toBeVisible();
    await expectRecentlyViewed(page, searchProductSlug, true);

    const acceptCookiesButton = page.getByRole("button", {
      name: "אישור הכל",
    });
    await expect(acceptCookiesButton).toHaveCSS(
      "background-color",
      "rgb(29, 25, 22)",
    );
    await acceptCookiesButton.click();

    await expect(
      page.getByRole("region", { name: "בחירת קוקיז" }),
    ).toBeHidden();
    await expectCookieConsent(page, "all");
    await expectRecentlyViewed(page, searchProductSlug, true);

    await page.goto("/privacy");
    const essentialCookiesButton = page
      .getByRole("region", { name: "ניהול העדפות קוקיז" })
      .getByRole("button", { name: "רק חיוניים" });

    await expect(essentialCookiesButton).toBeVisible();
    await essentialCookiesButton.focus();
    await essentialCookiesButton.press("Enter");

    await expectCookieConsent(page, "essential");
    await expectRecentlyViewed(page, searchProductSlug, false);

    await reloadCurrentPage(page);
    await expectNoCookieConsentBanner(page);
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

    // proxy.ts intentionally omits `?next=` for the bare /admin path — it's
    // already the login form's own default redirect target
    // (sanitizeAdminRedirect(undefined) === "/admin"), so appending it would
    // be redundant.
    await expect(page).toHaveURL(/\/admin\/login$/);
    await expect(page.locator('input[name="next"]')).toHaveValue("/admin");
    await expect(page.locator("#email")).toBeVisible();

    await page.goto("/admin/login?next=https://evil.example/admin");
    await expect(page.locator('input[name="next"]')).toHaveValue("/admin");
  });

  test("protects routed admin operations pages", async ({ page }) => {
    for (const route of [
      "/admin/insights",
      "/admin/insights/live",
      "/admin/insights/replay",
      "/admin/insights/replay/fixture-session",
      "/admin/crm",
      "/admin/orders",
      "/admin/catalog",
      "/admin/inventory",
      "/admin/customers",
      "/admin/customers/fixture-customer",
      "/admin/erp",
      "/admin/finance",
      "/admin/appointments",
      "/admin/integrations",
      "/admin/audit",
    ]) {
      await page.goto(route);
      await expect(page).toHaveURL(/\/admin\/login\?next=/);
      await expect(page.locator('input[name="next"]')).toHaveValue(route);
    }
  });

  test("authenticated admins can open the operations shell", async ({
    page,
  }) => {
    await signInAdminWithFixture(page);
    await page.goto("/admin/orders");

    await expect(page).toHaveURL(/\/admin\/orders/);
    await expect(page.getByRole("link", { name: /הזמנות/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: "הזמנות" })).toBeVisible();
    await expect(page.getByRole("link", { name: /אינטגרציות/ })).toBeVisible();
  });

  test("password alone does not reach the admin shell — MFA is mandatory", async ({
    page,
  }) => {
    const fixture = await createAdminAuthFixture(page, "full");

    await page.goto("/admin/login");
    await page.locator("#email").fill(fixture.email);
    await page.locator("#password").fill(fixture.password);
    await page.getByRole("button", { name: /אדמין|Admin/u }).click();

    await expect(page).toHaveURL(/\/admin\/login\/mfa/);
    await page.goto("/admin/orders");
    await expect(page).toHaveURL(/\/admin\/login\?next=/);
  });

  test("logging in with a recovery code succeeds and rejects reuse", async ({
    page,
  }) => {
    const fixture = await signInAdminWithFixture(page, {
      useRecoveryCode: true,
    });

    await page.goto("/admin/orders");
    await expect(page).toHaveURL(/\/admin\/orders/);

    await page.locator("text=יציאה").first().click();
    await expect(page).toHaveURL(/\/admin\/login/);

    await page.locator("#email").fill(fixture.email);
    await page.locator("#password").fill(fixture.password);
    await page.getByRole("button", { name: /אדמין|Admin/u }).click();
    await expect(page).toHaveURL(/\/admin\/login\/mfa/);

    const beforeReuse = await page.evaluate(() => document.body.innerText);

    await page.locator("#code").fill(fixture.recoveryCodes[0]!);
    await page.getByRole("button", { name: /אישור/u }).click();
    await page.waitForFunction(
      (prevText) => document.body.innerText !== prevText,
      beforeReuse,
      { timeout: 20_000 },
    );

    await expect(page).toHaveURL(/\/admin\/login\/mfa/);
    await expect(page.getByText("קוד שגוי")).toBeVisible();
  });

  test("a limited-permission admin is denied an orders-only page", async ({
    page,
  }) => {
    await signInAdminWithFixture(page, { role: "limited" });
    await page.goto("/admin/orders");

    await expect(page).toHaveURL(/\/admin\/orders/);
    await expect(page.getByText("אין הרשאה למסך המבוקש")).toBeVisible();
  });

  test("regenerating recovery codes is a real write, recorded in the audit log", async ({
    page,
  }) => {
    const fixture = await signInAdminWithFixture(page);

    await page.goto("/admin/security");
    await expect(
      page.getByRole("button", { name: "יצירת קודי גיבוי חדשים" }),
    ).toBeVisible();

    const before = new Date();

    await page
      .getByRole("button", { name: "יצירת קודי גיבוי חדשים" })
      .click();
    await expect(
      page.getByRole("heading", { name: "קודי גיבוי חדשים" }),
    ).toBeVisible();

    const auditRow = await getTestDb().auditLog.findFirst({
      orderBy: { createdAt: "desc" },
      where: {
        action: "admin_recovery_code.generated",
        adminUserId: fixture.adminUserId,
        createdAt: { gte: before },
      },
    });

    expect(
      auditRow,
      "expected an admin_recovery_code.generated AuditLog row for this admin",
    ).not.toBeNull();
  });

  test("adjusting inventory is a real write, recorded in the audit log", async ({
    page,
  }) => {
    const fixture = await createDisposableAdminProduct({
      status: "DRAFT",
      withInventory: true,
    });

    try {
      await signInAdminWithFixture(page);
      await page.goto(`/admin/inventory?query=${fixture.variantSku}`);

      const row = page.getByRole("row").filter({ hasText: fixture.variantSku });
      const quantityInput = row.getByRole("spinbutton").first();

      await expect(quantityInput).toHaveValue("10");
      await quantityInput.fill("15");

      const before = new Date();

      await row.getByRole("button", { name: "שמירת מלאי" }).click();
      await expect(page.getByText("המלאי נשמר.")).toBeVisible();

      const auditRow = await getTestDb().auditLog.findFirst({
        orderBy: { createdAt: "desc" },
        where: {
          action: "inventory_updated",
          entity: "InventoryItem",
          entityId: fixture.variantId,
          createdAt: { gte: before },
        },
      });

      expect(
        auditRow,
        "expected an inventory_updated AuditLog row for this variant",
      ).not.toBeNull();

      const ledgerRow = await getTestDb().inventoryLedger.findFirst({
        orderBy: { createdAt: "desc" },
        where: { variantId: fixture.variantId, createdAt: { gte: before } },
      });

      expect(ledgerRow?.delta).toBe(5);
    } finally {
      await deleteDisposableAdminProduct(fixture.productId);
    }
  });

  test("archiving a product is a real write, recorded in the audit log", async ({
    page,
  }) => {
    const fixture = await createDisposableAdminProduct({ status: "ACTIVE" });

    try {
      await signInAdminWithFixture(page);
      await page.goto(`/admin/catalog?query=${fixture.productSku}`);

      const row = page.getByRole("row").filter({ hasText: fixture.productSku });

      await expect(row).toBeVisible();

      const before = new Date();

      await row.getByRole("button", { name: "ארכוב" }).click();
      await expect(page.getByText("סטטוס המוצר עודכן.")).toBeVisible();

      const auditRow = await getTestDb().auditLog.findFirst({
        orderBy: { createdAt: "desc" },
        where: {
          action: "product_status_updated",
          entity: "Product",
          entityId: fixture.productId,
          createdAt: { gte: before },
        },
      });

      expect(
        auditRow,
        "expected a product_status_updated AuditLog row for this product",
      ).not.toBeNull();

      const updatedProduct = await getTestDb().product.findUniqueOrThrow({
        where: { id: fixture.productId },
      });

      expect(updatedProduct.status).toBe("ARCHIVED");
    } finally {
      await deleteDisposableAdminProduct(fixture.productId);
    }
  });

  test("refunding an order is a real write, recorded in the audit log and outbox", async ({
    page,
  }, testInfo) => {
    const namespace = `refund-worker-${testInfo.parallelIndex}`;
    const setupResponse = await page.request.post("/api/e2e/customer-auth", {
      data: {
        email: `e2e.customer+${namespace}@elysia.local`,
        sessionKey: `e2e_customer_auth_fixture_${namespace}`,
      },
    });

    expect(setupResponse.status()).toBe(200);

    const setup = (await setupResponse.json()) as {
      fixture: { localOrderId: string };
    };
    const orderId = setup.fixture.localOrderId;

    await signInAdminWithFixture(page);
    await page.goto(`/admin/orders/${orderId}`);

    await page
      .getByPlaceholder("סיבת זיכוי")
      .fill("החזרה עקב פגם - בדיקת E2E");

    const before = new Date();

    await page.getByRole("button", { name: /ביצוע זיכוי/ }).click();
    await page.getByRole("button", { name: "אישור זיכוי" }).click();

    await expect(
      page.getByText("הזיכוי נשמר וההזמנה עודכנה."),
    ).toBeVisible();

    const auditRow = await getTestDb().auditLog.findFirst({
      orderBy: { createdAt: "desc" },
      where: {
        action: "order_refunded",
        entity: "Order",
        entityId: orderId,
        createdAt: { gte: before },
      },
    });

    expect(
      auditRow,
      "expected an order_refunded AuditLog row for this order",
    ).not.toBeNull();

    // createOutboxEvent upserts by idempotencyKey (`email.requested:refund:<orderId>`)
    // — a re-run against the same worker-pinned fixture order updates the
    // existing row rather than inserting a new one, so this checks
    // `updatedAt` (always bumped) rather than `createdAt` (only set once).
    const outboxRow = await getTestDb().outboxEvent.findFirst({
      orderBy: { updatedAt: "desc" },
      where: {
        type: "email.requested",
        aggregateType: "Order",
        aggregateId: orderId,
        updatedAt: { gte: before },
      },
    });

    expect(
      outboxRow,
      "expected an email.requested OutboxEvent for the refund",
    ).not.toBeNull();
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
      recovery: {
        href: "/account",
        rel: "account-sign-in",
      },
    });
  });
});

async function expectProductGalleryFullScreenNavigation(
  page: Page,
  { requireMultiple = true }: { requireMultiple?: boolean } = {},
) {
  const isDesktopMosaic = (page.viewportSize()?.width ?? 0) >= 1024;
  const galleryThumbnails = page.getByTestId("product-gallery-thumbnail");
  const galleryThumbnailCount = await galleryThumbnails.count();

  if (!requireMultiple && galleryThumbnailCount <= 1) return;

  expect(galleryThumbnailCount).toBeGreaterThan(1);

  if (isDesktopMosaic) {
    await expect(
      page.getByTestId("product-gallery-integrated-layout"),
    ).toBeVisible();
    await expect(
      page.getByTestId("product-gallery-secondary-stack"),
    ).toBeVisible();
    await expect(galleryThumbnails.first()).toBeHidden();

    const galleryLayout = await page.evaluate(() => {
      const main = document.querySelector('[data-testid="product-gallery"]');
      const stack = document.querySelector(
        '[data-testid="product-gallery-secondary-stack"]',
      );

      if (!main || !stack) throw new Error("Missing PDP gallery mosaic.");

      const mainRect = main.getBoundingClientRect();
      const stackRect = stack.getBoundingClientRect();

      return {
        mainHeight: Math.round(mainRect.height),
        mainLeft: Math.round(mainRect.left),
        stackHeight: Math.round(stackRect.height),
        stackLeft: Math.round(stackRect.left),
      };
    });

    expect(galleryLayout.mainLeft).toBeGreaterThan(galleryLayout.stackLeft);
    expect(
      Math.abs(galleryLayout.mainHeight - galleryLayout.stackHeight),
    ).toBeLessThanOrEqual(2);

    await page.getByTestId("product-gallery-secondary-tile").first().click();
    await expect(
      page.getByTestId("product-gallery-selection-status"),
    ).toContainText(/2\/\d+/);

    const moreImagesTrigger = page.getByTestId(
      "product-gallery-more-images-trigger",
    );
    if ((await moreImagesTrigger.count()) > 0) {
      await moreImagesTrigger.click();
      await expect(
        page.getByTestId("product-gallery-fullscreen-dialog"),
      ).toBeVisible();
      await page.getByTestId("product-gallery-fullscreen-close").click();
      await expect(
        page.getByTestId("product-gallery-fullscreen-dialog"),
      ).toBeHidden();
    }
  } else {
    await expect(
      page.getByTestId("product-gallery-secondary-stack"),
    ).toBeHidden();
    await expect(galleryThumbnails.first()).toBeVisible();
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

  const fullscreenTrigger = page.getByTestId(
    "product-gallery-fullscreen-trigger",
  );
  const touchZoomTrigger = page.getByTestId(
    "product-gallery-touch-zoom-trigger",
  );
  const mainGalleryBox = await page
    .getByTestId("product-gallery")
    .boundingBox();

  await expect(fullscreenTrigger).toBeVisible();
  if ((page.viewportSize()?.width ?? 0) < 640) {
    await expect(touchZoomTrigger).toBeVisible();
    await touchZoomTrigger.click();
    await expect(
      page.getByTestId("product-gallery-fullscreen-dialog"),
    ).toBeVisible();
    await expect(
      page.getByTestId("product-gallery-fullscreen-stage"),
    ).toHaveAttribute("data-gallery-zoomed", "true");
    await page.getByTestId("product-gallery-fullscreen-close").click();
    await expect(
      page.getByTestId("product-gallery-fullscreen-dialog"),
    ).toBeHidden();
  }
  await fullscreenTrigger.click();
  await expect(
    page.getByTestId("product-gallery-fullscreen-dialog"),
  ).toBeVisible();
  await expect(
    page.getByTestId("product-gallery-fullscreen-stage"),
  ).toBeVisible();
  await expect(
    page.getByTestId("product-gallery-fullscreen-stage"),
  ).toHaveAttribute("data-gallery-zoomed", "false");
  await expect(
    page.getByTestId("product-gallery-fullscreen-zoom-toggle"),
  ).toBeVisible();
  await page.getByTestId("product-gallery-fullscreen-zoom-toggle").click();
  await expect(
    page.getByTestId("product-gallery-fullscreen-stage"),
  ).toHaveAttribute("data-gallery-zoomed", "true");
  await page.getByTestId("product-gallery-fullscreen-zoom-out").click();
  await expect(
    page.getByTestId("product-gallery-fullscreen-stage"),
  ).toHaveAttribute("data-gallery-zoomed", "false");

  const fullscreenLayout = await page.evaluate(() => {
    const dialog = document.querySelector(
      '[data-testid="product-gallery-fullscreen-dialog"]',
    );
    const stage = document.querySelector(
      '[data-testid="product-gallery-fullscreen-stage"]',
    );
    const media = document.querySelector(
      '[data-testid="product-gallery-fullscreen-media"]',
    );
    const previous = document.querySelector(
      '[data-testid="product-gallery-previous"]',
    );
    const next = document.querySelector('[data-testid="product-gallery-next"]');
    const filmstrip = document.querySelector(
      '[data-testid="product-gallery-fullscreen-thumbnail-rail"]',
    );

    if (!dialog || !stage || !media || !previous || !next || !filmstrip) {
      throw new Error("Missing full-screen gallery elements.");
    }

    const dialogRect = dialog.getBoundingClientRect();
    const stageRect = stage.getBoundingClientRect();
    const mediaRect = media.getBoundingClientRect();
    const previousRect = previous.getBoundingClientRect();
    const nextRect = next.getBoundingClientRect();
    const filmstripRect = filmstrip.getBoundingClientRect();

    return {
      dialogHeight: Math.round(dialogRect.height),
      dialogWidth: Math.round(dialogRect.width),
      filmstripHeight: Math.round(filmstripRect.height),
      filmstripTop: Math.round(filmstripRect.top),
      mediaHeight: Math.round(mediaRect.height),
      mediaLeft: Math.round(mediaRect.left),
      mediaRight: Math.round(mediaRect.right),
      mediaWidth: Math.round(mediaRect.width),
      nextLeft: Math.round(nextRect.left),
      nextRight: Math.round(nextRect.right),
      previousLeft: Math.round(previousRect.left),
      previousRightGap: Math.round(window.innerWidth - previousRect.right),
      stageBottom: Math.round(stageRect.bottom),
      stageHeight: Math.round(stageRect.height),
      stageTop: Math.round(stageRect.top),
      stageWidth: Math.round(stageRect.width),
      viewportHeight: window.innerHeight,
      viewportWidth: window.innerWidth,
    };
  });

  expect(fullscreenLayout.dialogWidth).toBeGreaterThanOrEqual(
    fullscreenLayout.viewportWidth - 2,
  );
  expect(fullscreenLayout.dialogHeight).toBeGreaterThanOrEqual(
    fullscreenLayout.viewportHeight - 2,
  );
  expect(fullscreenLayout.stageWidth).toBeGreaterThanOrEqual(
    Math.round(mainGalleryBox?.width ?? 1),
  );
  expect(fullscreenLayout.stageHeight).toBeGreaterThanOrEqual(
    Math.min(
      Math.round(mainGalleryBox?.height ?? 1),
      Math.round(fullscreenLayout.viewportHeight * 0.45),
    ),
  );
  expect(fullscreenLayout.mediaWidth).toBeLessThanOrEqual(
    fullscreenLayout.viewportWidth,
  );
  expect(fullscreenLayout.mediaHeight).toBeGreaterThanOrEqual(
    Math.round(fullscreenLayout.stageHeight * 0.5),
  );
  expect(fullscreenLayout.nextLeft).toBeGreaterThanOrEqual(0);
  expect(fullscreenLayout.previousRightGap).toBeGreaterThanOrEqual(0);
  expect(
    Math.abs(fullscreenLayout.mediaLeft - fullscreenLayout.nextRight),
  ).toBeLessThanOrEqual(96);
  expect(
    Math.abs(fullscreenLayout.previousLeft - fullscreenLayout.mediaRight),
  ).toBeLessThanOrEqual(96);
  expect(fullscreenLayout.filmstripTop).toBeGreaterThanOrEqual(
    fullscreenLayout.stageBottom - 2,
  );
  expect(fullscreenLayout.filmstripHeight).toBeGreaterThanOrEqual(56);

  const fullscreenThumbnails = page.getByTestId(
    "product-gallery-fullscreen-thumbnail",
  );
  const fullscreenStage = page.getByTestId("product-gallery-fullscreen-stage");
  const fullscreenStatus = page.getByTestId(
    "product-gallery-fullscreen-status",
  );
  await expect(fullscreenThumbnails.first()).toBeVisible();
  await fullscreenThumbnails.first().click();
  await expect(fullscreenStatus).toContainText(/1/);
  await expect(fullscreenStage).toHaveAttribute(
    "data-gallery-drag-mode",
    "swipe",
  );
  await expectViewerZoomToggleExpandsMedia(page);
  await expect(fullscreenStage).toHaveAttribute(
    "data-gallery-drag-mode",
    "swipe",
  );
  await expectGalleryStageFollowsDrag(page, "next");
  await expect(fullscreenStatus).toContainText(/2/);
  await expectGallerySwipeSettled(page);
  await dragGalleryStage(page, "previous");
  await expect(fullscreenStatus).toContainText(/1/);
  await expectGallerySwipeSettled(page);
  await page.keyboard.press("ArrowRight");
  await expect(fullscreenStatus).toContainText(/2/);
  await page.keyboard.press("Escape");
  await expect(
    page.getByTestId("product-gallery-fullscreen-dialog"),
  ).toBeHidden();
  await expect(fullscreenTrigger).toBeFocused();
}

async function dragGalleryStage(page: Page, direction: "next" | "previous") {
  const stage = page.getByTestId("product-gallery-fullscreen-stage");
  const box = await stage.boundingBox();

  if (!box) {
    throw new Error("Missing full-screen gallery stage box.");
  }

  const startX =
    direction === "next" ? box.x + box.width * 0.68 : box.x + box.width * 0.32;
  const endX =
    direction === "next" ? box.x + box.width * 0.32 : box.x + box.width * 0.68;
  const y = box.y + box.height * 0.52;

  await page.mouse.move(startX, y);
  await page.mouse.down();
  await page.mouse.move(endX, y, { steps: 8 });
  await page.mouse.up();
}

async function expectViewerZoomToggleExpandsMedia(page: Page) {
  const stage = page.getByTestId("product-gallery-fullscreen-stage");
  const zoomInButton = page.getByTestId(
    "product-gallery-fullscreen-zoom-toggle",
  );
  const zoomOutButton = page.getByTestId("product-gallery-fullscreen-zoom-out");
  const previousButton = page.getByTestId("product-gallery-previous");
  const nextButton = page.getByTestId("product-gallery-next");
  const beforeZoom = await getViewerZoomMetrics(page);

  await expect(previousButton).toBeVisible();
  await expect(nextButton).toBeVisible();
  await expect(zoomOutButton).toBeHidden();
  await zoomInButton.click();
  await expect(stage).toHaveAttribute("data-gallery-zoomed", "true");
  await expect(stage).toHaveAttribute("data-gallery-drag-mode", "pan");
  await expect(previousButton).toBeHidden();
  await expect(nextButton).toBeHidden();
  await expect(zoomOutButton).toBeVisible();
  await expect
    .poll(() => getViewerZoomMetrics(page))
    .toMatchObject({
      isZoomedShell: true,
      scale: 1.2,
    });

  const firstZoom = await getViewerZoomMetrics(page);
  expect(firstZoom.mediaWidth).toBeGreaterThan(beforeZoom.mediaWidth * 1.1);
  expect(firstZoom.surfaceWidth).toBeGreaterThan(firstZoom.mediaWidth);

  await zoomInButton.click();
  await expect
    .poll(() => getViewerZoomMetrics(page))
    .toMatchObject({
      isZoomedShell: true,
      scale: 1.45,
    });

  const secondZoom = await getViewerZoomMetrics(page);
  expect(secondZoom.surfaceWidth).toBeGreaterThan(firstZoom.surfaceWidth);

  await zoomOutButton.click();
  await expect
    .poll(() => getViewerZoomMetrics(page))
    .toMatchObject({
      isZoomedShell: true,
      scale: 1.2,
    });

  await zoomOutButton.click();
  await expect(stage).toHaveAttribute("data-gallery-zoomed", "false");
  await expect(stage).toHaveAttribute("data-gallery-drag-mode", "swipe");
  await expect(previousButton).toBeVisible();
  await expect(nextButton).toBeVisible();
  await expect(zoomOutButton).toBeHidden();
  await expect
    .poll(() => getViewerZoomMetrics(page))
    .toMatchObject({
      isZoomedShell: false,
      scale: 1,
    });
}

async function getViewerZoomMetrics(page: Page) {
  return page.evaluate(() => {
    const media = document.querySelector(
      '[data-testid="product-gallery-fullscreen-media"]',
    );
    const surface = document.querySelector(
      '[data-testid="product-gallery-fullscreen-zoom-surface"]',
    );

    if (!(media instanceof HTMLElement) || !(surface instanceof HTMLElement)) {
      throw new Error("Missing full-screen gallery zoom elements.");
    }

    const mediaBox = media.getBoundingClientRect();
    const surfaceBox = surface.getBoundingClientRect();

    return {
      isZoomedShell: media.classList.contains(
        "product-gallery-viewer-media-shell-zoomed",
      ),
      mediaWidth: Math.round(mediaBox.width),
      scale: Number.parseFloat(
        window
          .getComputedStyle(surface)
          .getPropertyValue("--viewer-zoom-scale"),
      ),
      surfaceWidth: Math.round(surfaceBox.width),
    };
  });
}

async function expectGalleryStageFollowsDrag(
  page: Page,
  direction: "next" | "previous",
) {
  const stage = page.getByTestId("product-gallery-fullscreen-stage");
  const track = page.getByTestId("product-gallery-fullscreen-swipe-track");
  const media = page.getByTestId("product-gallery-fullscreen-media").last();
  const box = await media.boundingBox();

  if (!box) {
    throw new Error("Missing full-screen gallery media box.");
  }

  const startX =
    direction === "next" ? box.x + box.width * 0.68 : box.x + box.width * 0.32;
  const followX = box.x + box.width * 0.5;
  const y = box.y + box.height * 0.52;

  await page.mouse.move(startX, y);
  await page.mouse.down();
  await page.mouse.move(followX, y, { steps: 4 });

  await expect(stage).toHaveAttribute("data-gallery-swipe-tracking", "true");

  const swipeOffset = await stage.evaluate((element) =>
    Number.parseFloat(element.getAttribute("data-gallery-swipe-offset") ?? "0"),
  );

  if (direction === "next") {
    expect(swipeOffset).toBeLessThan(-16);
  } else {
    expect(swipeOffset).toBeGreaterThan(16);
  }

  await expect
    .poll(() =>
      track.evaluate((element) => window.getComputedStyle(element).transform),
    )
    .not.toBe("none");

  const farX =
    direction === "next" ? box.x + box.width * 0.05 : box.x + box.width * 0.95;
  await page.mouse.move(farX, y, { steps: 4 });

  const farDrag = await stage.evaluate((element) => {
    const currentMedia = element.querySelector<HTMLElement>(
      "[data-gallery-viewer-current-media]",
    );
    return {
      mediaWidth: currentMedia?.getBoundingClientRect().width ?? 0,
      offset: Number.parseFloat(
        element.getAttribute("data-gallery-swipe-offset") ?? "0",
      ),
    };
  });

  expect(farDrag.mediaWidth).toBeGreaterThan(0);
  // Firefox clips synthetic pointer coordinates at the viewport edge, so a
  // full media-width drag is not reachable when the image fills the viewport.
  if (direction === "next") {
    expect(farDrag.offset).toBeLessThan(-farDrag.mediaWidth * 0.55);
  } else {
    expect(farDrag.offset).toBeGreaterThan(farDrag.mediaWidth * 0.55);
  }

  await installGallerySwipeResetProbe(page);
  await page.mouse.up();
  const resetSample = await waitForGallerySwipeResetSample(page);
  expect(Math.abs(resetSample.translateX)).toBeLessThanOrEqual(1);
  expect(resetSample.maxTransitionDurationMs).toBe(0);
}

type GallerySwipeResetSample = {
  maxTransitionDurationMs: number;
  translateX: number;
};

async function installGallerySwipeResetProbe(page: Page) {
  await page.evaluate(() => {
    const stage = document.querySelector(
      '[data-testid="product-gallery-fullscreen-stage"]',
    );
    const track = document.querySelector(
      '[data-testid="product-gallery-fullscreen-swipe-track"]',
    );

    if (!(stage instanceof HTMLElement) || !(track instanceof HTMLElement)) {
      throw new Error("Missing full-screen gallery swipe reset elements.");
    }

    const stateWindow = window as typeof window & {
      __gallerySwipeResetObserver?: MutationObserver;
      __gallerySwipeResetSamples?: GallerySwipeResetSample[];
    };
    const readDurationMs = (durationList: string) =>
      Math.max(
        ...durationList.split(",").map((duration) => {
          const trimmedDuration = duration.trim();
          const parsedDuration = Number.parseFloat(trimmedDuration);

          if (!Number.isFinite(parsedDuration)) return 0;

          return trimmedDuration.endsWith("ms")
            ? parsedDuration
            : parsedDuration * 1000;
        }),
      );
    const readTranslateX = (transform: string) => {
      if (transform === "none") return 0;

      return new DOMMatrixReadOnly(transform).m41;
    };

    stateWindow.__gallerySwipeResetObserver?.disconnect();
    stateWindow.__gallerySwipeResetSamples = [];
    stateWindow.__gallerySwipeResetObserver = new MutationObserver(() => {
      if (!stage.hasAttribute("data-gallery-swipe-resetting")) return;

      const styles = window.getComputedStyle(track);
      stateWindow.__gallerySwipeResetSamples?.push({
        maxTransitionDurationMs: readDurationMs(styles.transitionDuration),
        translateX: Math.round(readTranslateX(styles.transform)),
      });
    });
    stateWindow.__gallerySwipeResetObserver.observe(stage, {
      attributeFilter: ["data-gallery-swipe-resetting"],
      attributes: true,
    });
  });
}

async function waitForGallerySwipeResetSample(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(() => {
        const stateWindow = window as typeof window & {
          __gallerySwipeResetSamples?: GallerySwipeResetSample[];
        };

        return stateWindow.__gallerySwipeResetSamples?.length ?? 0;
      }),
    )
    .toBeGreaterThan(0);

  return page.evaluate(() => {
    const stateWindow = window as typeof window & {
      __gallerySwipeResetSamples?: GallerySwipeResetSample[];
    };
    const [sample] = stateWindow.__gallerySwipeResetSamples ?? [];

    if (!sample) {
      throw new Error("Missing full-screen gallery swipe reset sample.");
    }

    return sample;
  });
}

async function expectGallerySwipeSettled(page: Page) {
  const stage = page.getByTestId("product-gallery-fullscreen-stage");

  await expect
    .poll(() =>
      stage.evaluate((element) => ({
        offset: element.getAttribute("data-gallery-swipe-offset"),
        settling: element.getAttribute("data-gallery-swipe-settling"),
        tracking: element.getAttribute("data-gallery-swipe-tracking"),
        cssOffset: window
          .getComputedStyle(element)
          .getPropertyValue("--viewer-swipe-offset")
          .trim(),
      })),
    )
    .toEqual({
      cssOffset: "0px",
      offset: null,
      settling: null,
      tracking: null,
    });
}

async function waitForProductPurchasePanelClientReady(page: Page) {
  await expect(page.getByTestId("product-purchase-panel")).toHaveAttribute(
    "data-client-ready",
    "true",
  );
}

async function waitForPublicMotionReady(page: Page) {
  await expect(page.locator("html")).toHaveAttribute(
    "data-public-motion-ready",
    "true",
  );
}

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

async function expectNoCookieConsentBanner(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.querySelectorAll('[data-cookie-consent-banner="true"]')
            .length,
      ),
    )
    .toBe(0);
}

async function expectDomSelectorVisible(page: Page, selector: string) {
  await expect
    .poll(() => page.evaluate(isSelectorVisible, selector))
    .toBe(true);
}

async function expectDomSelectorCount(
  page: Page,
  selector: string,
  expectedCount: number,
) {
  await expect
    .poll(() =>
      page.evaluate(
        (selectorToCount) => document.querySelectorAll(selectorToCount).length,
        selector,
      ),
    )
    .toBe(expectedCount);
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

async function reloadCurrentPage(page: Page) {
  await page.goto(page.url(), {
    timeout: 15_000,
    waitUntil: "domcontentloaded",
  });
}

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

async function clickAddToCartAndExpectCheckoutLink(
  page: Page,
  addToCartButton: Locator,
) {
  const checkoutLink = page.getByTestId("product-cart-checkout-link");

  await addToCartButton.scrollIntoViewIfNeeded();
  await expect(addToCartButton).toBeVisible();
  await expect(addToCartButton).toBeEnabled();
  await addToCartButton.click();

  const appearedAfterFirstClick = await checkoutLink
    .waitFor({ state: "visible", timeout: 5_000 })
    .then(() => true)
    .catch(() => false);

  if (appearedAfterFirstClick) return;

  await addToCartButton.scrollIntoViewIfNeeded();
  await expect(addToCartButton).toBeVisible();
  await expect(addToCartButton).toBeEnabled();
  await addToCartButton.click({ force: true });
  await expect(checkoutLink).toBeVisible();
}

function isIdentityCssTransform(value: string) {
  if (value === "none") return true;

  const matrixMatch = /^matrix\(([^)]+)\)$/u.exec(value);
  if (matrixMatch) {
    const values = matrixMatch[1]!
      .split(",")
      .map((part) => Number.parseFloat(part.trim()));

    return (
      values.length === 6 &&
      Math.abs(values[0]! - 1) <= 0.0001 &&
      Math.abs(values[1]!) <= 0.0001 &&
      Math.abs(values[2]!) <= 0.0001 &&
      Math.abs(values[3]! - 1) <= 0.0001 &&
      Math.abs(values[4]!) <= 0.0001 &&
      Math.abs(values[5]!) <= 0.0001
    );
  }

  const matrix3dMatch = /^matrix3d\(([^)]+)\)$/u.exec(value);
  if (!matrix3dMatch) return false;

  const values = matrix3dMatch[1]!
    .split(",")
    .map((part) => Number.parseFloat(part.trim()));
  const identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

  return (
    values.length === identity.length &&
    values.every((part, index) => Math.abs(part - identity[index]!) <= 0.0001)
  );
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
  await expectDomSelectorCount(
    page,
    "[data-nextjs-dialog], [data-nextjs-dialog-overlay], [data-nextjs-error-overlay]",
    0,
  );
  expect(hydrationIssues).toEqual([]);
}
