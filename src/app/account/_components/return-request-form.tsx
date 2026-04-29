"use client";

import { useActionState } from "react";
import { RotateCcw } from "lucide-react";

import {
  requestReturnAction,
  type AccountActionState,
} from "~/app/account/actions";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";

const initialState: AccountActionState = {};

export function ReturnRequestForm({ orderId }: { orderId: string }) {
  const [state, action, pending] = useActionState(
    requestReturnAction,
    initialState,
  );

  return (
    <form action={action} className="grid gap-3">
      <input name="orderId" type="hidden" value={orderId} />
      <div className="grid gap-2">
        <Label htmlFor="return-reason">סיבת החזרה</Label>
        <Textarea
          id="return-reason"
          name="reason"
          placeholder="מידה, סגנון, פגם, או כל סיבה אחרת"
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="return-notes">הערות</Label>
        <Textarea id="return-notes" name="notes" placeholder="פרטים נוספים" />
      </div>
      {state.message ? (
        <p
          className={
            state.ok ? "text-sm text-emerald-700" : "text-sm text-red-700"
          }
        >
          {state.message}
        </p>
      ) : null}
      <Button className="w-fit gap-2" disabled={pending} type="submit">
        <RotateCcw className="size-4" />
        פתיחת בקשת החזרה
      </Button>
    </form>
  );
}
