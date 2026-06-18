import { existsSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import manifest from "./manifest";

describe("PWA manifest", () => {
  it("exposes installable RTL app metadata without invasive handlers", () => {
    const data = manifest();

    expect(data.id).toBe("/");
    expect(data.scope).toBe("/");
    expect(data.start_url).toContain("source=pwa");
    expect(data.lang).toBe("he");
    expect(data.dir).toBe("rtl");
    expect(data.display).toBe("standalone");
    expect(data.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ purpose: "maskable", sizes: "512x512" }),
      ]),
    );
    expect(data.shortcuts).toHaveLength(4);
    expect(data.shortcuts?.map((shortcut) => shortcut.url)).toEqual([
      "/search?source=pwa-shortcut",
      "/gifts?source=pwa-shortcut",
      "/size-guide?source=pwa-shortcut",
      "/service?source=pwa-shortcut",
    ]);
    expect(data.shortcuts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          description: "פתיחת רעיונות למתנה",
          url: "/gifts?source=pwa-shortcut",
        }),
        expect.objectContaining({
          url: "/size-guide?source=pwa-shortcut",
        }),
        expect.objectContaining({
          description: "שאלה לשירות",
          url: "/service?source=pwa-shortcut",
        }),
      ]),
    );
    expect(JSON.stringify(data.shortcuts)).not.toContain("לשירות לשירות");
    expect(JSON.stringify(data.shortcuts)).not.toContain("/checkout");
    expect(data).not.toHaveProperty("file_handlers");
    expect(data).not.toHaveProperty("protocol_handlers");
  });

  it("references install icons and screenshots that exist on disk", () => {
    const data = manifest();
    const icons = data.icons ?? [];
    const screenshots = data.screenshots ?? [];

    expect(icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          purpose: "any",
          sizes: "192x192",
          src: "/pwa/icons/icon-192.png",
        }),
        expect.objectContaining({
          purpose: "any",
          sizes: "512x512",
          src: "/pwa/icons/icon-512.png",
        }),
        expect.objectContaining({
          purpose: "maskable",
          sizes: "512x512",
          src: "/pwa/icons/maskable-512.png",
        }),
      ]),
    );
    expect(screenshots).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ form_factor: "narrow", sizes: "390x844" }),
        expect.objectContaining({ form_factor: "wide", sizes: "1440x900" }),
      ]),
    );

    for (const asset of [...icons, ...screenshots]) {
      expect(asset.src).toMatch(/^\/pwa\//);
      expect(existsSync(path.join(process.cwd(), "public", asset.src))).toBe(
        true,
      );
    }
  });
});
