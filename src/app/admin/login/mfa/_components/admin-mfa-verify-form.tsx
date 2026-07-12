"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { ShieldCheck } from "lucide-react";

import {
  adminMfaVerifyAction,
  type AdminMfaVerifyState,
} from "../actions";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { StatusMessage } from "~/components/ui/status-message";

const initialState: AdminMfaVerifyState = {};
const mfaVerifyStatusId = "admin-mfa-verify-status";

type AdminMfaVerifyFormProps = {
  next: string;
};

export function AdminMfaVerifyForm({ next }: AdminMfaVerifyFormProps) {
  const [state, formAction] = useActionState(adminMfaVerifyAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const hasError = Boolean(state.message);

  useEffect(() => {
    if (hasError) {
      const codeInput = formRef.current?.elements.namedItem("code");

      if (codeInput instanceof HTMLElement) {
        codeInput.focus();
      }
    }
  }, [hasError, state.message]);

  return (
    <form action={formAction} className="grid gap-5" ref={formRef}>
      <input name="next" type="hidden" value={next} />
      <div className="grid gap-2">
        <Label htmlFor="code">קוד אימות או קוד גיבוי</Label>
        <Input
          aria-describedby={hasError ? mfaVerifyStatusId : undefined}
          aria-invalid={hasError}
          autoComplete="one-time-code"
          autoFocus
          dir="ltr"
          id="code"
          inputMode="text"
          name="code"
          placeholder="123456"
          required
        />
      </div>
      {state.message ? (
        <StatusMessage id={mfaVerifyStatusId} tone="error">
          {state.message}
        </StatusMessage>
      ) : null}
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button className="w-full gap-2" disabled={pending} size="lg" type="submit">
      <ShieldCheck aria-hidden="true" className="size-4" />
      אישור
    </Button>
  );
}
