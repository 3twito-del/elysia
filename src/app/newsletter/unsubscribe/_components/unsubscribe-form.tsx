"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { MailX } from "lucide-react";

import { unsubscribeNewsletter, type PublicActionState } from "~/app/actions";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { StatusMessage } from "~/components/ui/status-message";

const initialState: PublicActionState = {};

export function UnsubscribeForm() {
  const [state, action] = useActionState(unsubscribeNewsletter, initialState);

  return (
    <form action={action} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="unsubscribe-email">אימייל להסרה</Label>
        <Input
          dir="ltr"
          id="unsubscribe-email"
          name="email"
          placeholder="name@example.com"
          required
          type="email"
        />
      </div>
      {state.message ? (
        <StatusMessage tone={state.ok ? "success" : "error"} variant="plain">
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
    <Button className="w-fit gap-2" disabled={pending} type="submit">
      <MailX className="size-4" />
      {pending ? "מסיר..." : "הסרה מדיוור"}
    </Button>
  );
}
