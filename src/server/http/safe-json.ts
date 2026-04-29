export type SafeJsonResult =
  | { ok: true; data: unknown }
  | { ok: false; error: "empty" | "invalid" };

export async function readSafeJson(req: Request): Promise<SafeJsonResult> {
  const body = await req.text();

  if (!body.trim()) {
    return { ok: false, error: "empty" };
  }

  try {
    return { ok: true, data: JSON.parse(body) as unknown };
  } catch {
    return { ok: false, error: "invalid" };
  }
}
