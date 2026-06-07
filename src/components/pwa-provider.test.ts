import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("PwaProvider", () => {
  it("keeps normal development sessions from using stale service worker HTML", () => {
    const source = read("src/components/pwa-provider.tsx");

    expect(source).toContain('process.env.NODE_ENV !== "production"');
    expect(source).toContain("!nav.webdriver");
    expect(source).toContain("unregisterDevelopmentServiceWorkers");
    expect(source).toContain("retiredPwaCachePrefixes");
    expect(source).toContain("normalizedCacheName.startsWith(prefix)");
    expect(source).toContain("caches.delete");
    expect(source).toContain("runtime.location?.reload()");
  });

  it("keeps the explicit e2e PWA opt-in available", () => {
    const source = read("src/components/pwa-provider.tsx");

    expect(source).toContain("elysia:pwa-e2e");
    expect(source).toContain("runtime.localStorage?.getItem");
  });

  it("keeps Serwist out of the initial provider bundle", () => {
    const providerSource = read("src/components/pwa-provider.tsx");
    const runtimeSource = read("src/components/pwa-runtime.tsx");

    expect(providerSource).not.toContain("@serwist/turbopack/react");
    expect(providerSource).not.toContain("registerServiceWorker");
    expect(providerSource).toContain("dynamic(");
    expect(runtimeSource).toContain("@serwist/turbopack/react");
    expect(runtimeSource).toContain("register");
  });
});

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}
