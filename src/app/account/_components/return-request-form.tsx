"use client";

import { useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import { RotateCcw } from "lucide-react";

import {
  requestReturnAction,
  type AccountActionState,
} from "~/app/account/actions";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { StatusMessage } from "~/components/ui/status-message";
import { Textarea } from "~/components/ui/textarea";

const initialState: AccountActionState = {};
const accountLabelClassName = "mb-2 justify-start leading-5";
const returnFieldFocusOrder = ["reason", "notes"] as const;

export function ReturnRequestForm({ orderId }: { orderId: string }) {
  const [state, action, pending] = useActionState(
    requestReturnAction,
    initialState,
  );
  const [offlineMessage, setOfflineMessage] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const fieldErrors = state.fieldErrors ?? {};

  useEffect(() => {
    if (state.ok !== false) return;

    // UX47: moves focus to (and lets a screen reader announce) the first
    // invalid field, matching the service-request form's handling.
    const firstInvalidField = returnFieldFocusOrder.find((field) =>
      Boolean(fieldErrors[field]),
    );

    if (!firstInvalidField) return;

    const frame = window.requestAnimationFrame(() => {
      const field = formRef.current?.elements.namedItem(firstInvalidField);

      if (field instanceof HTMLElement) {
        field.focus();
      }
    });

    return () => window.cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when a new submission result arrives
  }, [state]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    // UX50: a return request has no offline queue (unlike newsletter/service
    // forms) -- submitting while offline would otherwise just hang on a
    // failed network call with no explanation, so it's blocked up front
    // with a clear, honest message instead.
    if (navigator.onLine) {
      setOfflineMessage(null);
      return;
    }

    event.preventDefault();
    setOfflineMessage(
      "אין כרגע חיבור לאינטרנט. יש להתחבר ולנסות שוב כדי לפתוח את בקשת ההחזרה.",
    );
  }

  return (
    <form action={action} className="grid gap-3" onSubmit={handleSubmit} ref={formRef}>
      <input name="orderId" type="hidden" value={orderId} />
      <div className="grid gap-2">
        <Label className={accountLabelClassName} htmlFor="return-reason">
          סיבת החזרה
        </Label>
        <Textarea
          aria-describedby="return-reason-error"
          aria-invalid={Boolean(fieldErrors.reason)}
          disabled={pending}
          id="return-reason"
          maxLength={500}
          minLength={3}
          name="reason"
          placeholder="מידה, סגנון או פגם"
          required
        />
        <FieldError id="return-reason-error" message={fieldErrors.reason} />
      </div>
      <div className="grid gap-2">
        <Label className={accountLabelClassName} htmlFor="return-notes">
          הערות
        </Label>
        <Textarea
          aria-describedby="return-notes-error"
          aria-invalid={Boolean(fieldErrors.notes)}
          disabled={pending}
          id="return-notes"
          maxLength={1000}
          name="notes"
          placeholder="פרטים נוספים"
        />
        <FieldError id="return-notes-error" message={fieldErrors.notes} />
      </div>
      {state.message ? (
        <StatusMessage
          role={state.ok === false ? "alert" : "status"}
          tone={state.ok ? "success" : "error"}
          variant="plain"
        >
          {state.message}
        </StatusMessage>
      ) : null}
      {state.ok && state.requestReference ? (
        <div
          className="glass-inset grid gap-2 rounded-md border p-3 text-sm leading-6"
          data-testid="return-request-success-reference"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-muted-foreground">מספר בקשה</span>
            <strong className="font-mono text-base tracking-normal">
              {state.requestReference}
            </strong>
          </div>
          <p className="text-muted-foreground">שמרי את המספר להמשך מעקב.</p>
        </div>
      ) : null}
      {offlineMessage ? (
        <StatusMessage role="alert" tone="error" variant="plain">
          {offlineMessage}
        </StatusMessage>
      ) : null}
      <Button className="w-fit gap-2" disabled={pending} type="submit">
        <RotateCcw aria-hidden="true" className="size-4" />
        פתיחת בקשת החזרה
      </Button>
    </form>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  return (
    <p
      className="text-destructive min-h-5 text-xs leading-5"
      id={id}
      role={message ? "alert" : undefined}
    >
      {message ?? ""}
    </p>
  );
}
