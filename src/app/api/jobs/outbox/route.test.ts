import { beforeEach, describe, expect, it, vi } from "vitest";

import { resetRateLimitStateForTests } from "~/server/services/rate-limit";

const envMock = vi.hoisted(() => ({
  CRON_SECRET: undefined as string | undefined,
  JOB_RUNNER_SECRET: undefined as string | undefined,
  NODE_ENV: "development",
}));
const jobMocks = vi.hoisted(() => ({
  processDueOutboxEvents: vi.fn(),
}));
const alertMocks = vi.hoisted(() => ({
  deliverDueAlertNotifications: vi.fn(),
  sweepOperationalInvariants: vi.fn(),
}));

vi.mock("~/env", () => ({
  env: envMock,
}));

vi.mock("~/server/services/jobs", () => ({
  processDueOutboxEvents: jobMocks.processDueOutboxEvents,
}));

vi.mock("~/server/services/operational-alerts", () => ({
  deliverDueAlertNotifications: alertMocks.deliverDueAlertNotifications,
  sweepOperationalInvariants: alertMocks.sweepOperationalInvariants,
}));

import { POST } from "./route";

describe("outbox job route", () => {
  beforeEach(() => {
    resetRateLimitStateForTests();
    vi.clearAllMocks();

    envMock.CRON_SECRET = undefined;
    envMock.JOB_RUNNER_SECRET = undefined;
    envMock.NODE_ENV = "development";
    jobMocks.processDueOutboxEvents.mockResolvedValue({
      failed: 0,
      processed: 1,
      scanned: 1,
      skipped: 0,
    });
    alertMocks.sweepOperationalInvariants.mockResolvedValue({ violations: 0 });
    alertMocks.deliverDueAlertNotifications.mockResolvedValue({
      delivered: 0,
    });
  });

  it("runs the outbox processor for authorized job runners", async () => {
    envMock.JOB_RUNNER_SECRET = "runner-secret";

    const response = await POST(
      createOutboxJobRequest({
        authorization: "Bearer runner-secret",
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      alerts: { violations: 0 },
      result: {
        failed: 0,
        processed: 1,
        scanned: 1,
        skipped: 0,
      },
      summary: {
        completed: 1,
        failed: 0,
        retryable: 0,
        scanned: 1,
        skipped: 0,
        status: "completed",
      },
    });
    expect(jobMocks.processDueOutboxEvents).toHaveBeenCalledWith({
      limit: 25,
    });
    expect(alertMocks.sweepOperationalInvariants).toHaveBeenCalled();
    expect(alertMocks.deliverDueAlertNotifications).toHaveBeenCalled();
  });

  it("summarizes skipped and retryable failed jobs without changing processor counts", async () => {
    jobMocks.processDueOutboxEvents.mockResolvedValueOnce({
      failed: 1,
      processed: 2,
      scanned: 4,
      skipped: 1,
    });

    const response = await POST(createOutboxJobRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      alerts: { violations: 0 },
      result: {
        failed: 1,
        processed: 2,
        scanned: 4,
        skipped: 1,
      },
      summary: {
        completed: 2,
        failed: 1,
        retryable: 1,
        scanned: 4,
        skipped: 1,
        status: "retryable-failures",
      },
    });
  });

  it("rejects requests when a configured job secret does not match", async () => {
    envMock.JOB_RUNNER_SECRET = "runner-secret";

    const response = await POST(
      createOutboxJobRequest({
        authorization: "Bearer wrong-secret",
      }),
    );

    expect(response.status).toBe(401);
    expect(jobMocks.processDueOutboxEvents).not.toHaveBeenCalled();
  });

  it("rate-limits repeated job triggers before processor work", async () => {
    let response = await POST(createOutboxJobRequest());

    for (let attempt = 0; attempt < 30; attempt += 1) {
      response = await POST(createOutboxJobRequest());
    }

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBeTruthy();
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "Too many outbox job requests.",
    });
    expect(jobMocks.processDueOutboxEvents).toHaveBeenCalledTimes(30);
  });

  it("returns a redacted 503 when outbox processing fails", async () => {
    const errorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    jobMocks.processDueOutboxEvents.mockRejectedValueOnce(
      new Error("provider token leaked"),
    );

    try {
      const response = await POST(createOutboxJobRequest());

      expect(response.status).toBe(503);
      await expect(response.json()).resolves.toEqual({
        ok: false,
        error: "Outbox job processor is unavailable.",
      });
    } finally {
      errorSpy.mockRestore();
    }
  });
});

function createOutboxJobRequest(input: { authorization?: string } = {}) {
  return new Request("http://localhost/api/jobs/outbox", {
    method: "POST",
    headers: {
      ...(input.authorization ? { authorization: input.authorization } : {}),
      "x-forwarded-for": "203.0.113.55",
    },
  });
}
