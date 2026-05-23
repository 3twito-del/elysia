import { beforeEach, describe, expect, it, vi } from "vitest";
import type * as OfflineSyncModule from "~/server/services/offline-sync";

import { resetRateLimitStateForTests } from "~/server/services/rate-limit";

const offlineSyncMocks = vi.hoisted(() => ({
  processOfflineJsonActions:
    vi.fn<typeof OfflineSyncModule.processOfflineJsonActions>(),
}));

vi.mock("~/server/services/offline-sync", async (importOriginal) => {
  const actual = await importOriginal<typeof OfflineSyncModule>();

  return {
    ...actual,
    processOfflineJsonActions: offlineSyncMocks.processOfflineJsonActions,
  };
});

import { POST } from "./route";

describe("PWA JSON sync route", () => {
  beforeEach(() => {
    resetRateLimitStateForTests();
    vi.clearAllMocks();
  });

  it("processes valid queued JSON actions", async () => {
    offlineSyncMocks.processOfflineJsonActions.mockResolvedValueOnce([
      { actionId: "offline_action_1", ok: true },
    ]);

    const response = await POST(
      new Request("http://localhost/api/pwa/sync", {
        body: JSON.stringify({
          actions: [
            {
              actionId: "offline_action_1",
              createdAt: new Date().toISOString(),
              deviceId: "pwa_device_123456789",
              kind: "newsletter.join",
              payload: { email: "dana@example.com" },
            },
          ],
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      results: [{ actionId: "offline_action_1", ok: true }],
    });
    expect(offlineSyncMocks.processOfflineJsonActions).toHaveBeenCalledTimes(1);
  });

  it("rejects malformed sync payloads before processing", async () => {
    const response = await POST(
      new Request("http://localhost/api/pwa/sync", {
        body: JSON.stringify({ actions: [] }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(400);
    expect(offlineSyncMocks.processOfflineJsonActions).not.toHaveBeenCalled();
  });
});
