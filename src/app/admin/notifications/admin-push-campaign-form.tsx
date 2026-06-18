"use client";

import { useActionState, useMemo, useState } from "react";
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
import {
  createPushCampaignDryRunPreview,
  type PushCampaignSegment,
} from "~/lib/push-campaign-preview";

const initialState: AdminPushCampaignState = {};

type AdminPushCampaignFormProps = {
  audienceSummary: Record<PushCampaignSegment, number>;
  configured: boolean;
};

export function AdminPushCampaignForm({
  audienceSummary,
  configured,
}: AdminPushCampaignFormProps) {
  const [state, formAction] = useActionState(
    createPushCampaignAction,
    initialState,
  );
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [targetUrl, setTargetUrl] = useState("/search");
  const [segment, setSegment] =
    useState<PushCampaignSegment>("MARKETING_OPT_IN");
  const dryRunPreview = useMemo(
    () =>
      createPushCampaignDryRunPreview({
        audienceCount: audienceSummary[segment] ?? 0,
        body,
        configured,
        segment,
        targetUrl,
        title,
      }),
    [audienceSummary, body, configured, segment, targetUrl, title],
  );

  return (
    <form action={formAction} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="title">כותרת</Label>
        <Input
          id="title"
          maxLength={80}
          name="title"
          onChange={(event) => setTitle(event.currentTarget.value)}
          required
          value={title}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="body">תוכן</Label>
        <Textarea
          id="body"
          maxLength={180}
          name="body"
          onChange={(event) => setBody(event.currentTarget.value)}
          required
          value={body}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="targetUrl">יעד פנימי</Label>
          <Input
            dir="ltr"
            id="targetUrl"
            name="targetUrl"
            onChange={(event) => setTargetUrl(event.currentTarget.value)}
            required
            value={targetUrl}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="segment">סגמנט</Label>
          <select
            autoComplete="off"
            className="glass-control h-10 rounded-md border px-3 text-sm"
            id="segment"
            name="segment"
            onChange={(event) =>
              setSegment(event.currentTarget.value as PushCampaignSegment)
            }
            value={segment}
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
      <div
        className="rounded-md border border-[var(--glass-border)] p-3 text-sm"
        data-testid="admin-push-dry-run-preview"
      >
        <p className="font-medium">תצוגה לפני שליחה</p>
        <dl className="text-muted-foreground mt-2 grid gap-1">
          <div className="flex justify-between gap-4">
            <dt>קהל משוער</dt>
            <dd>{dryRunPreview.audienceCount}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>יעד</dt>
            <dd dir="ltr">{dryRunPreview.payload.targetUrl}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>מצב שליחה</dt>
            <dd>{dryRunPreview.canSend ? "מוכן" : "דורש בדיקה"}</dd>
          </div>
        </dl>
        {dryRunPreview.missingSubscriptionCase ? (
          <p className="text-muted-foreground mt-2 text-xs">
            אין מנויים פעילים שתואמים לסגמנט הזה.
          </p>
        ) : null}
        {dryRunPreview.invalidTargetCase ? (
          <p className="text-muted-foreground mt-2 text-xs">
            יעד ההתראה חייב להישאר בתוך האתר.
          </p>
        ) : null}
      </div>
      <label
        className="glass-inset flex min-h-11 items-center gap-3 rounded-md border px-3 text-sm"
        data-testid="admin-push-send-now-readiness"
      >
        <input disabled={!configured} name="sendNow" type="checkbox" />
        <span>
          שליחה לעיבוד מיד אחרי יצירת הקמפיין
          {!configured ? " (זמין אחרי הגדרת VAPID)" : ""}
        </span>
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
      יצירת קמפיין
    </Button>
  );
}
