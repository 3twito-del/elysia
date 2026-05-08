"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Mail } from "lucide-react";

import { joinNewsletter, type PublicActionState } from "~/app/actions";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { StatusMessage } from "~/components/ui/status-message";

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
      <label className="text-muted-foreground flex items-start gap-2 text-xs leading-5">
        <input
          className="mt-1"
          name="marketingConsent"
          required
          type="checkbox"
          value="yes"
        />
        <span>
          אני מסכימ/ה לקבל מ-Aphrodite עדכונים, הטבות ודברי פרסומת בדוא״ל. ניתן
          להסיר בכל הודעה.
        </span>
      </label>
      <p className="text-muted-foreground text-xs leading-5">
        ניתן להסיר גם דרך{" "}
        <Link
          className="text-foreground underline underline-offset-4"
          href="/newsletter/unsubscribe"
        >
          הסרה מדיוור
        </Link>
        .
      </p>
      {state.message ? (
        <StatusMessage
          size="xs"
          tone={state.ok ? "success" : "error"}
          variant="plain"
        >
          {state.message}
        </StatusMessage>
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
