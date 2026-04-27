import { NextResponse } from "next/server";

import { searchProvider } from "~/server/adapters/search";

export async function POST() {
  const result = await searchProvider.indexProducts();

  return NextResponse.json({
    ok: true,
    ...result,
  });
}
