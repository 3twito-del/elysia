"use client";

import { useState, type FormEvent } from "react";
import { CalendarPlus } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import type { CatalogBranch } from "~/server/services/catalog";
import { api } from "~/trpc/react";

export function AppointmentBookingForm({
  branches,
}: {
  branches: CatalogBranch[];
}) {
  const [message, setMessage] = useState<string | null>(null);
  const createAppointment = api.appointments.create.useMutation({
    onSuccess: (result) => {
      setMessage(`הבקשה נקלטה בסניף ${result.branch.name}.`);
    },
    onError: (error) => {
      setMessage(error.message);
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const startsAt = getFormString(form, "startsAt");

    createAppointment.mutate({
      branchSlug: getFormString(form, "branchSlug"),
      topic: getFormString(form, "topic"),
      name: getFormString(form, "name"),
      email: getFormString(form, "email") || undefined,
      phone: getFormString(form, "phone"),
      startsAt: new Date(startsAt).toISOString(),
      notes: getFormString(form, "notes") || undefined,
    });
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="appointment-branch">סניף</Label>
          <select
            className="glass-control h-10 rounded-md border px-3 text-sm"
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
        </div>
        <div className="grid gap-2">
          <Label htmlFor="appointment-topic">נושא</Label>
          <Input
            id="appointment-topic"
            name="topic"
            placeholder="מדידת טבעת, מתנה, כלה"
            required
          />
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <Input name="name" placeholder="שם מלא" required />
        <Input name="phone" placeholder="טלפון" required />
        <Input name="email" placeholder="אימייל" type="email" />
      </div>
      <Input name="startsAt" required type="datetime-local" />
      <Textarea name="notes" placeholder="הערות לצוות הסניף" />
      {message ? (
        <p className="text-muted-foreground text-sm">{message}</p>
      ) : null}
      <Button className="w-fit gap-2" disabled={createAppointment.isPending}>
        <CalendarPlus className="size-4" />
        תיאום פגישה
      </Button>
    </form>
  );
}

function getFormString(form: FormData, key: string) {
  const value = form.get(key);

  return typeof value === "string" ? value : "";
}
