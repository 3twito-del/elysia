"use client";

import { useActionState, useEffect, useRef, useSyncExternalStore } from "react";
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
const otpRequestStatusId = "account-otp-request-status";
const otpVerifyStatusId = "account-otp-verify-status";

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
  const identifierInputRef = useRef<HTMLInputElement>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);
  const requestedIdentifier = requestState.ok
    ? (requestState.identifier ?? "")
    : "";
  const verificationIdentifier = verifyState.identifier ?? requestedIdentifier;
  const canVerify = Boolean(requestState.ok && verificationIdentifier);
  const hasRequestError =
    requestState.ok === false && Boolean(requestState.message);
  const hasVerifyError =
    verifyState.ok === false && Boolean(verifyState.message);

  useEffect(() => {
    if (hasRequestError) {
      identifierInputRef.current?.focus();
    }
  }, [hasRequestError, requestState.message]);

  useEffect(() => {
    if (hasVerifyError) {
      codeInputRef.current?.focus();
    }
  }, [hasVerifyError, verifyState.message]);

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
            aria-describedby={
              requestState.message ? otpRequestStatusId : undefined
            }
            aria-invalid={hasRequestError}
            autoComplete="email tel"
            className={accountInputClassName}
            data-testid="account-identifier-input"
            defaultValue={verificationIdentifier}
            dir="auto"
            id="identifier"
            name="identifier"
            ref={identifierInputRef}
            placeholder="אימייל או נייד"
            required
            type="text"
          />
        </div>
        {requestState.message ? (
          <OtpStatusMessage id={otpRequestStatusId} state={requestState} />
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
              aria-describedby={
                verifyState.message ? otpVerifyStatusId : undefined
              }
              aria-invalid={hasVerifyError}
              autoComplete="one-time-code"
              className={accountInputClassName}
              data-testid="account-code-input"
              dir="ltr"
              id="code"
              inputMode="numeric"
              maxLength={8}
              minLength={4}
              name="code"
              ref={codeInputRef}
              required
            />
          </div>
          {verifyState.message ? (
            <OtpStatusMessage id={otpVerifyStatusId} state={verifyState} />
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

function OtpStatusMessage({
  id,
  state,
}: {
  id: string;
  state: CustomerOtpState;
}) {
  return (
    <StatusMessage id={id} tone={state.ok ? "success" : "error"}>
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
      {hasVerificationTarget ? "שליחת קוד נוסף" : "שליחת קוד"}
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
      כניסה לאזור אישי
    </Button>
  );
}
