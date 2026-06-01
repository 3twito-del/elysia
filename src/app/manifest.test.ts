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
          description: "פתיחת מדריך מתנות",
          url: "/gifts?source=pwa-shortcut",
        }),
        expect.objectContaining({
          url: "/size-guide?source=pwa-shortcut",
        }),
        expect.objectContaining({
          description: "פנייה לשירות",
          url: "/service?source=pwa-shortcut",
        }),
      ]),
    );
    expect(JSON.stringify(data.shortcuts)).not.toContain("לשירות לשירות");
    expect(JSON.stringify(data.shortcuts)).not.toContain("/checkout");
    expect(data).not.toHaveProperty("file_handlers");
    expect(data).not.toHaveProperty("protocol_handlers");
  });
});
