"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

import {
  requestCustomerOtp,
  requestCustomerOtpInputSchema,
} from "~/server/services/customer-otp";
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
      message: parsed.error.issues[0]?.message ?? "יש להזין אימייל או טלפון.",
    };
  }

  try {
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
    return {
      ok: false,
      identifier,
      message:
        error instanceof Error
          ? error.message
          : "לא ניתן לשלוח קוד כרגע. נסו שוב.",
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
    await signIn("otp", {
      identifier,
      code,
      redirectTo: "/account",
    });
  } catch (error) {
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
