"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { LockKeyhole } from "lucide-react";

import { adminLoginAction, type AdminLoginState } from "../../actions";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { StatusMessage } from "~/components/ui/status-message";

const initialState: AdminLoginState = {};
const adminLoginStatusId = "admin-login-status";

type AdminLoginFormProps = {
  next: string;
};

export function AdminLoginForm({ next }: AdminLoginFormProps) {
  const [state, formAction] = useActionState(adminLoginAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const hasLoginError = Boolean(state.message);

  useEffect(() => {
    if (hasLoginError) {
      const emailInput = formRef.current?.elements.namedItem("email");

      if (emailInput instanceof HTMLElement) {
        emailInput.focus();
      }
    }
  }, [hasLoginError, state.message]);

  return (
    <form action={formAction} className="grid gap-5" ref={formRef}>
      <input name="next" type="hidden" value={next} />
      <div className="grid gap-2">
        <Label htmlFor="email">אימייל אדמין</Label>
        <Input
          aria-describedby={hasLoginError ? adminLoginStatusId : undefined}
          aria-invalid={hasLoginError}
          autoComplete="email"
          dir="ltr"
          id="email"
          name="email"
          placeholder="admin@elysia.local"
          required
          type="email"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">סיסמה</Label>
        <Input
          aria-describedby={hasLoginError ? adminLoginStatusId : undefined}
          aria-invalid={hasLoginError}
          autoComplete="current-password"
          dir="ltr"
          id="password"
          minLength={12}
          name="password"
          required
          type="password"
        />
      </div>
      {state.message ? (
        <StatusMessage id={adminLoginStatusId} tone="error">
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
      <LockKeyhole aria-hidden="true" className="size-4" />
      כניסה לאדמין
    </Button>
  );
}
