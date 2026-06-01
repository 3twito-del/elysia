import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  assertInternalPushTargetUrl,
  createPushCampaignDryRunPreview,
  pushCampaignSegments,
} from "./push";

describe("push target URL guard", () => {
  it("normalizes same-origin relative URLs", () => {
    expect(assertInternalPushTargetUrl("/search?q=rings")).toBe(
      "/search?q=rings",
    );
  });

  it("rejects external campaign URLs", () => {
    expect(() =>
      assertInternalPushTargetUrl("https://example.invalid/phishing"),
    ).toThrow("Push target URL is invalid.");
  });

  it("keeps user-facing unsubscribe paths available and unambiguous", () => {
    const pushClient = read("src/lib/push-client.ts");
    const pushButton = read("src/components/push-opt-in-button.tsx");
    const subscriptionRoute = read("src/app/api/push/subscription/route.ts");

    expect(pushClient).toContain("getExistingElysiaPushSubscription");
    expect(pushClient).toContain("unsubscribeFromElysiaPush");
    expect(pushClient).toContain('fetch("/api/push/subscription"');
    expect(pushClient).toContain('method: "DELETE"');
    expect(pushClient).toContain("subscription.unsubscribe()");
    expect(pushClient).toContain("getPwaDeviceId()");

    expect(pushButton).toContain("getExistingElysiaPushSubscription");
    expect(pushButton).toContain("unsubscribeFromElysiaPush");
    expect(pushButton).toContain("aria-pressed={isSubscribed}");
    expect(pushButton).toContain("BellOff");
    expect(pushButton).toContain("checkingSubscription");
    expect(pushButton).toContain("result.unsubscribed");

    expect(subscriptionRoute).toContain("export async function DELETE");
    expect(subscriptionRoute).toContain("revokePushSubscription");
    expect(subscriptionRoute).toContain(
      "Missing push subscription identifier.",
    );
  });

  it("creates dry-run previews for campaign payload and audience gaps", () => {
    expect(pushCampaignSegments).toEqual([
      "MARKETING_OPT_IN",
      "TRANSACTIONAL_OPT_IN",
      "ALL_ACTIVE",
    ]);
    expect(
      createPushCampaignDryRunPreview({
        audienceCount: 0,
        body: " New collection ",
        configured: true,
        segment: "MARKETING_OPT_IN",
        targetUrl: "/search?q=rings",
        title: " Rings ",
      }),
    ).toEqual({
      audienceCount: 0,
      canSend: false,
      invalidTargetCase: null,
      missingSubscriptionCase:
        "No active push subscriptions match this segment.",
      payload: {
        body: "New collection",
        segment: "MARKETING_OPT_IN",
        targetUrl: "/search?q=rings",
        title: "Rings",
      },
    });
  });
});

function read(relativePath: string) {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}
