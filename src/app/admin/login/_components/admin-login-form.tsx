"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { LockKeyhole } from "lucide-react";

import { adminLoginAction, type AdminLoginState } from "../../actions";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { StatusMessage } from "~/components/ui/status-message";

const initialState: AdminLoginState = {};

type AdminLoginFormProps = {
  next: string;
};

export function AdminLoginForm({ next }: AdminLoginFormProps) {
  const [state, formAction] = useActionState(adminLoginAction, initialState);

  return (
    <form action={formAction} className="grid gap-5">
      <input name="next" type="hidden" value={next} />
      <div className="grid gap-2">
        <Label htmlFor="email">אימייל אדמין</Label>
        <Input
          autoComplete="email"
          dir="ltr"
          id="email"
          name="email"
          placeholder="admin@aphrodite.local"
          required
          type="email"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">סיסמה</Label>
        <Input
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
        <StatusMessage tone="error">{state.message}</StatusMessage>
      ) : null}
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button className="w-full gap-2" disabled={pending} size="lg" type="submit">
      <LockKeyhole className="size-4" />
      {pending ? "בודק הרשאה..." : "כניסה לאדמין"}
    </Button>
  );
}
