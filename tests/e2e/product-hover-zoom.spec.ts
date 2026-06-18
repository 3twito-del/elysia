import { expect, test, type Locator } from "@playwright/test";

const consentStorageKey = "elysia_cookie_consent";
const productSlug = "hera-bracelet";

test.describe("product hover zoom", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((storageKey) => {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({
          value: "essential",
          updatedAt: "2026-01-01T00:00:00.000Z",
        }),
      );
    }, consentStorageKey);
  });

  test("zooms the PDP gallery around the pointer on desktop hover", async ({
    page,
  }) => {
    test.skip((page.viewportSize()?.width ?? 0) < 1024, "desktop hover-only");

    await page.goto(`/product/${productSlug}`, {
      waitUntil: "domcontentloaded",
    });

    const gallery = page.getByTestId("product-gallery");
    await expect(gallery).toBeVisible();
    await expect(gallery).toHaveAttribute("data-gallery-hover-zoom", "false");

    const galleryBox = await gallery.boundingBox();
    expect(galleryBox).not.toBeNull();

    await page.mouse.move(
      galleryBox!.x + galleryBox!.width * 0.72,
      galleryBox!.y + galleryBox!.height * 0.31,
    );

    await expect(gallery).toHaveAttribute("data-gallery-hover-zoom", "true");
    await expect
      .poll(() => getGalleryHoverZoomMetrics(gallery))
      .toMatchObject({
        active: true,
      });
    await expect
      .poll(async () => (await getGalleryHoverZoomMetrics(gallery)).scale)
      .toBeGreaterThan(1.25);

    const metrics = await getGalleryHoverZoomMetrics(gallery);
    expect(metrics.scale).toBeGreaterThan(1.25);
    expect(metrics.originX).toBeGreaterThan(65);
    expect(metrics.originY).toBeLessThan(40);

    await page.mouse.move(2, 2);
    await expect(gallery).toHaveAttribute("data-gallery-hover-zoom", "false");
  });

  test("enlarges product-card media on hover without resizing the card", async ({
    page,
  }) => {
    test.skip((page.viewportSize()?.width ?? 0) < 1024, "desktop hover-only");

    await page.goto("/category/rings", { waitUntil: "domcontentloaded" });

    const card = page.getByTestId("product-card").first();
    const media = card.locator(".product-card-media");
    await expect(card).toBeVisible();
    await expect(media).toBeVisible();
    await media.scrollIntoViewIfNeeded();
    await page.mouse.move(4, 4);
    await page.waitForTimeout(80);

    const mediaBoxBefore = await media.boundingBox();
    expect(mediaBoxBefore).not.toBeNull();

    await media.hover();
    await page.waitForTimeout(120);

    await expect
      .poll(() => getProductCardHoverMetrics(card))
      .toMatchObject({
        hasHoverImage: true,
      });
    await expect
      .poll(async () => (await getProductCardHoverMetrics(card)).primaryScale)
      .toBeGreaterThan(1.03);
    await expect
      .poll(
        async () => (await getProductCardHoverMetrics(card)).hoverImageOpacity,
      )
      .toBeGreaterThan(0.9);
    const metrics = await getProductCardHoverMetrics(card);
    const mediaBoxAfter = await media.boundingBox();

    expect(metrics.primaryScale).toBeGreaterThan(1.03);
    expect(metrics.hoverImageOpacity).toBeGreaterThan(0.9);
    expect(metrics.hoverImageScale).toBeGreaterThan(1.04);
    expect(Math.round(mediaBoxAfter!.width)).toBe(
      Math.round(mediaBoxBefore!.width),
    );
    expect(Math.round(mediaBoxAfter!.height)).toBe(
      Math.round(mediaBoxBefore!.height),
    );
  });
});

async function getGalleryHoverZoomMetrics(gallery: Locator) {
  return gallery.evaluate((element) => {
    const layer = element.querySelector<HTMLElement>(
      '[data-testid="product-gallery-hover-zoom-layer"]',
    );

    if (!layer || !(element instanceof HTMLElement)) {
      throw new Error("Missing gallery hover zoom layer.");
    }

    const styles = window.getComputedStyle(layer);
    const readScale = (targetStyles: CSSStyleDeclaration) => {
      if (targetStyles.transform.startsWith("matrix(")) {
        const [scaleX] = targetStyles.transform
          .slice("matrix(".length, -1)
          .split(",")
          .map((value) => Number.parseFloat(value.trim()));

        return Number.isFinite(scaleX) ? scaleX! : 1;
      }

      const individualScale = Number.parseFloat(targetStyles.scale);

      if (Number.isFinite(individualScale) && individualScale > 0) {
        return individualScale;
      }

      return 1;
    };

    return {
      active: element.getAttribute("data-gallery-hover-zoom") === "true",
      originX: Number.parseFloat(
        element.style.getPropertyValue("--gallery-hover-origin-x"),
      ),
      originY: Number.parseFloat(
        element.style.getPropertyValue("--gallery-hover-origin-y"),
      ),
      scale: readScale(styles),
    };
  });
}

async function getProductCardHoverMetrics(card: Locator) {
  return card.evaluate((element) => {
    const primaryImage = element.querySelector<HTMLElement>(
      ".product-card-image",
    );
    const hoverImage = element.querySelector<HTMLElement>(
      ".product-card-hover-image",
    );

    if (!primaryImage) {
      throw new Error("Missing product-card primary image.");
    }

    const primaryStyles = window.getComputedStyle(primaryImage);
    const hoverStyles = hoverImage ? window.getComputedStyle(hoverImage) : null;
    const readScale = (targetStyles: CSSStyleDeclaration) => {
      if (targetStyles.transform.startsWith("matrix(")) {
        const [scaleX] = targetStyles.transform
          .slice("matrix(".length, -1)
          .split(",")
          .map((value) => Number.parseFloat(value.trim()));

        return Number.isFinite(scaleX) ? scaleX! : 1;
      }

      const individualScale = Number.parseFloat(targetStyles.scale);

      if (Number.isFinite(individualScale) && individualScale > 0) {
        return individualScale;
      }

      return 1;
    };

    return {
      hasHoverImage: Boolean(hoverImage),
      hoverImageOpacity: hoverStyles ? Number(hoverStyles.opacity) : 0,
      hoverImageScale: hoverStyles ? readScale(hoverStyles) : 1,
      primaryScale: readScale(primaryStyles),
    };
  });
}
