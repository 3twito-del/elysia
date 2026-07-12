import { ZodError } from "zod";

import { jsonResponse } from "~/server/http/api-response";
import {
  AdminAuthFixturesDisabledError,
  createAdminAuthFixture,
} from "~/server/services/admin-auth-fixtures";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown = {};

  try {
    body = await request.json();
  } catch {
    body = {};
  }

  try {
    const fixture = await createAdminAuthFixture(body);

    return jsonResponse(
      {
        fixture,
        ok: true,
      },
      {
        headers: {
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  } catch (error) {
    if (error instanceof AdminAuthFixturesDisabledError) {
      return jsonResponse(
        {
          error: "Not found.",
          ok: false,
        },
        {
          headers: {
            "Cache-Control": "no-store",
            "X-Content-Type-Options": "nosniff",
          },
          status: 404,
        },
      );
    }

    if (error instanceof ZodError) {
      return jsonResponse(
        {
          error: "Invalid fixture input.",
          ok: false,
        },
        {
          headers: {
            "Cache-Control": "no-store",
            "X-Content-Type-Options": "nosniff",
          },
          status: 400,
        },
      );
    }

    throw error;
  }
}
