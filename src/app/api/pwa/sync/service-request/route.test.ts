import { beforeEach, describe, expect, it, vi } from "vitest";
import type * as OfflineSyncModule from "~/server/services/offline-sync";

import { resetRateLimitStateForTests } from "~/server/services/rate-limit";

const offlineSyncMocks = vi.hoisted(() => ({
  processOfflineServiceRequest:
    vi.fn<typeof OfflineSyncModule.processOfflineServiceRequest>(),
}));

vi.mock("~/server/services/offline-sync", async (importOriginal) => {
  const actual = await importOriginal<typeof OfflineSyncModule>();

  return {
    ...actual,
    processOfflineServiceRequest: offlineSyncMocks.processOfflineServiceRequest,
  };
});

import { POST } from "./route";

describe("PWA service request sync route", () => {
  beforeEach(() => {
    resetRateLimitStateForTests();
    vi.clearAllMocks();
  });

  it("accepts queued multipart service requests with attachments", async () => {
    offlineSyncMocks.processOfflineServiceRequest.mockResolvedValueOnce({
      actionId: "offline_service_1",
      ok: true,
    });
    const formData = new FormData();

    formData.set(
      "metadata",
      JSON.stringify({
        actionId: "offline_service_1",
        deviceId: "pwa_device_123456789",
        kind: "service.request",
        payload: {
          email: "dana@example.com",
          message: "Need sizing help",
          name: "Dana",
          phone: "0547277455",
          preferredContact: "ANY",
          topicSlug: "general",
        },
      }),
    );
    formData.append(
      "attachments",
      new File(["hello"], "note.txt", { type: "text/plain" }),
    );

    const response = await POST(
      new Request("http://localhost/api/pwa/sync/service-request", {
        body: formData,
        method: "POST",
      }),
    );

    expect(response.status).toBe(200);
    expect(offlineSyncMocks.processOfflineServiceRequest).toHaveBeenCalledTimes(
      1,
    );
    const [input] =
      offlineSyncMocks.processOfflineServiceRequest.mock.calls[0]!;

    expect(input.files[0]).toBeInstanceOf(File);
    expect(input.metadata.actionId).toBe("offline_service_1");
  });

  it("rejects missing metadata", async () => {
    const response = await POST(
      new Request("http://localhost/api/pwa/sync/service-request", {
        body: new FormData(),
        method: "POST",
      }),
    );

    expect(response.status).toBe(400);
    expect(
      offlineSyncMocks.processOfflineServiceRequest,
    ).not.toHaveBeenCalled();
  });
});
