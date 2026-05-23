import { expect, test, type Page } from "@playwright/test";

const cartProductSlug = "hera-bracelet";
const notificationPromptMarker = "__elysiaNotificationPromptRequested";
const pwaE2eOptInStorageKey = "elysia:pwa-e2e";
const savedSizeStorageKey = "elysia_saved_sizes_v1";

test.use({ serviceWorkers: "allow" });

test.describe("PWA runtime", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((storageKey) => {
      window.localStorage.setItem(storageKey, "1");
    }, pwaE2eOptInStorageKey);
  });

  test("exposes an installable manifest and registers the service worker quietly", async ({
    page,
  }) => {
    await markNotificationPermissionPrompts(page);
    await page.goto("/");

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

    await waitForPwaRegistration(page);
    await expectNotificationPromptRequested(page);
  });

  test("serves a previously viewed product page while offline", async ({
    context,
    page,
  }) => {
    await prepareControlledPwaPage(page, `/product/${cartProductSlug}`);
    await expect(page.getByTestId("product-gallery")).toBeVisible();

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
    context,
    page,
  }) => {
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
    context,
    page,
  }) => {
    await prepareControlledPwaPage(page, `/product/${cartProductSlug}`);
    await expect(page.locator(".product-primary-cta").first()).toBeVisible();

    await context.setOffline(true);

    try {
      await expect
        .poll(() => page.evaluate(() => navigator.onLine))
        .toBe(false);
      await page.locator(".product-primary-cta").first().focus();
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
      await Promise.allSettled([
        fetch("/admin", { cache: "no-store", redirect: "manual" }),
        fetch("/api/health", { cache: "no-store" }),
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

async function prepareControlledPwaPage(page: Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await waitForPwaRegistration(page);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForLoadState("load");
  await waitForPwaControl(page);
}

async function waitForPwaRegistration(page: Page) {
  await expect
    .poll(
      () =>
        page.evaluate(async () => {
          if (!("serviceWorker" in navigator)) return false;

          const ready = await Promise.race([
            navigator.serviceWorker.ready.then(() => true),
            new Promise<boolean>((resolve) => {
              window.setTimeout(() => resolve(false), 1_000);
            }),
          ]);

          if (!ready) return false;

          const registrations =
            await navigator.serviceWorker.getRegistrations();

          return registrations.some(
            (registration) => new URL(registration.scope).pathname === "/",
          );
        }),
      { timeout: 15_000 },
    )
    .toBe(true);
}

async function waitForPwaControl(page: Page) {
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          if (!("serviceWorker" in navigator)) return false;

          return Boolean(navigator.serviceWorker.controller);
        }),
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
