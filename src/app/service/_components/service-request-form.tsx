"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type FormEvent,
} from "react";
import { Paperclip, Send } from "lucide-react";

import {
  createServiceRequestAction,
  type ServiceRequestActionState,
} from "../actions";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { StatusMessage } from "~/components/ui/status-message";
import { Textarea } from "~/components/ui/textarea";
import { queueOfflineServiceRequest } from "~/lib/pwa-offline";
import {
  maxServiceRequestFileBytes,
  maxServiceRequestFiles,
  serviceContactPreferences,
  serviceRequestAcceptedFileTypes,
  getServiceContactPreferenceLabel,
} from "~/lib/service-validation";

type ServiceRequestFormProps = {
  defaultProductReference?: string;
  topics: Array<{
    description?: string | null;
    label: string;
    slug: string;
  }>;
};

const initialState: ServiceRequestActionState = {};
const maxFileSizeMb = Math.round(maxServiceRequestFileBytes / 1024 / 1024);

export function ServiceRequestForm({
  defaultProductReference,
  topics,
}: ServiceRequestFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    createServiceRequestAction,
    initialState,
  );
  const [offlineState, setOfflineState] = useState<ServiceRequestActionState>(
    {},
  );

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
    }
  }, [state.ok]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (navigator.onLine) return;

    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    void queueOfflineServiceRequest(formData)
      .then(() => {
        setOfflineState({
          ok: true,
          message: "הפנייה נשמרה ותישלח אוטומטית כשהחיבור יחזור.",
        });
        form.reset();
      })
      .catch(() =>
        setOfflineState({
          ok: false,
          message:
            "לא הצלחנו לשמור את הפנייה במצב לא מקוון. השאירו את הקבצים זמינים ונסו שוב כשיש חיבור.",
        }),
      );
  }

  return (
    <form
      action={formAction}
      className="brand-surface grid gap-3.5 rounded-md p-4"
      onSubmit={handleSubmit}
      ref={formRef}
    >
      <div className="grid gap-2">
        <Label htmlFor="topicSlug">נושא הפנייה</Label>
        <FieldError message={state.fieldErrors?.topicSlug} />
        <select
          className="glass-control h-11 rounded-md border px-3 text-sm"
          defaultValue={topics[0]?.slug ?? ""}
          disabled={pending}
          id="topicSlug"
          name="topicSlug"
          required
        >
          {topics.map((topic) => (
            <option key={topic.slug} value={topic.slug}>
              {topic.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          autoComplete="name"
          error={state.fieldErrors?.name}
          label="שם מלא"
          name="name"
          pending={pending}
          required
        />
        <Field
          autoComplete="tel"
          error={state.fieldErrors?.phone}
          label="טלפון"
          name="phone"
          pending={pending}
          placeholder="054-727-7455"
          required
          type="tel"
        />
      </div>

      <Field
        autoComplete="email"
        error={state.fieldErrors?.email}
        label="אימייל"
        name="email"
        pending={pending}
        placeholder="name@example.com"
        required
        type="email"
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          error={state.fieldErrors?.orderNumber}
          label="מספר הזמנה"
          name="orderNumber"
          pending={pending}
          placeholder="אופציונלי"
        />
        <Field
          defaultValue={defaultProductReference}
          error={state.fieldErrors?.productReference}
          label="מוצר או קישור"
          name="productReference"
          pending={pending}
          placeholder="שם מוצר, מק״ט או קישור"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="preferredContact">דרך חזרה מועדפת</Label>
          <select
            className="glass-control h-11 rounded-md border px-3 text-sm"
            defaultValue="ANY"
            disabled={pending}
            id="preferredContact"
            name="preferredContact"
          >
            {serviceContactPreferences.map((preference) => (
              <option key={preference} value={preference}>
                {getServiceContactPreferenceLabel(preference)}
              </option>
            ))}
          </select>
        </div>
        <Field
          error={state.fieldErrors?.preferredContactTime}
          label="זמן נוח לחזרה"
          name="preferredContactTime"
          pending={pending}
          placeholder="לדוגמה: היום אחרי 16:00"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="message">מה נוכל לבדוק?</Label>
        <FieldError message={state.fieldErrors?.message} />
        <Textarea
          className="min-h-32"
          disabled={pending}
          id="message"
          name="message"
          placeholder="כתבו בקצרה את הבקשה, פרטי התכשיט, מצב התיקון או השאלה."
          required
        />
      </div>

      <div className="bg-background grid gap-3 rounded-md border p-3">
        <Label className="flex items-center gap-2" htmlFor="attachments">
          <Paperclip aria-hidden="true" className="size-4" />
          תמונות או PDF
        </Label>
        <Input
          accept={serviceRequestAcceptedFileTypes.join(",")}
          disabled={pending}
          id="attachments"
          multiple
          name="attachments"
          type="file"
        />
        <p className="text-muted-foreground text-xs leading-5">
          ניתן לצרף עד {maxServiceRequestFiles} קבצים, עד {maxFileSizeMb}MB
          לקובץ.
        </p>
      </div>

      {state.message ? (
        <StatusMessage tone={state.ok ? "success" : "error"}>
          {state.message}
        </StatusMessage>
      ) : null}
      {offlineState.message ? (
        <StatusMessage tone={offlineState.ok ? "success" : "error"}>
          {offlineState.message}
        </StatusMessage>
      ) : null}

      <Button
        className="min-h-11 w-full gap-2 sm:w-fit sm:min-w-40"
        disabled={pending}
        type="submit"
      >
        שליחת פנייה
        <Send aria-hidden="true" className="size-4" />
      </Button>
    </form>
  );
}

function Field({
  error,
  label,
  name,
  pending,
  ...props
}: {
  error?: string;
  label: string;
  name: string;
  pending: boolean;
} & Omit<ComponentProps<typeof Input>, "disabled" | "id" | "name">) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <FieldError message={error} />
      <Input
        aria-invalid={Boolean(error)}
        disabled={pending}
        id={name}
        name={name}
        {...props}
      />
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  return (
    <p
      className="text-destructive min-h-5 text-xs leading-5"
      role={message ? "alert" : undefined}
    >
      {message}
    </p>
  );
}
