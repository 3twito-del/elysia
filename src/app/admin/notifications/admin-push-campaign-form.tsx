"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Send } from "lucide-react";

import {
  createPushCampaignAction,
  type AdminPushCampaignState,
} from "./actions";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { StatusMessage } from "~/components/ui/status-message";
import { Textarea } from "~/components/ui/textarea";

const initialState: AdminPushCampaignState = {};

export function AdminPushCampaignForm() {
  const [state, formAction] = useActionState(
    createPushCampaignAction,
    initialState,
  );

  return (
    <form action={formAction} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="title">כותרת</Label>
        <Input id="title" name="title" required maxLength={80} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="body">תוכן</Label>
        <Textarea id="body" name="body" required maxLength={180} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="targetUrl">יעד פנימי</Label>
          <Input
            defaultValue="/search"
            dir="ltr"
            id="targetUrl"
            name="targetUrl"
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="segment">סגמנט</Label>
          <select
            className="glass-control h-10 rounded-md border px-3 text-sm"
            defaultValue="MARKETING_OPT_IN"
            id="segment"
            name="segment"
          >
            <option value="MARKETING_OPT_IN">Marketing opt-in</option>
            <option value="TRANSACTIONAL_OPT_IN">Transactional opt-in</option>
            <option value="ALL_ACTIVE">All active</option>
          </select>
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="scheduledAt">תזמון אופציונלי</Label>
        <Input id="scheduledAt" name="scheduledAt" type="datetime-local" />
      </div>
      <label className="glass-inset flex min-h-11 items-center gap-3 rounded-md border px-3 text-sm">
        <input name="sendNow" type="checkbox" />
        שליחה לעיבוד מיד אחרי יצירת הקמפיין
      </label>
      {state.message ? (
        <StatusMessage tone={state.ok ? "success" : "error"}>
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
      <Send aria-hidden="true" className="size-4" />
      {pending ? "שומר..." : "יצירת קמפיין"}
    </Button>
  );
}
