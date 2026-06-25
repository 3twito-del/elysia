import { describe, expect, it } from "vitest";

import { advanceEnrollment, computeNextRunAt } from "./crm-journeys";

const steps = [
  { stepOrder: 1, actionType: "send_email", delayHours: 0 },
  { stepOrder: 2, actionType: "send_email", delayHours: 48 },
  { stepOrder: 3, actionType: "send_email", delayHours: 72 },
];

describe("computeNextRunAt", () => {
  it("adds the delay in hours", () => {
    const from = new Date("2026-06-01T00:00:00.000Z");
    expect(computeNextRunAt(from, 48).toISOString()).toBe(
      "2026-06-03T00:00:00.000Z",
    );
  });

  it("treats negative delays as immediate", () => {
    const from = new Date("2026-06-01T00:00:00.000Z");
    expect(computeNextRunAt(from, -5).toISOString()).toBe(
      "2026-06-01T00:00:00.000Z",
    );
  });
});

describe("advanceEnrollment", () => {
  const now = new Date("2026-06-10T12:00:00.000Z");

  it("is not due when nextRunAt is in the future", () => {
    expect(
      advanceEnrollment({
        currentStepOrder: 0,
        steps,
        nextRunAt: new Date("2026-06-11T00:00:00.000Z"),
        now,
      }),
    ).toEqual({ due: false });
  });

  it("runs the first step and schedules the second", () => {
    const result = advanceEnrollment({
      currentStepOrder: 0,
      steps,
      nextRunAt: new Date("2026-06-10T00:00:00.000Z"),
      now,
    });

    expect(result).toMatchObject({
      due: true,
      currentStepOrder: 1,
      status: "ACTIVE",
    });
    if (result.due) {
      expect(result.dueStep.stepOrder).toBe(1);
      // second step delay is 48h from now
      expect(result.nextRunAt?.toISOString()).toBe("2026-06-12T12:00:00.000Z");
    }
  });

  it("completes the journey after the last step", () => {
    const result = advanceEnrollment({
      currentStepOrder: 2,
      steps,
      nextRunAt: new Date("2026-06-10T00:00:00.000Z"),
      now,
    });

    expect(result).toMatchObject({
      due: true,
      currentStepOrder: 3,
      status: "COMPLETED",
      nextRunAt: null,
    });
  });

  it("is not due once all steps are complete", () => {
    expect(
      advanceEnrollment({
        currentStepOrder: 3,
        steps,
        nextRunAt: new Date("2026-06-10T00:00:00.000Z"),
        now,
      }),
    ).toEqual({ due: false });
  });
});
