"use client";

import { useActionState } from "react";
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

export function ReturnRequestForm({ orderId }: { orderId: string }) {
  const [state, action, pending] = useActionState(
    requestReturnAction,
    initialState,
  );
  const fieldErrors = state.fieldErrors ?? {};

  return (
    <form action={action} className="grid gap-3">
      <input name="orderId" type="hidden" value={orderId} />
      <div className="grid gap-2">
        <Label htmlFor="return-reason">סיבת החזרה</Label>
        <Textarea
          aria-describedby="return-reason-error"
          aria-invalid={Boolean(fieldErrors.reason)}
          disabled={pending}
          id="return-reason"
          maxLength={500}
          minLength={3}
          name="reason"
          placeholder="מידה, סגנון, פגם, או כל סיבה אחרת"
          required
        />
        <FieldError id="return-reason-error" message={fieldErrors.reason} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="return-notes">הערות</Label>
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
        <StatusMessage tone={state.ok ? "success" : "error"} variant="plain">
          {state.message}
        </StatusMessage>
      ) : null}
      <Button className="w-fit gap-2" disabled={pending} type="submit">
        <RotateCcw className="size-4" />
        {pending ? "פותח בקשה..." : "פתיחת בקשת החזרה"}
      </Button>
    </form>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  return (
    <p className="text-destructive min-h-5 text-xs leading-5" id={id}>
      {message ?? ""}
    </p>
  );
}
