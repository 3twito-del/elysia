import { NextResponse } from "next/server";

import { env } from "~/env";
import { processDueOutboxEvents } from "~/server/services/jobs";

export async function GET(req: Request) {
  return runOutboxJob(req);
}

export async function POST(req: Request) {
  return runOutboxJob(req);
}

async function runOutboxJob(req: Request) {
  const auth = req.headers.get("authorization");
  const secret = env.JOB_RUNNER_SECRET ?? env.CRON_SECRET;
  const expected = secret ? `Bearer ${secret}` : null;

  if (env.NODE_ENV === "production" && !expected) {
    return NextResponse.json(
      { ok: false, error: "JOB_RUNNER_SECRET is required in production." },
      { status: 503 },
    );
  }

  if (expected && auth !== expected) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized job runner." },
      { status: 401 },
    );
  }

  const result = await processDueOutboxEvents({ limit: 25 });

  return NextResponse.json({ ok: true, result });
}
