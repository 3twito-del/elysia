"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useFormStatus } from "react-dom";
import { Mail } from "lucide-react";

import { joinNewsletter, type PublicActionState } from "~/app/actions";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { PushOptInButton } from "~/components/push-opt-in-button";
import { StatusMessage } from "~/components/ui/status-message";
import { queueOfflineJsonAction } from "~/lib/pwa-offline";

const initialState: PublicActionState = {};
const newsletterEmailHintId = "newsletter-email-hint";
const newsletterStatusId = "newsletter-status";
const newsletterOfflineStatusId = "newsletter-offline-status";

export function NewsletterForm() {
  const [state, formAction] = useActionState(joinNewsletter, initialState);
  const [offlineState, setOfflineState] = useState<PublicActionState>({});
  const emailInputRef = useRef<HTMLInputElement>(null);
  const hasNewsletterError = state.ok === false || offlineState.ok === false;
  const newsletterDescription = [
    newsletterEmailHintId,
    state.message ? newsletterStatusId : null,
    offlineState.message ? newsletterOfflineStatusId : null,
  ]
    .filter(Boolean)
    .join(" ");

  useEffect(() => {
    if (hasNewsletterError) {
      emailInputRef.current?.focus();
    }
  }, [hasNewsletterError, state.message, offlineState.message]);

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
          message: "ההרשמה נשמרה במכשיר.",
        });
        form.reset();
      })
      .catch(() =>
        setOfflineState({
          ok: false,
          message: "לא הצלחנו לשלוח. בדקו את החיבור ונסו שוב.",
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
          aria-describedby={newsletterDescription}
          aria-invalid={hasNewsletterError}
          autoComplete="email"
          dir="ltr"
          id="newsletter-email"
          name="email"
          placeholder="name@example.com"
          ref={emailInputRef}
          required
          type="email"
        />
        <SubmitButton />
      </div>
      <p
        className="text-muted-foreground text-xs leading-5"
        id={newsletterEmailHintId}
      >נשלח עדכוני קולקציות בלבד. אם השליחה לא הצליחה, נסו שוב בעוד רגע.</p>
      {state.message ? (
        <StatusMessage
          id={newsletterStatusId}
          size="xs"
          tone={state.ok ? "success" : "error"}
          variant="plain"
        >
          {state.message}
        </StatusMessage>
      ) : null}
      {offlineState.message ? (
        <StatusMessage
          id={newsletterOfflineStatusId}
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
