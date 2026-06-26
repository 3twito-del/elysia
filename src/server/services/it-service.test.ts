import { describe, expect, it } from "vitest";

import { summarizeAssets, summarizeTickets } from "./it-service";

describe("summarizeTickets", () => {
  it("counts open vs resolved and the urgent/high open exposure", () => {
    expect(
      summarizeTickets([
        { status: "OPEN", priority: "URGENT" },
        { status: "IN_PROGRESS", priority: "HIGH" },
        { status: "OPEN", priority: "LOW" },
        { status: "RESOLVED", priority: "URGENT" },
        { status: "CLOSED", priority: "MEDIUM" },
      ]),
    ).toEqual({ open: 3, urgentOpen: 2, resolved: 2 });
  });
});

describe("summarizeAssets", () => {
  it("counts assets by lifecycle state", () => {
    expect(
      summarizeAssets([
        { status: "IN_USE" },
        { status: "IN_USE" },
        { status: "IN_STORAGE" },
        { status: "RETIRED" },
      ]),
    ).toEqual({ inUse: 2, inStorage: 1, retired: 1 });
  });
});
