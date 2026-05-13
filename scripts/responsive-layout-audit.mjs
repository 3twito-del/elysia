import { chromium } from "@playwright/test";

const baseUrl =
  process.env.RESPONSIVE_BASE_URL ??
  process.env.SMOKE_BASE_URL ??
  "http://localhost:3000";

const consentStorageKey = "aphrodite_cookie_consent";
const accessibilityStorageKey = "aphrodite.accessibility-settings";

const viewports = [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "laptop", width: 1366, height: 768 },
  { name: "wide", width: 1920, height: 1080 },
];

const routes = [
  "/",
  "/search?q=venus",
  "/search?q=zzzz-no-match&maxPrice=1",
  "/category/earrings",
  "/product/venus-line-ring",
  "/checkout",
  "/account",
  "/gifts",
  "/branches",
  "/ai",
  "/stylist",
  "/about",
  "/faq",
  "/privacy",
  "/terms",
  "/accessibility",
  "/admin/login",
];

const browser = await chromium.launch();
const results = [];

try {
  for (const viewport of viewports) {
    const context = await browser.newContext({
      colorScheme: "light",
      locale: "he-IL",
      reducedMotion: "reduce",
      viewport: {
        width: viewport.width,
        height: viewport.height,
      },
    });

    await context.addInitScript(
      ({ accessibilityStorageKey, consentStorageKey }) => {
        window.localStorage.setItem(
          consentStorageKey,
          JSON.stringify({
            value: "essential",
            updatedAt: "2026-05-13T00:00:00.000Z",
          }),
        );
        window.localStorage.setItem(
          accessibilityStorageKey,
          JSON.stringify({
            highContrast: false,
            reduceMotion: true,
            textScale: "normal",
            underlineLinks: false,
          }),
        );
      },
      { accessibilityStorageKey, consentStorageKey },
    );

    const page = await context.newPage();
    page.setDefaultTimeout(20_000);

    for (const route of routes) {
      const url = new URL(route, baseUrl).href;
      await page.goto(url, { waitUntil: "domcontentloaded" });
      await page
        .waitForLoadState("networkidle", { timeout: 5_000 })
        .catch(() => {
          // Some client-side routes keep background requests open; layout can still be audited.
        });
      await page.waitForTimeout(250);
      await page.addStyleTag({
        content: `
          [aria-label="Open Next.js Dev Tools"],
          nextjs-portal {
            display: none !important;
          }
        `,
      });

      const audit = await page.evaluate(() => {
        const viewportWidth = document.documentElement.clientWidth;
        const allElements = Array.from(document.body.querySelectorAll("*"));
        const horizontalOverflow = Math.max(
          0,
          document.documentElement.scrollWidth - viewportWidth,
          document.body.scrollWidth - viewportWidth,
        );
        const overlayOpen = Boolean(
          document.querySelector(
            "[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay",
          ),
        );
        const hasContent = document.body.innerText.trim().length > 0;
        const escapedControls = [];
        const clippedControls = [];
        const clippedText = [];

        for (const element of allElements) {
          if (!(element instanceof HTMLElement)) continue;
          if (!isVisible(element)) continue;
          if (shouldSkipElement(element)) continue;

          const rect = element.getBoundingClientRect();
          if (rect.width < 2 || rect.height < 2) continue;

          const isInteractive = element.matches(
            'a[href], button, input, select, textarea, [role="button"], [role="link"], [role="tab"], [role="menuitem"]',
          );
          const styles = window.getComputedStyle(element);
          const clipsOverflow =
            clipsAxis(styles.overflowX) || clipsAxis(styles.overflowY);

          if (
            isInteractive &&
            (rect.left < -2 || rect.right > viewportWidth + 2)
          ) {
            escapedControls.push(describeElement(element, rect));
          }

          if (
            isInteractive &&
            clipsOverflow &&
            contentEscapesElement(element, rect)
          ) {
            clippedControls.push(describeElement(element, rect));
          }

          if (
            hasMeaningfulOwnText(element) &&
            clipsOverflow &&
            !isAllowedTextClamp(element) &&
            textEscapesElement(element, rect)
          ) {
            clippedText.push(describeElement(element, rect));
          }
        }

        return {
          clippedControls: clippedControls.slice(0, 10),
          clippedText: clippedText.slice(0, 10),
          escapedControls: escapedControls.slice(0, 10),
          hasContent,
          horizontalOverflow,
          overlayOpen,
        };

        function isVisible(element) {
          const styles = window.getComputedStyle(element);
          const rect = element.getBoundingClientRect();

          return (
            styles.display !== "none" &&
            styles.visibility !== "hidden" &&
            Number(styles.opacity) > 0.01 &&
            rect.width > 0 &&
            rect.height > 0
          );
        }

        function shouldSkipElement(element) {
          const tagName = element.tagName.toLowerCase();
          const slot = element.getAttribute("data-slot");
          const ariaLabel = element.getAttribute("aria-label") ?? "";

          return (
            tagName === "svg" ||
            tagName === "path" ||
            tagName === "script" ||
            tagName === "style" ||
            isScreenReaderOnly(element) ||
            element.closest("nextjs-portal") !== null ||
            ariaLabel === "Open Next.js Dev Tools" ||
            slot === "sheet-overlay" ||
            slot === "dialog-overlay" ||
            slot === "alert-dialog-overlay"
          );
        }

        function hasMeaningfulOwnText(element) {
          if (
            !element.matches("h1,h2,h3,h4,h5,h6,p,a,button,label,span,li,td,th")
          ) {
            return false;
          }

          return Array.from(element.childNodes).some(
            (node) =>
              node.nodeType === Node.TEXT_NODE &&
              (node.textContent ?? "").trim().length > 2,
          );
        }

        function isAllowedTextClamp(element) {
          const styles = window.getComputedStyle(element);

          return (
            styles.textOverflow === "ellipsis" ||
            styles.webkitLineClamp !== "none" ||
            element.className.toString().includes("truncate") ||
            element.className.toString().includes("line-clamp")
          );
        }

        function clipsAxis(value) {
          return value === "hidden" || value === "clip";
        }

        function contentEscapesElement(element, elementRect) {
          for (const descendant of element.querySelectorAll("*")) {
            if (!(descendant instanceof HTMLElement)) continue;
            if (shouldSkipElement(descendant) || !isVisible(descendant))
              continue;

            const rect = descendant.getBoundingClientRect();
            if (rectEscapes(elementRect, rect)) return true;
          }

          return textEscapesElement(element, elementRect);
        }

        function textEscapesElement(element, elementRect) {
          const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            {
              acceptNode(node) {
                if (
                  node.parentElement instanceof HTMLElement &&
                  isScreenReaderOnly(node.parentElement)
                ) {
                  return NodeFilter.FILTER_REJECT;
                }

                return (node.textContent ?? "").trim().length > 2
                  ? NodeFilter.FILTER_ACCEPT
                  : NodeFilter.FILTER_REJECT;
              },
            },
          );

          while (walker.nextNode()) {
            const range = document.createRange();
            range.selectNodeContents(walker.currentNode);

            for (const rect of range.getClientRects()) {
              if (
                rect.width > 1 &&
                rect.height > 1 &&
                rectEscapes(elementRect, rect)
              ) {
                range.detach();
                return true;
              }
            }

            range.detach();
          }

          return false;
        }

        function isScreenReaderOnly(element) {
          return element.closest(".sr-only") !== null;
        }

        function rectEscapes(containerRect, contentRect) {
          const tolerance = 3;

          return (
            contentRect.left < containerRect.left - tolerance ||
            contentRect.right > containerRect.right + tolerance ||
            contentRect.top < containerRect.top - tolerance ||
            contentRect.bottom > containerRect.bottom + tolerance
          );
        }

        function describeElement(element, rect, overflow = {}) {
          return {
            ariaLabel: element.getAttribute("aria-label"),
            className: trimText(element.className.toString(), 90),
            dataSlot: element.getAttribute("data-slot"),
            dataTestId: element.getAttribute("data-testid"),
            id: element.id || null,
            rect: {
              bottom: Math.round(rect.bottom),
              height: Math.round(rect.height),
              left: Math.round(rect.left),
              right: Math.round(rect.right),
              top: Math.round(rect.top),
              width: Math.round(rect.width),
            },
            tag: element.tagName.toLowerCase(),
            text: trimText(element.innerText ?? element.textContent ?? "", 80),
            ...overflow,
          };
        }

        function trimText(value, maxLength) {
          const normalized = value.replace(/\s+/g, " ").trim();

          return normalized.length > maxLength
            ? `${normalized.slice(0, maxLength - 1)}...`
            : normalized;
        }
      });

      results.push({ route, viewport, ...audit });
    }

    await page.close();
    await context.close();
  }
} finally {
  await browser.close();
}

const failures = results.filter(
  (result) =>
    !result.hasContent ||
    result.overlayOpen ||
    result.horizontalOverflow > 1 ||
    result.escapedControls.length > 0 ||
    result.clippedControls.length > 0 ||
    result.clippedText.length > 0,
);

for (const result of results) {
  console.log(
    `${result.viewport.name.padEnd(6)} ${result.route.padEnd(36)} ` +
      `overflow=${result.horizontalOverflow} ` +
      `escapedControls=${result.escapedControls.length} ` +
      `controls=${result.clippedControls.length} ` +
      `text=${result.clippedText.length}`,
  );
}

if (failures.length > 0) {
  console.error("\nResponsive layout audit failed:");
  console.error(JSON.stringify(failures, null, 2));
  process.exit(1);
}

console.log(
  `\nResponsive layout audit passed for ${routes.length} routes across ${viewports.length} viewports.`,
);
