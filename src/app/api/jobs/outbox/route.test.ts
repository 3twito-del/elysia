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

vi.mock("~/env", () => ({
  env: envMock,
}));

vi.mock("~/server/services/jobs", () => ({
  processDueOutboxEvents: jobMocks.processDueOutboxEvents,
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
      result: {
        failed: 0,
        processed: 1,
        scanned: 1,
        skipped: 0,
      },
    });
    expect(jobMocks.processDueOutboxEvents).toHaveBeenCalledWith({
      limit: 25,
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
