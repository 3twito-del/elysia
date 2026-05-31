import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("offline sync response contract", () => {
  it("keeps sync routes behind a stable retry envelope", () => {
    const jsonRoute = read("src/app/api/pwa/sync/route.ts");
    const serviceRoute = read("src/app/api/pwa/sync/service-request/route.ts");

    expect(jsonRoute).toContain("createOfflineSyncResponse(results)");
    expect(serviceRoute).toContain("createOfflineSyncResponse([result])");
    expect(jsonRoute).not.toContain("okJson({ results");
    expect(serviceRoute).not.toContain("okJson({ results");
  });

  it("keeps queued action failures sanitized before they reach clients", () => {
    const offlineSync = read("src/server/services/offline-sync.ts");
    const offlineClient = read("src/lib/pwa-offline.ts");

    expect(offlineSync).toContain("getPublicOfflineSyncError(action.kind)");
    expect(offlineSync).toContain("Queued action could not be synced");
    expect(offlineSync).toContain("Queued service request could not be synced");
    expect(offlineSync).not.toContain("error.message");

    expect(offlineClient).toContain("readSyncResponse(response)");
    expect(offlineClient).toContain("Service request sync failed.");
    expect(offlineClient).toContain("result?.error");
  });
});

const root = process.cwd();

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}
