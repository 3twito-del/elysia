"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { ShieldCheck } from "lucide-react";

import { adminMfaConfirmEnrollAction, type AdminMfaEnrollState } from "../actions";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { StatusMessage } from "~/components/ui/status-message";

const initialState: AdminMfaEnrollState = {};
const mfaEnrollStatusId = "admin-mfa-enroll-status";

type AdminMfaEnrollFormProps = {
  next: string;
  otpauthUri: string;
  qrDataUrl: string;
  secretBase32: string;
};

export function AdminMfaEnrollForm({
  next,
  otpauthUri,
  qrDataUrl,
  secretBase32,
}: AdminMfaEnrollFormProps) {
  const [state, formAction] = useActionState(
    adminMfaConfirmEnrollAction,
    initialState,
  );
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
      <div className="grid gap-3">
        <p className="text-sm leading-6">
          יש לסרוק את הקוד באפליקציית אימות (כגון Google Authenticator או
          Authy), או להזין את המפתח באופן ידני.
        </p>
        <img
          alt="קוד QR להפעלת אימות דו-שלבי"
          className="mx-auto rounded-md border border-[var(--glass-border)] bg-white p-2"
          height={220}
          src={qrDataUrl}
          width={220}
        />
        <div className="elysia-inset glass-inset rounded-md border p-3">
          <p className="text-muted-foreground text-xs">מפתח ידני</p>
          <p className="mt-1 font-mono text-sm break-all" dir="ltr">
            {secretBase32}
          </p>
        </div>
        <a
          className="text-muted-foreground text-xs underline underline-offset-4"
          href={otpauthUri}
        >
          פתיחה ישירה באפליקציית אימות
        </a>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="code">קוד בן 6 ספרות</Label>
        <Input
          aria-describedby={hasError ? mfaEnrollStatusId : undefined}
          aria-invalid={hasError}
          autoComplete="one-time-code"
          autoFocus
          dir="ltr"
          id="code"
          inputMode="numeric"
          maxLength={6}
          name="code"
          placeholder="123456"
          required
        />
      </div>
      {state.message ? (
        <StatusMessage id={mfaEnrollStatusId} tone="error">
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
      אישור קוד
    </Button>
  );
}
