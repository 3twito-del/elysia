import { describe, expect, it } from "vitest";

import { activeAnnouncements } from "./announcements";

describe("activeAnnouncements", () => {
  const now = new Date("2026-06-25T12:00:00.000Z");

  it("hides unpublished and expired announcements", () => {
    const result = activeAnnouncements(
      [
        {
          isPinned: false,
          publishedAt: new Date("2026-06-20T00:00:00.000Z"),
          expiresAt: null,
        },
        { isPinned: false, publishedAt: null, expiresAt: null }, // draft
        {
          isPinned: false,
          publishedAt: new Date("2026-06-01T00:00:00.000Z"),
          expiresAt: new Date("2026-06-10T00:00:00.000Z"), // expired
        },
      ],
      now,
    );

    expect(result).toHaveLength(1);
  });

  it("orders pinned announcements first, then most recent", () => {
    const old = {
      isPinned: false,
      publishedAt: new Date("2026-06-10T00:00:00.000Z"),
      expiresAt: null,
    };
    const recent = {
      isPinned: false,
      publishedAt: new Date("2026-06-24T00:00:00.000Z"),
      expiresAt: null,
    };
    const pinned = {
      isPinned: true,
      publishedAt: new Date("2026-06-05T00:00:00.000Z"),
      expiresAt: null,
    };

    const result = activeAnnouncements([old, recent, pinned], now);
    expect(result).toEqual([pinned, recent, old]);
  });
});
