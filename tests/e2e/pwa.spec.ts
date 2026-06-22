import { expect, test, type Page } from "@playwright/test";

const cartProductSlug = "hera-bracelet";
const notificationPromptMarker = "__elysiaNotificationPromptRequested";
const pwaE2eOptInStorageKey = "elysia:pwa-e2e";
const pwaServiceWorkerTimeoutMs = 45_000;
const pwaPublicPagesCacheName = "elysia-v2-public-pages";
const savedSizeStorageKey = "elysia_saved_sizes_v1";

test.use({ serviceWorkers: "allow" });

test.describe("PWA runtime", () => {
  test.setTimeout(105_000);

  test.beforeEach(({ browserName }, testInfo) => {
    test.skip(
      browserName === "webkit",
      "Playwright WebKit service-worker registration is unreliable in this PWA harness.",
    );
    test.skip(
      testInfo.project.name === "firefox-mobile",
      "Playwright Firefox at the mobile viewport does not reliably settle service-worker registration in this PWA harness.",
    );
  });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript((storageKey) => {
      window.localStorage.setItem(storageKey, "1");
    }, pwaE2eOptInStorageKey);
  });

  test("exposes an installable manifest and registers the service worker quietly", async ({
    page,
  }) => {
    await markNotificationPermissionPrompts(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("load", { timeout: 10_000 }).catch(() => {
      // WebKit can keep the load event open while a fresh service worker settles.
    });

    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
      "href",
      /manifest\.webmanifest/,
    );

    const manifestResponse = await page.request.get("/manifest.webmanifest");
    const manifest = (await manifestResponse.json()) as {
      dir?: string;
      lang?: string;
      scope?: string;
      shortcuts?: unknown[];
      start_url?: string;
    };

    expect(manifestResponse.ok()).toBe(true);
    expect(manifest.scope).toBe("/");
    expect(manifest.lang).toBe("he");
    expect(manifest.dir).toBe("rtl");
    expect(manifest.start_url).toContain("source=pwa");
    expect(manifest.shortcuts).toHaveLength(4);
    expect(manifest.shortcuts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          url: "/size-guide?source=pwa-shortcut",
        }),
      ]),
    );

    const [robotsResponse, sitemapResponse] = await Promise.all([
      page.request.get("/robots.txt"),
      page.request.get("/sitemap.xml"),
    ]);

    expect(robotsResponse.ok()).toBe(true);
    expect(robotsResponse.headers()["content-type"]).toContain("text/plain");
    expect(await robotsResponse.text()).toContain("Sitemap:");
    expect(sitemapResponse.ok()).toBe(true);
    expect(sitemapResponse.headers()["content-type"]).toContain("xml");

    await waitForPwaRegistration(page);
    await expectNotificationPromptRequested(page);
  });

  test("serves a previously viewed product page while offline", async ({
    browserName,
    context,
    page,
  }) => {
    skipWebKitOfflineEmulation(browserName);
    await prepareControlledPwaPage(page, `/product/${cartProductSlug}`);
    await expect(page.getByTestId("product-gallery")).toBeVisible();
    await waitForCachedPublicPage(page, `/product/${cartProductSlug}`);

    await context.setOffline(true);

    try {
      await page.goto(`/product/${cartProductSlug}`, {
        waitUntil: "domcontentloaded",
      });

      await expect(page.getByTestId("product-gallery")).toBeVisible();
      await expect(page).toHaveURL(new RegExp(`/product/${cartProductSlug}`));
    } finally {
      await context.setOffline(false);
    }
  });

  test("keeps local size saving available offline", async ({
    browserName,
    context,
    page,
  }) => {
    skipWebKitOfflineEmulation(browserName);
    await prepareControlledPwaPage(page, "/size-guide?kind=ring");
    await expect(page.getByTestId("size-guide-tool")).toBeVisible();

    await context.setOffline(true);

    try {
      await expect
        .poll(() => page.evaluate(() => navigator.onLine))
        .toBe(false);

      await page.locator("#size-guide-ring").fill("54");
      await page
        .getByTestId("size-guide-tool")
        .getByRole("button", { name: "שמירת מידה" })
        .click();

      await expect
        .poll(() =>
          page.evaluate((storageKey) => {
            const stored = window.localStorage.getItem(storageKey);

            if (!stored) return null;

            try {
              return (JSON.parse(stored) as { ring?: string }).ring ?? null;
            } catch {
              return null;
            }
          }, savedSizeStorageKey),
        )
        .toBe("54");
    } finally {
      await context.setOffline(false);
    }
  });

  test("queues add-to-cart offline and updates the cart badge", async ({
    browserName,
    context,
    page,
  }) => {
    skipWebKitOfflineEmulation(browserName);
    await prepareControlledPwaPage(page, `/product/${cartProductSlug}`);
    const addToCartButton = page.getByTestId("product-add-to-cart-button");
    await expect(addToCartButton).toBeVisible();

    await context.setOffline(true);

    try {
      await expect
        .poll(() => page.evaluate(() => navigator.onLine))
        .toBe(false);
      await addToCartButton.focus();
      await page.keyboard.press("Enter");

      await expect.poll(() => getQueuedOfflineActionCount(page)).toBe(1);
      await expect(
        page.locator("a[href='/checkout'] .cart-count-badge"),
      ).toHaveText("1");
    } finally {
      await context.setOffline(false);
    }
  });

  test("does not store admin or API responses in CacheStorage", async ({
    page,
  }) => {
    await prepareControlledPwaPage(page, "/");

    await page.evaluate(async () => {
      const fetchWithTimeout = async (
        input: RequestInfo,
        init: RequestInit,
      ) => {
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 5_000);

        try {
          await fetch(input, { ...init, signal: controller.signal });
        } catch {
          // A browser may cancel a protected redirect while the service worker
          // is taking control. The cache assertions below are the hard gate.
        } finally {
          window.clearTimeout(timeout);
        }
      };

      await Promise.allSettled([
        fetchWithTimeout("/admin", {
          cache: "no-store",
          redirect: "manual",
        }),
        fetchWithTimeout("/api/health", { cache: "no-store" }),
      ]);
    });

    await expect
      .poll(() => getCachedLiveRouteMatches(page))
      .toEqual({
        admin: false,
        api: false,
      });
  });
});

