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

const initialState: AccountActionState = {};

export function CustomerPrivacyActions() {
  const [state, action, pending] = useActionState(
    deleteCustomerDataAction,
    initialState,
  );

  return (
    <div className="grid gap-4">
      <Button asChild className="w-fit gap-2" variant="outline">
        <a href="/account/privacy/export">
          <Download className="size-4" />
          ייצוא נתונים
        </a>
      </Button>

      <form
        action={action}
        className="glass-inset grid gap-3 rounded-md border p-3"
      >
        <Label htmlFor="delete-confirmation">מחיקת נתונים</Label>
        <Input
          id="delete-confirmation"
          name="confirmation"
          placeholder="DELETE"
          required
        />
        {state.message ? (
          <p
            className={
              state.ok ? "text-sm text-emerald-700" : "text-sm text-red-700"
            }
          >
            {state.message}
          </p>
        ) : null}
        <Button
          className="w-fit gap-2"
          disabled={pending}
          type="submit"
          variant="outline"
        >
          <Trash2 className="size-4" />
          מחיקת נתונים
        </Button>
      </form>
    </div>
  );
}
