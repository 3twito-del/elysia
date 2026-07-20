"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Download, Trash2 } from "lucide-react";

import {
  deleteCustomerDataAction,
  type AccountActionState,
} from "~/app/account/actions";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { StatusMessage } from "~/components/ui/status-message";
import { DELETE_CONFIRMATION_VALUE } from "~/lib/account-validation-constants";

const initialState: AccountActionState = {};
const accountInputClassName = "h-12 px-4 text-base md:text-sm";
const accountLabelClassName = "mb-2 justify-start leading-5";

export function CustomerPrivacyActions() {
  const [state, action, pending] = useActionState(
    deleteCustomerDataAction,
    initialState,
  );
  const [exportState, setExportState] = useState<{
    pending: boolean;
    error?: string;
  }>({ pending: false });
  const confirmationError = state.fieldErrors?.confirmation;
  const confirmationInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // UX48: an irreversible-action form (delete account data) needs its
    // error focused, not just visible -- otherwise a keyboard/screen-reader
    // user gets no signal the confirmation was rejected.
    if (confirmationError) {
      confirmationInputRef.current?.focus();
    }
  }, [confirmationError]);

  return (
    <div className="grid gap-4">
      <div
        className="glass-inset rounded-md border p-3 text-sm"
        data-testid="account-privacy-shortcut-context"
      >
        <p className="font-medium">ניהול פרטיות ונתוני חשבון</p>
        <ul className="text-muted-foreground mt-2 grid list-inside list-disc gap-1 leading-6">
          <li>ייצוא נתוני החשבון נשאר זמין בקובץ מוגן.</li>
          <li>מחיקה דורשת אישור מפורש לפני פעולה קבועה.</li>
          <li>שאלות פרטיות או נגישות ממשיכות דרך השירות.</li>
        </ul>
      </div>
      <div className="grid w-fit gap-2">
        <Button
          className="w-fit gap-2"
          disabled={exportState.pending}
          onClick={async () => {
            setExportState({ pending: true });

            try {
              const response = await fetch("/account/privacy/export");

              if (response.status === 401) {
                setExportState({
                  pending: false,
                  error: "החיבור לחשבון פג. נא להתחבר מחדש כדי לייצא נתונים.",
                });
                return;
              }

              if (!response.ok) {
                setExportState({
                  pending: false,
                  error: "לא ניתן לייצא נתונים כרגע. נסי שוב בעוד רגע.",
                });
                return;
              }

              const blob = await response.blob();
              const objectUrl = URL.createObjectURL(blob);
              const link = document.createElement("a");

              link.href = objectUrl;
              link.download = "elysia-customer-export.json";
              link.click();
              URL.revokeObjectURL(objectUrl);
              setExportState({ pending: false });
            } catch {
              setExportState({
                pending: false,
                error: "לא ניתן לייצא נתונים כרגע. נסי שוב בעוד רגע.",
              });
            }
          }}
          type="button"
          variant="outline"
        >
          <Download aria-hidden="true" className="size-4" />
          {exportState.pending ? "מייצאת…" : "ייצוא נתונים"}
        </Button>
        {exportState.error ? (
          <StatusMessage role="alert" tone="error" variant="plain">
            {exportState.error}
          </StatusMessage>
        ) : null}
      </div>

      <form
        action={action}
        className="glass-inset grid gap-3 rounded-md border p-3"
      >
        <Label className={accountLabelClassName} htmlFor="delete-confirmation">
          מחיקת נתונים
        </Label>
        <Input
          aria-describedby="delete-confirmation-error"
          aria-invalid={Boolean(confirmationError)}
          autoComplete="off"
          className={accountInputClassName}
          disabled={pending}
          id="delete-confirmation"
          name="confirmation"
          pattern={DELETE_CONFIRMATION_VALUE}
          placeholder={DELETE_CONFIRMATION_VALUE}
          ref={confirmationInputRef}
          required
        />
        <p className="text-muted-foreground text-xs leading-5">
          יש להקליד DELETE בדיוק כדי לאשר מחיקה קבועה של נתוני הלקוח.
        </p>
        <FieldError
          id="delete-confirmation-error"
          message={confirmationError}
        />
        {state.message ? (
          <StatusMessage tone={state.ok ? "success" : "error"} variant="plain">
            {state.message}
          </StatusMessage>
        ) : null}
        <Button
          className="w-fit gap-2"
          disabled={pending}
          type="submit"
          variant="outline"
        >
          <Trash2 aria-hidden="true" className="size-4" />
          {pending ? "מוחקת..." : "מחיקת נתונים"}
        </Button>
      </form>
    </div>
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