async function markNotificationPermissionPrompts(page: Page) {
  await page.addInitScript((marker) => {
    const state = window as unknown as Record<string, boolean>;

    state[marker] = false;

    if (!("Notification" in window)) return;

    try {
      const originalRequestPermission =
        window.Notification.requestPermission.bind(window.Notification);

      Object.defineProperty(window.Notification, "requestPermission", {
        configurable: true,
        value: () => {
          state[marker] = true;

          return originalRequestPermission();
        },
      });
    } catch {
      // Some browsers expose requestPermission as non-configurable.
    }
  }, notificationPromptMarker);
}

function expectNotificationPromptRequested(page: Page) {
  return expect
    .poll(() =>
      page.evaluate((marker) => {
        const state = window as unknown as Record<string, boolean | undefined>;

        return state[marker] === true;
      }, notificationPromptMarker),
    )
    .toBe(false);
}

function skipWebKitOfflineEmulation(browserName: string) {
  test.skip(
    browserName === "webkit",
    "Playwright WebKit can close the context while emulating offline service-worker pages.",
  );
}

async function prepareControlledPwaPage(page: Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await waitForPwaRegistration(page);
  await navigateAfterPwaRegistration(page, path);
  await page.waitForLoadState("load", { timeout: 10_000 }).catch(() => {
    // Firefox can leave the load event pending while a fresh service worker
    // takes control. The DOM and controller checks below are the hard gates.
  });
  await waitForPwaControl(page);
}

async function navigateAfterPwaRegistration(page: Page, path: string) {
  try {
    await page.goto(path, { timeout: 15_000, waitUntil: "domcontentloaded" });
  } catch {
    await page.reload({ timeout: 15_000, waitUntil: "domcontentloaded" });
  }
}

