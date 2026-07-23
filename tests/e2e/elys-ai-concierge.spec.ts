import { expect, test, type Page } from "@playwright/test";

const consentStorageKey = "elysia_cookie_consent";
const themeStorageKey = "elysia.theme-preference";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(
    ({ consentKey }) => {
      window.localStorage.setItem(
        consentKey,
        JSON.stringify({
          value: "essential",
          updatedAt: new Date().toISOString(),
        }),
      );
    },
    { consentKey: consentStorageKey },
  );
});

test("keeps the night-mode switch in the nav footer and persists it", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByTestId("mobile-nav-trigger").click();

  const sheet = page.getByTestId("mobile-nav-sheet");
  const switchControl = page.getByTestId("mobile-nav-theme-toggle");
  const footer = sheet.locator(".mobile-nav-theme-footer");
  const scrollRegion = sheet.locator(".mobile-nav-scroll-region");

  await expect(sheet).toBeVisible();
  await expect(switchControl).toHaveRole("switch");
  await expect(switchControl).toHaveAttribute("aria-checked", "false");
  await expect(footer).toBeVisible();

  await scrollRegion.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  await expect(footer).toBeVisible();

  const sheetBox = await sheet.boundingBox();
  const footerBox = await footer.boundingBox();
  expect(sheetBox).not.toBeNull();
  expect(footerBox).not.toBeNull();
  expect(
    Math.abs(
      (sheetBox?.y ?? 0) +
        (sheetBox?.height ?? 0) -
        ((footerBox?.y ?? 0) + (footerBox?.height ?? 0)),
    ),
  ).toBeLessThanOrEqual(2);

  await switchControl.focus();
  await page.keyboard.press("Space");
  await expect(switchControl).toHaveAttribute("aria-checked", "true");
  await expect
    .poll(() =>
      page.evaluate((key) => window.localStorage.getItem(key), themeStorageKey),
    )
    .toBe("dark");

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByTestId("mobile-nav-trigger").click();
  await expect(page.getByTestId("mobile-nav-theme-toggle")).toHaveAttribute(
    "aria-checked",
    "true",
  );

  await page.goto("/elys-ai", { waitUntil: "domcontentloaded" });
  await waitForConcierge(page);
  await expect(page.locator("html")).toHaveClass(/dark/u);
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByTestId("elys-ai-guide")).toBeVisible();
});

test("supports reduced motion and keyboard selection in the RTL guide", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/elys-ai", { waitUntil: "domcontentloaded" });
  await waitForConcierge(page);

  const ringChoice = page.getByRole("button", {
    name: "טבעות",
    exact: true,
  });
  await ringChoice.focus();
  await page.keyboard.press("Enter");
  await expect(ringChoice).toBeFocused();
  await expect(ringChoice).toHaveAttribute("aria-pressed", "true");
  const guideDirection = await page
    .getByTestId("elys-ai-guide")
    .evaluate((element) => getComputedStyle(element).direction);
  expect(guideDirection).toBe("rtl");

  await page.getByTestId("mobile-nav-trigger").click();
  const switchThumb = page
    .getByTestId("mobile-nav-theme-toggle")
    .locator('span[aria-hidden="true"] > span');
  const transitionDuration = await switchThumb.evaluate(
    (element) => getComputedStyle(element).transitionDuration,
  );
  expect(transitionDuration).toBe("0s");
});

test("keeps all jewelry choices in one continuous row", async ({ page }) => {
  await page.goto("/elys-ai", { waitUntil: "domcontentloaded" });
  await waitForConcierge(page);

  const choices = page.getByTestId("elys-ai-jewelry-options");
  await expect(choices).toBeVisible();
  await expect(choices.getByRole("button")).toHaveCount(6);

  const rowOffsets = await choices
    .getByRole("button")
    .evaluateAll((buttons) =>
      Array.from(
        new Set(buttons.map((button) => (button as HTMLElement).offsetTop)),
      ),
    );
  expect(rowOffsets).toHaveLength(1);
});

