"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Mail } from "lucide-react";

import { joinNewsletter, type PublicActionState } from "~/app/actions";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

const initialState: PublicActionState = {};

export function NewsletterForm() {
  const [state, formAction] = useActionState(joinNewsletter, initialState);

  return (
    <form action={formAction} className="mt-6 grid gap-2">
      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <Input
          aria-label="אימייל להרשמה לעדכונים"
          dir="ltr"
          name="email"
          placeholder="name@example.com"
          required
          type="email"
        />
        <SubmitButton />
      </div>
      {state.message ? (
        <p
          className={`text-xs ${state.ok ? "text-emerald-700" : "text-red-700"}`}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button className="gap-2" disabled={pending} type="submit">
      <Mail className="size-4" />
      {pending ? "שומר..." : "הרשמה"}
    </Button>
  );
}
