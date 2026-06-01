"use client";

import { useActionState } from "react";
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
  const confirmationError = state.fieldErrors?.confirmation;

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
          <li>שאלות פרטיות או נגישות ממשיכות דרך שירות אישי.</li>
        </ul>
      </div>
      <Button asChild className="w-fit gap-2" variant="outline">
        <a href="/account/privacy/export">
          <Download aria-hidden="true" className="size-4" />
          ייצוא נתונים
        </a>
      </Button>

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
          מחיקת נתונים
        </Button>
      </form>
    </div>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  return (
    <p className="text-destructive min-h-5 text-xs leading-5" id={id}>
      {message ?? ""}
    </p>
  );
}
