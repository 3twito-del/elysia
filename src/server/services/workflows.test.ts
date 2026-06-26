import { describe, expect, it } from "vitest";

import { matchesEvent } from "./workflows";

describe("matchesEvent", () => {
  const base = {
    isActive: true,
    triggerType: "EVENT",
    triggerEvent: "order.paid",
  };

  it("matches an active event workflow on the right event", () => {
    expect(matchesEvent(base, "order.paid")).toBe(true);
  });

  it("ignores a different event", () => {
    expect(matchesEvent(base, "order.shipped")).toBe(false);
  });

  it("ignores inactive or non-event triggers", () => {
    expect(matchesEvent({ ...base, isActive: false }, "order.paid")).toBe(false);
    expect(matchesEvent({ ...base, triggerType: "MANUAL" }, "order.paid")).toBe(
      false,
    );
  });
});
