import { describe, expect, it } from "vitest";

import { summarizeFacilityRequests } from "./facilities";

describe("summarizeFacilityRequests", () => {
  it("counts requests by workflow state", () => {
    expect(
      summarizeFacilityRequests([
        { status: "OPEN" },
        { status: "OPEN" },
        { status: "SCHEDULED" },
        { status: "DONE" },
        { status: "CANCELLED" },
      ]),
    ).toEqual({ open: 2, scheduled: 1, done: 1 });
  });

  it("is all zero with no requests", () => {
    expect(summarizeFacilityRequests([])).toEqual({
      open: 0,
      scheduled: 0,
      done: 0,
    });
  });
});
