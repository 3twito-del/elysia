import { ZodError } from "zod";

import {
  createCustomerAuthFixture,
  CustomerAuthFixturesDisabledError,
} from "~/server/services/customer-auth-fixtures";
import { jsonResponse } from "~/server/http/api-response";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown = {};

  try {
    body = await request.json();
  } catch {
    body = {};
  }

  try {
    const fixture = await createCustomerAuthFixture(body);

    return jsonResponse(
      {
        ok: true,
        fixture,
      },
      {
        headers: {
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  } catch (error) {
    if (error instanceof CustomerAuthFixturesDisabledError) {
      return jsonResponse(
        {
          ok: false,
          error: "Not found.",
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
          ok: false,
          error: "Invalid fixture input.",
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
