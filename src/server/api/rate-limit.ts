import { TRPCError } from "@trpc/server";

import {
  consumeRateLimit,
  getHeadersIp,
  type RateLimitInput,
} from "~/server/services/rate-limit";

type TRPCRateLimitInput = RateLimitInput & {
  message?: string;
};

export async function assertTRPCRateLimit(input: TRPCRateLimitInput) {
  const result = await consumeRateLimit(input);

  if (!result.allowed) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: input.message ?? "Too many requests.",
    });
  }

  return result;
}

export function getTRPCRequestIp(headers: Headers) {
  return getHeadersIp(headers);
}
