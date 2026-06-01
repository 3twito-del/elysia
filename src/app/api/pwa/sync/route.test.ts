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
      ok: true,
      results: [{ actionId: "offline_action_1", ok: true }],
      summary: { failed: 0, synced: 1, total: 1 },
    });
    expect(offlineSyncMocks.processOfflineJsonActions).toHaveBeenCalledTimes(1);
  });

  it("keeps partial failures in a stable retry envelope", async () => {
    offlineSyncMocks.processOfflineJsonActions.mockResolvedValueOnce([
      { actionId: "offline_action_1", ok: true },
      {
        actionId: "offline_action_2",
        error:
          "Some offline cart changes could not be synced. Review your cart, then retry when the connection is stable.",
        ok: false,
      },
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
            {
              actionId: "offline_action_2",
              createdAt: new Date().toISOString(),
              deviceId: "pwa_device_123456789",
              kind: "cart.updateItem",
              payload: { itemId: "item_1", quantity: 2 },
            },
          ],
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      results: [
        { actionId: "offline_action_1", ok: true },
        {
          actionId: "offline_action_2",
          error:
            "Some offline cart changes could not be synced. Review your cart, then retry when the connection is stable.",
          ok: false,
        },
      ],
      summary: { failed: 1, synced: 1, total: 2 },
    });
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
