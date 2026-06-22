"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { usePathname } from "next/navigation";
import { MessageSquarePlus } from "lucide-react";

import { submitFeedback, type PublicActionState } from "~/app/actions";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { StatusMessage } from "~/components/ui/status-message";
import { Textarea } from "~/components/ui/textarea";

const feedbackMessageHintId = "feedback-message-hint";
const feedbackStatusId = "feedback-status";

export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) setFormKey((k) => k + 1);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          aria-label="שליחת פידבק"
          className="fixed end-6 bottom-6 z-50 gap-2 shadow-md"
          size="sm"
          variant="outline"
        >
          <MessageSquarePlus aria-hidden="true" className="size-4" />
          <span>פידבק</span>
        </Button>
      </DialogTrigger>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>שליחת פידבק</DialogTitle>
          <DialogDescription>מה עלינו לשפר? כל הערה עוזרת.</DialogDescription>
        </DialogHeader>
        <FeedbackForm key={formKey} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

const initialState: PublicActionState = {};

function FeedbackForm({ onDone }: { onDone: () => void }) {
  const pathname = usePathname();
  const [state, formAction] = useActionState(submitFeedback, initialState);
  const messageRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (state.ok === false) {
      messageRef.current?.focus();
    }
  }, [state.ok, state.message]);

  if (state.ok) {
    return (
      <>
        <StatusMessage tone="success" variant="inset">
          {state.message}
        </StatusMessage>
        <DialogFooter>
          <Button onClick={onDone} variant="outline">
            סגירה
          </Button>
        </DialogFooter>
      </>
    );
  }

  return (
    <form action={formAction} className="grid gap-4">
      <input name="url" type="hidden" value={pathname} />
      <div className="grid gap-2">
        <Label htmlFor="feedback-message">הודעה</Label>
        <Textarea
          aria-describedby={`${feedbackMessageHintId}${state.message ? ` ${feedbackStatusId}` : ""}`}
          aria-invalid={state.ok === false}
          id="feedback-message"
          maxLength={1000}
          name="message"
          placeholder="ספרו לנו מה עלינו לשפר..."
          ref={messageRef}
          required
          rows={4}
        />
        <p className="text-muted-foreground text-xs" id={feedbackMessageHintId}>
          עד 1000 תווים
        </p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="feedback-email">
          אימייל{" "}
          <span className="text-muted-foreground font-normal">(אופציונלי)</span>
        </Label>
        <Input
          autoComplete="email"
          dir="ltr"
          id="feedback-email"
          name="email"
          placeholder="name@example.com"
          type="email"
        />
      </div>
      {state.message ? (
        <StatusMessage
          id={feedbackStatusId}
          size="xs"
          tone="error"
          variant="plain"
        >
          {state.message}
        </StatusMessage>
      ) : null}
      <DialogFooter>
        <SubmitButton />
      </DialogFooter>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button disabled={pending} type="submit">
      {pending ? "שולח..." : "שליחה"}
    </Button>
  );
}
