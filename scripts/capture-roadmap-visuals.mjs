import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = path.join(root, "docs", "qa", "roadmap");
const baseUrl =
  process.env.ROADMAP_BASE_URL ??
  process.env.SMOKE_BASE_URL ??
  "http://localhost:3000";
const cookieConsentKey = "aphrodite_cookie_consent";
const accessibilityKey = "aphrodite.accessibility-settings";
const cookieConsent = JSON.stringify({
  value: "essential",
  updatedAt: "2026-05-13T00:00:00.000Z",
});
const accessibilitySettings = JSON.stringify({
  highContrast: false,
  reduceMotion: true,
  textScale: "normal",
  underlineLinks: false,
});
const hideDevChromeCss = `
  [aria-label="Open Next.js Dev Tools"],
  nextjs-portal {
    display: none !important;
  }
`;
const hideFloatingControlsCss = `
  .public-floating-trigger {
    display: none !important;
  }
`;

await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch();

try {
  await captureDesktopHomeHero(browser);
  await captureMobileNav(browser);
  await captureMobileCategorySheet(browser);
  await captureDesktopCategoryFilterPanel(browser);
  await captureAccessibilityPopup(browser);
} finally {
  await browser.close();
}

console.log(`Roadmap visual QA screenshots saved to ${outputDir}`);

async function captureDesktopHomeHero(browserInstance) {
  const page = await newPreparedPage(browserInstance, {
    hideFloatingControls: true,
    viewport: { width: 1440, height: 900 },
  });

  await goto(page, "/", { hideFloatingControls: true });
  await waitForImages(page);
  await page.screenshot(screenshotOptions("home-hero-roadmap.png"));
  await page.close();
}

async function captureMobileNav(browserInstance) {
  const page = await newPreparedPage(browserInstance, {
    hideFloatingControls: true,
    viewport: { width: 390, height: 844 },
  });

  await goto(page, "/", { hideFloatingControls: true });
  await page.getByTestId("mobile-nav-trigger").click();
  await page.getByTestId("mobile-nav-sheet").waitFor({ state: "visible" });
  await page.screenshot(screenshotOptions("mobile-nav-sheet-roadmap.png"));
  await page.close();
}

async function captureMobileCategorySheet(browserInstance) {
  const page = await newPreparedPage(browserInstance, {
    hideFloatingControls: true,
    viewport: { width: 390, height: 844 },
  });

  await goto(page, "/category/earrings", { hideFloatingControls: true });
  await page.getByTestId("category-filter-trigger").click();
  await page.getByTestId("category-filter-sheet").waitFor({ state: "visible" });
  await page.screenshot(screenshotOptions("category-filter-sheet-roadmap.png"));
  await page.close();
}

async function captureDesktopCategoryFilterPanel(browserInstance) {
  const page = await newPreparedPage(browserInstance, {
    hideFloatingControls: true,
    viewport: { width: 1440, height: 960 },
  });

  await goto(page, "/category/earrings", { hideFloatingControls: true });
  await page.getByTestId("category-filter-panel").scrollIntoViewIfNeeded();
  await page.getByTestId("category-results-grid").waitFor({ state: "visible" });
  await page.screenshot(screenshotOptions("category-filter-panel-roadmap.png"));
  await page.close();
}

async function captureAccessibilityPopup(browserInstance) {
  const page = await newPreparedPage(browserInstance, {
    hideFloatingControls: false,
    viewport: { width: 1024, height: 768 },
  });

  await goto(page, "/", { hideFloatingControls: false });
  await page.locator(".public-floating-trigger").waitFor({ state: "attached" });
  await page.evaluate(() =>
    document.querySelector(".public-floating-trigger")?.click(),
  );
  await page.getByRole("dialog").waitFor({ state: "visible" });
  await page.screenshot(screenshotOptions("accessibility-popup-roadmap.png"));
  await page.close();
}

async function newPreparedPage(
  browserInstance,
  { hideFloatingControls, viewport },
) {
  const context = await browserInstance.newContext({
    colorScheme: "light",
    locale: "he-IL",
    reducedMotion: "reduce",
    viewport,
  });

  await context.addInitScript(
    ({ accessibilityKey, accessibilitySettings, cookieConsent, cookieConsentKey }) => {
      window.localStorage.setItem(cookieConsentKey, cookieConsent);
      window.localStorage.setItem(accessibilityKey, accessibilitySettings);
    },
    {
      accessibilityKey,
      accessibilitySettings,
      cookieConsent,
      cookieConsentKey,
    },
  );

  const page = await context.newPage();
  page.setDefaultTimeout(15_000);
  await page.addStyleTag({
    content: hideFloatingControls
      ? `${hideDevChromeCss}\n${hideFloatingControlsCss}`
      : hideDevChromeCss,
  });

  return page;
}

async function goto(page, route, { hideFloatingControls }) {
  await page.goto(new URL(route, baseUrl).href, { waitUntil: "networkidle" });
  await page.addStyleTag({
    content: hideFloatingControls
      ? `${hideDevChromeCss}\n${hideFloatingControlsCss}`
      : hideDevChromeCss,
  });
}

async function waitForImages(page) {
  await page.evaluate(async () => {
    await Promise.all(
      Array.from(document.images, (image) => {
        if (image.complete) return Promise.resolve();

        return new Promise((resolve) => {
          image.addEventListener("load", resolve, { once: true });
          image.addEventListener("error", resolve, { once: true });
        });
      }),
    );
  });
}

function screenshotOptions(fileName) {
  return {
    animations: "disabled",
    caret: "hide",
    path: path.join(outputDir, fileName),
    scale: "css",
  };
}
