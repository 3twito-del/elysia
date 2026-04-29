"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { LogIn, Send } from "lucide-react";

import {
  requestCustomerOtpAction,
  verifyCustomerOtpAction,
  type CustomerOtpState,
} from "../actions";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { getOrCreateCartSessionKey } from "~/lib/cart-session";

const initialState: CustomerOtpState = {};

export function CustomerOtpForm() {
  const [sessionKey] = useState(() =>
    typeof window === "undefined" ? "" : getOrCreateCartSessionKey(),
  );
  const [requestState, requestAction] = useActionState(
    requestCustomerOtpAction,
    initialState,
  );
  const [verifyState, verifyAction] = useActionState(
    verifyCustomerOtpAction,
    initialState,
  );
  const identifier = verifyState.identifier ?? requestState.identifier ?? "";

  return (
    <div className="grid gap-6">
      <form action={requestAction} className="grid gap-4">
        <div>
          <Label htmlFor="identifier">אימייל או טלפון</Label>
          <Input
            autoComplete="email tel"
            dir="ltr"
            id="identifier"
            name="identifier"
            placeholder="name@example.com או 050..."
            required
            type="text"
          />
        </div>
        {requestState.message ? <StatusMessage state={requestState} /> : null}
        {requestState.developmentCode ? (
          <p className="glass-inset rounded-md border p-3 text-xs leading-6">
            קוד פיתוח: <span dir="ltr">{requestState.developmentCode}</span>
          </p>
        ) : null}
        <RequestButton />
      </form>

      <form action={verifyAction} className="grid gap-4">
        <input name="sessionKey" type="hidden" value={sessionKey} />
        <div>
          <Label htmlFor="verify-identifier">אימייל או טלפון לאימות</Label>
          <Input
            defaultValue={identifier}
            dir="ltr"
            id="verify-identifier"
            key={identifier}
            name="identifier"
            placeholder="name@example.com או 050..."
            required
            type="text"
          />
        </div>
        <div>
          <Label htmlFor="code">קוד אימות</Label>
          <Input
            autoComplete="one-time-code"
            dir="ltr"
            id="code"
            inputMode="numeric"
            maxLength={8}
            minLength={4}
            name="code"
            required
          />
        </div>
        {verifyState.message ? <StatusMessage state={verifyState} /> : null}
        <VerifyButton />
      </form>
    </div>
  );
}

function StatusMessage({ state }: { state: CustomerOtpState }) {
  return (
    <p
      className={`glass-inset rounded-md border p-3 text-sm ${
        state.ok ? "text-emerald-700" : "text-red-700"
      }`}
    >
      {state.message}
    </p>
  );
}

function RequestButton() {
  const { pending } = useFormStatus();

  return (
    <Button className="w-full gap-2" disabled={pending} type="submit">
      <Send className="size-4" />
      {pending ? "שולח קוד..." : "שליחת קוד"}
    </Button>
  );
}

function VerifyButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      className="w-full gap-2"
      disabled={pending}
      type="submit"
      variant="secondary"
    >
      <LogIn className="size-4" />
      {pending ? "בודק קוד..." : "כניסה לאזור לקוח"}
    </Button>
  );
}
