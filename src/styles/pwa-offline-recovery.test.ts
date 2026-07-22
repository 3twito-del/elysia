import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("PWA offline recovery", () => {
  it("keeps the offline page from becoming a dead end", () => {
    const offlinePage = read("src/app/offline/page.tsx");

    expect(offlinePage).toContain("offlineRecoveryNotes");
    expect(offlinePage).toContain('data-testid="offline-retry-guidance"');
    expect(offlinePage).toContain('data-testid="offline-recovery-actions"');
    expect(offlinePage).toContain('href="/"');
    expect(offlinePage).toContain('href="/search"');
    expect(offlinePage).not.toContain('href="/gifts"');
    expect(offlinePage).toContain('href="/service"');
    expect(offlinePage).toContain('href="/size-guide"');
  });

  it("keeps offline recovery routes inside the public page cache allowlist", () => {
    const manifest = read("src/app/manifest.ts");
    const serviceWorker = read("src/app/sw.ts");

    expect(manifest).toContain('url: "/search?source=pwa-shortcut"');
    expect(manifest).not.toContain('url: "/gifts?source=pwa-shortcut"');
    expect(manifest).toContain('url: "/service?source=pwa-shortcut"');
    expect(manifest).toContain('url: "/size-guide?source=pwa-shortcut"');
    expect(manifest).not.toContain('url: "/checkout?source=pwa-shortcut"');

    expect(serviceWorker).toContain("search|branches");
    expect(serviceWorker).toContain("service|elys-ai");
    expect(serviceWorker).toContain("size-guide|offline");
    expect(serviceWorker).toContain("checkout(?:\\/|$)");
  });

  it("keeps offline sync events available for queued service requests", () => {
    const offlineSync = read("src/lib/pwa-offline.ts");
    const serviceRoute = read("src/app/api/pwa/sync/service-request/route.ts");

    expect(offlineSync).toContain("installPwaOfflineSync");
    expect(offlineSync).toContain("syncEventName");
    expect(offlineSync).toContain("syncErrorEventName");
    expect(offlineSync).toContain("service.request");
    expect(offlineSync).toContain("queueOfflineServiceRequest");
    expect(offlineSync).toContain("readSyncResponse(response)");

    expect(serviceRoute).toContain("processOfflineServiceRequest");
    expect(serviceRoute).toContain("createOfflineSyncResponse([result])");
    expect(serviceRoute).toContain("metadataJson");
    expect(serviceRoute).toContain("files");
  });
});

const root = process.cwd();

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}
