"use client";

import { useActionState, useSyncExternalStore } from "react";
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
import { StatusMessage } from "~/components/ui/status-message";
import { getOrCreateCartSessionKey } from "~/lib/cart-session";

const initialState: CustomerOtpState = {};
const accountInputClassName = "h-12 px-4 text-base md:text-sm";
const accountLabelClassName = "mb-2 justify-start leading-5";

export function CustomerOtpForm() {
  const sessionKey = useSyncExternalStore(
    subscribeToNoopStore,
    getClientCartSessionSnapshot,
    getServerCartSessionSnapshot,
  );
  const [requestState, requestAction] = useActionState(
    requestCustomerOtpAction,
    initialState,
  );
  const [verifyState, verifyAction] = useActionState(
    verifyCustomerOtpAction,
    initialState,
  );
  const requestedIdentifier = requestState.ok
    ? (requestState.identifier ?? "")
    : "";
  const verificationIdentifier = verifyState.identifier ?? requestedIdentifier;
  const canVerify = Boolean(requestState.ok && verificationIdentifier);

  return (
    <div className="grid gap-5">
      <form
        action={requestAction}
        className="grid gap-4"
        data-testid="account-otp-request-form"
      >
        <input name="sessionKey" type="hidden" value={sessionKey} />
        <div>
          <Label className={accountLabelClassName} htmlFor="identifier">
            אימייל או טלפון
          </Label>
          <Input
            autoComplete="email tel"
            className={accountInputClassName}
            data-testid="account-identifier-input"
            defaultValue={verificationIdentifier}
            dir="auto"
            id="identifier"
            name="identifier"
            placeholder="אימייל או נייד"
            required
            type="text"
          />
        </div>
        {requestState.message ? (
          <OtpStatusMessage state={requestState} />
        ) : null}
        {requestState.developmentCode ? (
          <p className="glass-inset rounded-md border p-3 text-xs leading-6">
            קוד פיתוח: <span dir="ltr">{requestState.developmentCode}</span>
          </p>
        ) : null}
        <RequestButton hasVerificationTarget={canVerify} />
      </form>

      {canVerify ? (
        <form action={verifyAction} className="grid gap-4">
          <input
            name="identifier"
            type="hidden"
            value={verificationIdentifier}
          />
          <input name="sessionKey" type="hidden" value={sessionKey} />
          <p className="text-muted-foreground text-sm leading-6">
            קוד האימות נשלח אל{" "}
            <span className="text-foreground font-medium" dir="ltr">
              {verificationIdentifier}
            </span>
            .
          </p>
          <div>
            <Label className={accountLabelClassName} htmlFor="code">
              קוד אימות
            </Label>
            <Input
              autoComplete="one-time-code"
              className={accountInputClassName}
              data-testid="account-code-input"
              dir="ltr"
              id="code"
              inputMode="numeric"
              maxLength={8}
              minLength={4}
              name="code"
              required
            />
          </div>
          {verifyState.message ? (
            <OtpStatusMessage state={verifyState} />
          ) : null}
          <VerifyButton />
        </form>
      ) : null}
    </div>
  );
}

function subscribeToNoopStore() {
  return () => undefined;
}

function getClientCartSessionSnapshot() {
  return getOrCreateCartSessionKey();
}

function getServerCartSessionSnapshot() {
  return "";
}

function OtpStatusMessage({ state }: { state: CustomerOtpState }) {
  return (
    <StatusMessage tone={state.ok ? "success" : "error"}>
      {state.message}
    </StatusMessage>
  );
}

function RequestButton({
  hasVerificationTarget,
}: {
  hasVerificationTarget: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <Button className="w-full gap-2" disabled={pending} type="submit">
      <Send aria-hidden="true" className="size-4" />
      {pending
        ? "שולח קוד..."
        : hasVerificationTarget
          ? "שליחת קוד נוסף"
          : "שליחת קוד"}
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
      <LogIn aria-hidden="true" className="size-4" />
      {pending ? "בודק קוד..." : "כניסה לאזור לקוח"}
    </Button>
  );
}
