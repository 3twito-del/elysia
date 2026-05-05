import { okJson } from "~/server/http/api-response";
import { getCartBySession } from "~/server/services/cart";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sessionKey = url.searchParams.get("sessionKey");

  if (!sessionKey) {
    return okJson({ itemCount: 0 });
  }

  try {
    const cart = await getCartBySession(sessionKey);

    return okJson({ itemCount: cart?.itemCount ?? 0 });
  } catch {
    return okJson({ itemCount: 0 }, { status: 400 });
  }
}
