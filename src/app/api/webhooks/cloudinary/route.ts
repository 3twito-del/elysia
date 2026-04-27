import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const payload: unknown = await req.json().catch(() => ({}));

  return NextResponse.json({
    ok: true,
    provider: "cloudinary",
    status: "RECEIVED",
    payload,
  });
}