test("completes the guided concierge and sends an editable summary", async ({
  page,
}) => {
  await page.route("**/api/chat", async (route) => {
    await route.fulfill({
      body: JSON.stringify({ error: "test fallback" }),
      contentType: "application/json",
      status: 503,
    });
  });
  await page.goto("/elys-ai", { waitUntil: "domcontentloaded" });
  await waitForConcierge(page);

  await page.getByRole("button", { name: "טבעות", exact: true }).click();
  await page.getByRole("button", { name: "שרשראות", exact: true }).click();
  await page.getByRole("button", { name: "בני לי שילוב", exact: true }).click();
  await nextStep(page);

  await page.getByRole("button", { name: "אירוע מיוחד", exact: true }).click();
  await nextStep(page);
  await page.getByRole("button", { name: "עדין", exact: true }).click();
  await nextStep(page);
  await page.getByRole("button", { name: "עד 1,200 ₪", exact: true }).click();
  await nextStep(page);
  await page.getByRole("button", { name: "צריכה עזרה", exact: true }).click();
  await page.getByTestId("elys-ai-next-step").click();

  await expect(
    page.getByRole("heading", { name: "הבחירה שלך, לפני שמתחילות" }),
  ).toBeVisible();
  await expect(page.getByText("טבעות ושרשראות · שילוב")).toBeVisible();
  await page.getByTestId("elys-ai-submit-preferences").click();

  await expect(page.getByTestId("elys-ai-preference-strip")).toBeVisible();
  await expect(page.getByTestId("elys-ai-chat")).toBeVisible();
  await expect(page.getByTestId("ai-fallback-recovery-elys-ai")).toBeVisible();
  await expectNoHorizontalPageOverflow(page);

  await page
    .getByTestId("elys-ai-preference-strip")
    .getByRole("button", { name: "עריכה" })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "כמה פרטים, והבחירה נעשית מדויקת יותר",
    }),
  ).toBeVisible();
});

test("renders catalog recommendations in the keyboard-scrollable horizontal rail", async ({
  page,
}) => {
  await page.route("**/api/chat", async (route) => {
    await route.fulfill({
      body: createRecommendationStream(),
      headers: {
        "cache-control": "no-cache",
        "content-type": "text/event-stream",
        "x-vercel-ai-ui-message-stream": "v1",
      },
      status: 200,
    });
  });
  await page.goto("/elys-ai", { waitUntil: "domcontentloaded" });
  await waitForConcierge(page);
  await page.getByRole("button", { name: "שיחה חופשית" }).click();
  const chatInput = page.getByLabel("תיאור הבקשה ל־elys-ai");
  await chatInput.fill("הציגי לי בחירות");
  await chatInput.press("Enter");

  const rail = page.locator(
    '[role="region"][aria-label="בחירות שמתאימות לבקשה"][data-layout-equal-group="elys-ai-recommendations"]',
  );
  await expect(rail).toBeVisible();
  await rail.focus();
  await page.keyboard.press("ArrowLeft");
  await expect(rail).toBeFocused();
  await expectNoHorizontalPageOverflow(page);
});

test("can skip directly to a free conversation", async ({ page }) => {
  await page.goto("/elys-ai", { waitUntil: "domcontentloaded" });
  await waitForConcierge(page);
  await page.getByRole("button", { name: "שיחה חופשית" }).click();

  await expect(page.getByTestId("elys-ai-chat")).toBeVisible();
  await expect(page.getByTestId("elys-ai-preference-strip")).toContainText(
    "שיחה חופשית",
  );

  const chatInput = page.getByLabel("תיאור הבקשה ל־elys-ai");
  await chatInput.fill("הטקסט שלי נשמר");
  await page
    .getByTestId("elys-ai-preference-strip")
    .getByRole("button", { name: "עריכה" })
    .click();
  await page.getByRole("button", { name: "חזרה" }).click();
  await expect(chatInput).toHaveValue("הטקסט שלי נשמר");
});

async function nextStep(page: Page) {
  await page.getByTestId("elys-ai-next-step").click();
}

async function waitForConcierge(page: Page) {
  await expect(page.getByTestId("elys-ai-concierge")).toHaveAttribute(
    "data-hydrated",
    "true",
  );
}

async function expectNoHorizontalPageOverflow(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      ),
    )
    .toBeLessThanOrEqual(1);
}

function createRecommendationStream() {
  const products = ["טבעת", "עגילים", "שרשרת", "צמיד"].map((name, index) => ({
    availableOnline: true,
    category: name,
    description: "בחירה זמינה",
    formattedPrice: `${400 + index * 100} ₪`,
    image: "/brand/boutique/category-rings.avif",
    matchReason: "מתאים לבקשה",
    material: "כסף 925",
    name: `${name} Elysia`,
    price: 400 + index * 100,
    slug: `elys-ai-${index}`,
    url: `/product/elys-ai-${index}`,
  }));
  const chunks = [
    {
      type: "tool-input-available",
      toolCallId: "catalog-1",
      toolName: "searchCatalog",
      input: { query: "בחירות" },
    },
    {
      type: "tool-output-available",
      toolCallId: "catalog-1",
      output: products,
    },
  ];

  return `${chunks
    .map((chunk) => `data: ${JSON.stringify(chunk)}\n\n`)
    .join("")}data: [DONE]\n\n`;
}
