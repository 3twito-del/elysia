"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

import {
  requestCustomerOtp,
  requestCustomerOtpInputSchema,
} from "~/server/services/customer-otp";
import {
  assertRateLimit,
  rateLimitMessage,
} from "~/server/services/rate-limit";
import { signIn, signOut } from "~/server/auth";

export type CustomerOtpState = {
  ok?: boolean;
  identifier?: string;
  message?: string;
  developmentCode?: string;
};

export async function requestCustomerOtpAction(
  _state: CustomerOtpState,
  formData: FormData,
): Promise<CustomerOtpState> {
  const identifier = getFormString(formData, "identifier");
  const channel = identifier.includes("@") ? "EMAIL" : "SMS";
  const parsed = requestCustomerOtpInputSchema.safeParse({
    identifier,
    channel,
  });

  if (!parsed.success) {
    return {
      ok: false,
      identifier,
      message:
        parsed.error.issues[0]?.message ?? "יש להזין אימייל או טלפון תקינים.",
    };
  }

  try {
    assertRateLimit({
      key: `otp:request:${parsed.data.identifier}`,
      limit: 3,
      windowMs: 10 * 60_000,
    });

    const result = await requestCustomerOtp(parsed.data);

    return {
      ok: true,
      identifier: parsed.data.identifier,
      developmentCode: result.developmentCode,
      message:
        result.channel === "EMAIL"
          ? "שלחנו קוד אימות לאימייל."
          : "שלחנו קוד אימות ב-SMS.",
    };
  } catch (error) {
    const fallbackMessage =
      error instanceof Error
        ? error.message
        : "לא ניתן לשלוח קוד כרגע. נסו שוב.";

    return {
      ok: false,
      identifier,
      message: rateLimitMessage(error) ?? fallbackMessage,
    };
  }
}

export async function verifyCustomerOtpAction(
  _state: CustomerOtpState,
  formData: FormData,
): Promise<CustomerOtpState> {
  const identifier = getFormString(formData, "identifier");
  const code = getFormString(formData, "code");

  try {
    assertRateLimit({
      key: `otp:verify:${identifier}`,
      limit: 6,
      windowMs: 10 * 60_000,
    });

    await signIn("otp", {
      identifier,
      code,
      redirectTo: "/account",
    });
  } catch (error) {
    const message = rateLimitMessage(error);

    if (message) {
      return {
        ok: false,
        identifier,
        message,
      };
    }

    if (error instanceof AuthError) {
      return {
        ok: false,
        identifier,
        message: "קוד האימות אינו תקין או שפג תוקף.",
      };
    }

    throw error;
  }

  redirect("/account");
}

export async function customerLogoutAction() {
  await signOut({ redirectTo: "/account" });
}

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}
