"use client";

import { useState, type FormEvent } from "react";
import { CalendarPlus } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { StatusMessage } from "~/components/ui/status-message";
import { Textarea } from "~/components/ui/textarea";
import { createAppointmentInputSchema } from "~/lib/appointment-validation";
import {
  getFirstZodIssueMessage,
  getZodFieldErrors,
  type FormFieldErrors,
} from "~/lib/form-validation";
import type { CatalogBranch } from "~/server/services/catalog";
import { api } from "~/trpc/react";

export function AppointmentBookingForm({
  branches,
}: {
  branches: CatalogBranch[];
}) {
  const [fieldErrors, setFieldErrors] = useState<FormFieldErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"error" | "success">(
    "success",
  );
  const createAppointment = api.appointments.create.useMutation({
    onSuccess: (result) => {
      setFieldErrors({});
      setMessageTone("success");
      setMessage(`הבקשה נקלטה בסניף ${result.branch.name}.`);
    },
    onError: (error) => {
      setMessageTone("error");
      setMessage(error.message);
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = createAppointmentInputSchema.safeParse({
      branchSlug: getFormString(form, "branchSlug"),
      topic: getFormString(form, "topic"),
      name: getFormString(form, "name"),
      email: getOptionalFormString(form, "email"),
      phone: getFormString(form, "phone"),
      startsAt: toIsoDateTime(getFormString(form, "startsAt")),
      notes: getOptionalFormString(form, "notes"),
    });

    if (!parsed.success) {
      setFieldErrors(getZodFieldErrors(parsed.error));
      setMessageTone("error");
      setMessage(getFirstZodIssueMessage(parsed.error));
      return;
    }

    setFieldErrors({});
    setMessage(null);
    createAppointment.mutate(parsed.data);
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="appointment-branch">סניף</Label>
          <select
            aria-invalid={Boolean(fieldErrors.branchSlug)}
            className="glass-control h-10 rounded-md border px-3 text-sm"
            disabled={createAppointment.isPending}
            id="appointment-branch"
            name="branchSlug"
            required
          >
            {branches.map((branch) => (
              <option key={branch.slug} value={branch.slug}>
                {branch.name}
              </option>
            ))}
          </select>
          <FieldError message={fieldErrors.branchSlug} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="appointment-topic">נושא</Label>
          <Input
            aria-invalid={Boolean(fieldErrors.topic)}
            disabled={createAppointment.isPending}
            id="appointment-topic"
            name="topic"
            placeholder="מדידת טבעת, מתנה, כלה"
            required
          />
          <FieldError message={fieldErrors.topic} />
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <div className="grid gap-2">
          <Input
            aria-invalid={Boolean(fieldErrors.name)}
            disabled={createAppointment.isPending}
            name="name"
            placeholder="שם מלא"
            required
          />
          <FieldError message={fieldErrors.name} />
        </div>
        <div className="grid gap-2">
          <Input
            aria-invalid={Boolean(fieldErrors.phone)}
            disabled={createAppointment.isPending}
            name="phone"
            placeholder="טלפון"
            required
          />
          <FieldError message={fieldErrors.phone} />
        </div>
        <div className="grid gap-2">
          <Input
            aria-invalid={Boolean(fieldErrors.email)}
            disabled={createAppointment.isPending}
            name="email"
            placeholder="אימייל"
            type="email"
          />
          <FieldError message={fieldErrors.email} />
        </div>
      </div>
      <div className="grid gap-2">
        <Input
          aria-invalid={Boolean(fieldErrors.startsAt)}
          disabled={createAppointment.isPending}
          name="startsAt"
          required
          type="datetime-local"
        />
        <FieldError message={fieldErrors.startsAt} />
      </div>
      <div className="grid gap-2">
        <Textarea
          aria-invalid={Boolean(fieldErrors.notes)}
          disabled={createAppointment.isPending}
          name="notes"
          placeholder="הערות לצוות הסניף"
        />
        <FieldError message={fieldErrors.notes} />
      </div>
      {message ? (
        <StatusMessage tone={messageTone} variant="plain">
          {message}
        </StatusMessage>
      ) : null}
      <Button
        className="w-fit gap-2"
        disabled={createAppointment.isPending}
        type="submit"
      >
        <CalendarPlus className="size-4" />
        {createAppointment.isPending ? "שולח..." : "תיאום פגישה"}
      </Button>
    </form>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;

  return <p className="text-destructive text-xs">{message}</p>;
}

function getFormString(form: FormData, key: string) {
  const value = form.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function getOptionalFormString(form: FormData, key: string) {
  const value = getFormString(form, key);

  return value.length > 0 ? value : undefined;
}

function toIsoDateTime(value: string) {
  const date = new Date(value);

  return Number.isFinite(date.getTime()) ? date.toISOString() : value;
}