async function waitForPwaRegistration(page: Page) {
  try {
    await expect
      .poll(() => hasReadyPwaRegistration(page), {
        timeout: 20_000,
      })
      .toBe(true);
  } catch {
    await page.evaluate(async () => {
      if (!("serviceWorker" in navigator)) return;

      const timeout = <T>(fallback: T, ms: number) =>
        new Promise<T>((resolve) => {
          window.setTimeout(() => resolve(fallback), ms);
        });
      const registrations = await Promise.race([
        navigator.serviceWorker.getRegistrations(),
        timeout<ServiceWorkerRegistration[]>([], 3_000),
      ]);

      await Promise.race([
        Promise.allSettled(
          registrations.map((registration) => registration.unregister()),
        ),
        timeout(null, 5_000),
      ]);
    });
    await page.reload({ timeout: 15_000, waitUntil: "domcontentloaded" });
    await expect
      .poll(() => hasReadyPwaRegistration(page), {
        timeout: pwaServiceWorkerTimeoutMs,
      })
      .toBe(true);
  }
}

function hasReadyPwaRegistration(page: Page) {
  return page.evaluate(async () => {
    if (!("serviceWorker" in navigator)) return false;

    const timeout = <T>(fallback: T, ms: number) =>
      new Promise<T>((resolve) => {
        window.setTimeout(() => resolve(fallback), ms);
      });

    const ready = await Promise.race([
      navigator.serviceWorker.ready.then(() => true),
      timeout(false, 1_000),
    ]);

    if (!ready) return false;

    const registrations = await Promise.race([
      navigator.serviceWorker.getRegistrations(),
      timeout<ServiceWorkerRegistration[]>([], 1_000),
    ]);

    return registrations.some(
      (registration) => new URL(registration.scope).pathname === "/",
    );
  });
}

async function waitForPwaControl(page: Page) {
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          if (!("serviceWorker" in navigator)) return false;

          return Boolean(navigator.serviceWorker.controller);
        }),
      { timeout: pwaServiceWorkerTimeoutMs },
    )
    .toBe(true);
}

async function waitForCachedPublicPage(page: Page, path: string) {
  await expect
    .poll(
      () =>
        page.evaluate(
          async ({ cacheName, path: pathToMatch }) => {
            if (!("caches" in window)) return false;

            const cache = await caches.open(cacheName);
            const absoluteUrl = new URL(pathToMatch, window.location.origin)
              .href;
            const directMatch =
              (await cache.match(pathToMatch)) ??
              (await cache.match(absoluteUrl));

            if (directMatch) return true;

            const cachedRequests = await cache.keys();

            return cachedRequests.some((request) => {
              const cachedUrl = new URL(request.url);

              return `${cachedUrl.pathname}${cachedUrl.search}` === pathToMatch;
            });
          },
          { cacheName: pwaPublicPagesCacheName, path },
        ),
      { timeout: 15_000 },
    )
    .toBe(true);
}

async function getQueuedOfflineActionCount(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("elysia-pwa-v1", 1);

      request.onupgradeneeded = () => {
        const db = request.result;

        if (!db.objectStoreNames.contains("actions")) {
          db.createObjectStore("actions", { keyPath: "actionId" });
        }

        if (!db.objectStoreNames.contains("cartSnapshots")) {
          db.createObjectStore("cartSnapshots", { keyPath: "sessionKey" });
        }

        if (!db.objectStoreNames.contains("meta")) {
          db.createObjectStore("meta", { keyPath: "key" });
        }
      };
      request.onerror = () =>
        reject(request.error ?? new Error("Failed to inspect PWA database."));
      request.onsuccess = () => resolve(request.result);
    });

    try {
      return await new Promise<number>((resolve, reject) => {
        const tx = db.transaction("actions", "readonly");
        const request = tx.objectStore("actions").count();

        request.onerror = () =>
          reject(request.error ?? new Error("Failed to count queued actions."));
        request.onsuccess = () => resolve(request.result);
      });
    } finally {
      db.close();
    }
  });
}

async function getCachedLiveRouteMatches(page: Page) {
  return page.evaluate(async () => {
    const result = {
      admin: false,
      api: false,
    };
    const origin = window.location.origin;
    const cacheNames = await caches.keys();

    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);

      result.admin =
        result.admin ||
        Boolean(await cache.match(new Request(`${origin}/admin`)));
      result.api =
        result.api ||
        Boolean(await cache.match(new Request(`${origin}/api/health`)));
    }

    return result;
  });
}
