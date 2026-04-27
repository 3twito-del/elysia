import { NextResponse } from "next/server";

import { paymentProvider } from "~/server/adapters/payment";

export async function POST(req: Request) {
  const payload: unknown = await req.json().catch(() => ({}));
  const signature = req.headers.get("x-cardcom-signature") ?? undefined;
  const verified = await paymentProvider.verifyWebhook(payload, signature);

  if (!verified) {
    return NextResponse.json(
      { ok: false, error: "Invalid signature" },
      { status: 401 },
    );
  }

  return NextResponse.json({
    ok: true,
    provider: "cardcom",
    status: "RECEIVED",
  });
}
