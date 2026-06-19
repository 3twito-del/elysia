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
import { newsletterConsentText } from "~/lib/legal-content";
import { queueOfflineJsonAction } from "~/lib/pwa-offline";

const initialState: PublicActionState = {};
const newsletterEmailHintId = "newsletter-email-hint";
const newsletterStatusId = "newsletter-status";
const newsletterOfflineStatusId = "newsletter-offline-status";
const defaultHintText = "נשלח רק כשיש השקה, בחירה עונתית או עדכון שכדאי לפתוח.";
const defaultSubmitLabel = "להצטרף";

type NewsletterFormProps = {
  hintText?: string;
  submitLabel?: string;
  variant?: "default" | "footer";
};

export function NewsletterForm({
  hintText = defaultHintText,
  submitLabel = defaultSubmitLabel,
  variant = "default",
}: NewsletterFormProps = {}) {
  const [state, formAction] = useActionState(joinNewsletter, initialState);
  const [offlineState, setOfflineState] = useState<PublicActionState>({});
  const [marketingConsent, setMarketingConsent] = useState(false);
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
    const hasMarketingConsent = formData.get("marketingConsent") === "on";

    if (!hasMarketingConsent) {
      setOfflineState({
        ok: false,
        message: "יש לאשר קבלת דיוור שיווקי כדי להירשם לעדכונים.",
      });
      return;
    }

    void queueOfflineJsonAction("newsletter.join", {
      email,
      marketingConsent: true,
    })
      .then(() => {
        setOfflineState({
          ok: true,
          message: "ההרשמה נשמרה ותישלח כשהחיבור יחזור.",
        });
        form.reset();
        setMarketingConsent(false);
      })
      .catch(() =>
        setOfflineState({
          ok: false,
          message: "לא הצלחנו לשמור את ההרשמה כרגע. בדקו את החיבור ונסו שוב.",
        }),
      );
  }

  return (
    <form
      action={formAction}
      className={
        variant === "footer"
          ? "newsletter-form mt-5 grid gap-2"
          : "newsletter-form mt-6 grid gap-2"
      }
      data-newsletter-variant={variant}
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
        <SubmitButton label={submitLabel} />
      </div>
      <p
        className="newsletter-form-hint text-muted-foreground text-xs leading-5"
        id={newsletterEmailHintId}
      >
        {hintText}
      </p>
      <label className="newsletter-form-consent text-muted-foreground flex items-start gap-2 text-xs leading-5">
        <input
          checked={marketingConsent}
          className="mt-1"
          name="marketingConsent"
          onChange={(event) => setMarketingConsent(event.currentTarget.checked)}
          required
          type="checkbox"
        />
        <span>{newsletterConsentText}</span>
      </label>
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
        <PushOptInButton label="עדכונים במכשיר הזה" marketing />
      ) : null}
    </form>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <Button
      className="newsletter-submit-button gap-2"
      disabled={pending}
      type="submit"
      variant="outline"
    >
      <Mail aria-hidden="true" className="size-4" />
      {label}
    </Button>
  );
}
