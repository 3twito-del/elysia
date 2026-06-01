import { describe, expect, it } from "vitest";

import {
  createOfflineSyncResponse,
  getPublicOfflineSyncError,
} from "./offline-sync";

describe("offline sync service helpers", () => {
  it("summarizes mixed sync results for retry UI", () => {
    expect(
      createOfflineSyncResponse([
        { actionId: "offline_action_1", ok: true },
        {
          actionId: "offline_action_2",
          error: getPublicOfflineSyncError("cart.updateItem"),
          ok: false,
        },
      ]),
    ).toEqual({
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

  it("keeps public sync errors specific without exposing internals", () => {
    expect(getPublicOfflineSyncError("cart.addItem")).toBe(
      "Some offline cart changes could not be synced. Review your cart, then retry when the connection is stable.",
    );
    expect(getPublicOfflineSyncError("service.request")).toBe(
      "Queued service request or attachments could not be synced. Please retry or submit the request again from the service page.",
    );
    expect(getPublicOfflineSyncError("newsletter.join")).toBe(
      "Queued action could not be synced. Please retry when the connection is stable.",
    );
  });
});
