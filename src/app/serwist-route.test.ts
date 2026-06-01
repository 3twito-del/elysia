import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("Serwist route", () => {
  it("loads the Next.js Serwist plugin only for production config", () => {
    const source = read("next.config.js");

    expect(source).toContain('process.env.NODE_ENV === "production"');
    expect(source).toContain('await import("@serwist/turbopack")');
    expect(source).not.toContain("import { withSerwist }");
  });

  it("does not duplicate automatically discovered public icon assets in the precache list", () => {
    const source = read("src/app/serwist/[path]/route.ts");

    expect(source).toContain("additionalPrecacheEntries");
    expect(source).toContain('url: "/offline"');
    expect(source).not.toContain("/pwa/icons/");
  });

  it("does not assume git stdout exists when resolving the runtime revision", () => {
    const source = read("src/app/serwist/[path]/route.ts");

    expect(source).toContain("stdout?.trim() || randomUUID()");
  });

  it("keeps the production service worker route static instead of forcing a runtime lambda", () => {
    const source = read("src/app/serwist/[path]/route.ts");

    expect(source).toContain("return createSerwistRoute({");
    expect(source).not.toContain("Vercel prebuilt packaging");
  });

  it("keeps Serwist out of development route compilation", () => {
    const source = read("src/app/serwist/[path]/route.ts");

    expect(source).toContain('process.env.NODE_ENV === "production"');
    expect(source).toContain('await import("@serwist/turbopack")');
    expect(source).toContain("createDevelopmentSerwistRoute");
    expect(source).toContain("new Response(null, { status: 404 })");
  });
});

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}
