import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { type NextRequest } from "next/server";

import { env } from "~/env";
import { appRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a HTTP request (e.g. when you make requests from Client Components).
 */
const createContext = async (req: NextRequest) => {
  return createTRPCContext({
    headers: req.headers,
  });
};

const MAX_TRPC_BODY_BYTES = 1024 * 1024;

const handler = (req: NextRequest) => {
  const contentLength = Number(req.headers.get("content-length"));

  if (
    Number.isSafeInteger(contentLength) &&
    contentLength > MAX_TRPC_BODY_BYTES
  ) {
    return new Response(
      JSON.stringify({ error: { message: "Request body is too large." } }),
      {
        headers: { "Content-Type": "application/json; charset=utf-8" },
        status: 413,
      },
    );
  }

  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createContext(req),
    onError:
      env.NODE_ENV === "development"
        ? ({ path, error }) => {
            console.error(
              `tRPC failed on ${path ?? "<no-path>"}: ${error.message}`,
            );
          }
        : undefined,
  });
};

export { handler as GET, handler as POST };
