"use client";

import { useActionState, useState, type FormEvent } from "react";
import { useFormStatus } from "react-dom";
import { Mail } from "lucide-react";

import { joinNewsletter, type PublicActionState } from "~/app/actions";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { PushOptInButton } from "~/components/push-opt-in-button";
import { StatusMessage } from "~/components/ui/status-message";
import { queueOfflineJsonAction } from "~/lib/pwa-offline";

const initialState: PublicActionState = {};

export function NewsletterForm() {
  const [state, formAction] = useActionState(joinNewsletter, initialState);
  const [offlineState, setOfflineState] = useState<PublicActionState>({});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (navigator.onLine) return;

    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const emailValue = formData.get("email");
    const email = typeof emailValue === "string" ? emailValue : "";

    void queueOfflineJsonAction("newsletter.join", { email })
      .then(() => {
        setOfflineState({
          ok: true,
          message: "ההרשמה נשמרה ותסתנכרן כשהחיבור יחזור.",
        });
        form.reset();
      })
      .catch(() =>
        setOfflineState({
          ok: false,
          message: "לא הצלחנו לשמור את ההרשמה במצב לא מקוון.",
        }),
      );
  }

  return (
    <form
      action={formAction}
      className="mt-6 grid gap-2"
      onSubmit={handleSubmit}
    >
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
        <StatusMessage
          size="xs"
          tone={state.ok ? "success" : "error"}
          variant="plain"
        >
          {state.message}
        </StatusMessage>
      ) : null}
      {offlineState.message ? (
        <StatusMessage
          size="xs"
          tone={offlineState.ok ? "success" : "error"}
          variant="plain"
        >
          {offlineState.message}
        </StatusMessage>
      ) : null}
      {state.ok || offlineState.ok ? (
        <PushOptInButton label="עדכוני קולקציות במכשיר הזה" marketing />
      ) : null}
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      className="gap-2"
      disabled={pending}
      type="submit"
      variant="outline"
    >
      <Mail aria-hidden="true" className="size-4" />
      הרשמה
    </Button>
  );
}
