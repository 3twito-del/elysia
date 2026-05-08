import { describe, expect, it } from "vitest";

import { brandMedia } from "~/lib/brand-media";

const nonJewelryImageIds = ["photo-1523293182086-7651a899d37f"];

function collectUrls(value: unknown): string[] {
  if (!value) return [];

  if (typeof value === "string") {
    return value.startsWith("https://") ? [value] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap(collectUrls);
  }

  if (typeof value === "object") {
    return Object.values(value).flatMap(collectUrls);
  }

  return [];
}

describe("brand media", () => {
  it("keeps curated media scoped to jewelry imagery", () => {
    const urls = collectUrls(brandMedia);

    expect(urls.length).toBeGreaterThan(0);

    for (const imageId of nonJewelryImageIds) {
      expect(urls.some((url) => url.includes(imageId))).toBe(false);
    }
  });
});
