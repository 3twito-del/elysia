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
  serviceContactPreferences,
  getServiceRequestAttachmentPolicy,
  getServiceContactPreferenceLabel,
} from "~/lib/service-validation";

type ServiceRequestFormProps = {
  defaultMessage?: string;
  defaultOrderNumber?: string;
  defaultProductReference?: string;
  defaultTopicSlug?: string;
  serviceEmail: string;
  topics: Array<{
    description?: string | null;
    label: string;
    slug: string;
  }>;
};

const initialState: ServiceRequestActionState = {};
const attachmentPolicy = getServiceRequestAttachmentPolicy();
const attachmentGuidanceId = "service-attachment-guidance";
const attachmentOfflineGuidanceId = "service-attachment-offline-guidance";
const topicGuidanceId = "service-topic-guidance";
const serviceFieldFocusOrder = [
  "topicSlug",
  "name",
  "phone",
  "email",
  "orderNumber",
  "productReference",
  "preferredContactTime",
  "message",
] as const;

function getFieldErrorId(name: string) {
  return `${name}-error`;
}

export function ServiceRequestForm({
  defaultMessage,
  defaultOrderNumber,
  defaultProductReference,
  defaultTopicSlug,
  serviceEmail,
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
  const initialSelectedTopic = topics.some(
    (topic) => topic.slug === defaultTopicSlug,
  )
    ? defaultTopicSlug
    : (topics[0]?.slug ?? "");
  const [selectedTopicSlug, setSelectedTopicSlug] =
    useState(initialSelectedTopic);
  const [selectedAttachmentCount, setSelectedAttachmentCount] = useState(0);
  const selectedTopic = topics.find(
    (topic) => topic.slug === selectedTopicSlug,
  );
  const selectedTopicDescription = selectedTopic?.description;
  const serviceReferenceMailto = state.requestReference
    ? `mailto:${serviceEmail}?subject=${encodeURIComponent(
        `עדכון לפנייה ${state.requestReference}`,
      )}`
    : `mailto:${serviceEmail}`;
  const selectedTopicLabel = selectedTopic?.label ?? "נושא כללי";

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      const resetFrame = window.requestAnimationFrame(() => {
        setSelectedAttachmentCount(0);
      });

      return () => window.cancelAnimationFrame(resetFrame);
    }

    const firstInvalidField = serviceFieldFocusOrder.find((field) =>
      Boolean(state.fieldErrors?.[field]),
    );

    if (firstInvalidField) {
      window.requestAnimationFrame(() => {
        const field = formRef.current?.elements.namedItem(firstInvalidField);

        if (field instanceof HTMLElement) {
          field.focus();
        }
      });
    }
  }, [state.fieldErrors, state.ok]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (navigator.onLine) return;

    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    void queueOfflineServiceRequest(formData)
      .then(() => {
        setOfflineState({
          ok: true,
          message:
            "הפנייה נשמרה ותישלח אוטומטית כשהחיבור יחזור. לאחר השליחה נחזור אליכם לפי דרך הקשר שבחרתם.",
        });
        form.reset();
        setSelectedAttachmentCount(0);
      })
      .catch(() =>
        setOfflineState({
          ok: false,
          message:
            "לא הצלחנו לשמור את הפנייה במצב לא מקוון. השאירו את הקבצים אצלכם ונסו שוב כשיש חיבור.",
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
        <FieldError
          id={getFieldErrorId("topicSlug")}
          message={state.fieldErrors?.topicSlug}
        />
        <select
          aria-describedby={`${getFieldErrorId("topicSlug")} ${topicGuidanceId}`}
          aria-invalid={Boolean(state.fieldErrors?.topicSlug)}
          autoComplete="off"
          className="glass-control h-11 rounded-md border px-3 text-sm"
          defaultValue={initialSelectedTopic}
          disabled={pending}
          id="topicSlug"
          name="topicSlug"
          onChange={(event) => setSelectedTopicSlug(event.target.value)}
          required
        >
          {topics.map((topic) => (
            <option key={topic.slug} value={topic.slug}>
              {topic.label}
            </option>
          ))}
        </select>
        <p
          aria-live="polite"
          className="text-muted-foreground text-xs leading-5"
          data-testid="service-topic-guidance"
          id={topicGuidanceId}
        >
          {selectedTopicDescription ??
            "בחרו את הנושא הקרוב ביותר כדי שנכוון את הפנייה לצוות המתאים."}
        </p>
        <div
          className="glass-inset rounded-md border p-3 text-xs leading-5"
          data-testid="service-topic-routing-review"
        >
          <p className="font-medium">ניתוב הפנייה</p>
          <p className="text-muted-foreground mt-1">
            הפנייה תישלח לפי הנושא {selectedTopicLabel} ותטופל דרך ערוץ השירות
            שבחרתם.
          </p>
        </div>
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
          defaultValue={defaultOrderNumber}
          error={state.fieldErrors?.orderNumber}
          label="מספר הזמנה"
          name="orderNumber"
          pending={pending}
          placeholder="אופציונלי"
        />
        <Field
          defaultValue={defaultProductReference}
          error={state.fieldErrors?.productReference}
          label="שם השם התכשיט או קישור"
          name="productReference"
          pending={pending}
          placeholder="שם תכשיט, מק״ט או קישור"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="preferredContact">דרך חזרה מועדפת</Label>
          <select
            autoComplete="off"
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
        <Label htmlFor="message">תיאור הפנייה</Label>
        <FieldError
          id={getFieldErrorId("message")}
          message={state.fieldErrors?.message}
        />
        <Textarea
          aria-describedby={getFieldErrorId("message")}
          aria-invalid={Boolean(state.fieldErrors?.message)}
          className="min-h-32"
          defaultValue={defaultMessage}
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
          קבצים מצורפים
        </Label>
        <Input
          aria-describedby={`${attachmentGuidanceId} ${attachmentOfflineGuidanceId}`}
          accept={attachmentPolicy.acceptedFileTypes.join(",")}
          disabled={pending}
          id="attachments"
          multiple
          name="attachments"
          onChange={(event) =>
            setSelectedAttachmentCount(event.currentTarget.files?.length ?? 0)
          }
          type="file"
        />
        <div
          className="glass-inset rounded-md border p-3 text-xs leading-5"
          data-testid="service-attachment-review"
        >
          <p className="font-medium">סקירת קבצים לפני שליחה</p>
          <p className="text-muted-foreground mt-1">
            {selectedAttachmentCount > 0
              ? `${selectedAttachmentCount} קבצים נבחרו לצירוף.`
              : "לא נבחרו קבצים לצירוף."}{" "}
            המגבלות נשארות עד {attachmentPolicy.maxFiles} קבצים ועד{" "}
            {attachmentPolicy.maxFileSizeMb}MB לקובץ.
          </p>
        </div>
        <p
          className="text-muted-foreground text-xs leading-5"
          id={attachmentGuidanceId}
        >
          ניתן לצרף עד {attachmentPolicy.maxFiles} קבצים, עד{" "}
          {attachmentPolicy.maxFileSizeMb}MB לקובץ. סוגי קבצים נתמכים:{" "}
          {attachmentPolicy.acceptedFileTypeLabel}.
        </p>
        <p
          className="text-muted-foreground text-xs leading-5"
          id={attachmentOfflineGuidanceId}
        >
          אם אין חיבור, הפנייה והקבצים יישמרו במכשיר ויישלחו אוטומטית כשהחיבור
          יחזור. אם שמירה לא הצליחה, השאירו את הקבצים אצלכם ונסו שוב.
        </p>
      </div>

      {state.message ? (
        <StatusMessage tone={state.ok ? "success" : "error"}>
          {state.message}
        </StatusMessage>
      ) : null}
      {state.ok && state.requestReference ? (
        <div
          className="glass-inset grid gap-2 rounded-md border p-3 text-sm leading-6"
          data-testid="service-request-success-reference"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-muted-foreground">מספר פנייה</span>
            <strong className="font-mono text-base tracking-normal">
              {state.requestReference}
            </strong>
          </div>
          <p className="text-muted-foreground">
            שמרו את המספר לעדכון עתידי. הצוות יבדוק את הפרטים, הקבצים וההקשר של
            המוצר או ההזמנה לפני חזרה אליכם.
          </p>
          <a
            className="w-fit text-sm font-medium underline underline-offset-4"
            data-testid="service-request-success-contact-link"
            href={serviceReferenceMailto}
          >
            עדכון נוסף באימייל השירות
          </a>
        </div>
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
        שליחה
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
  "aria-describedby": ariaDescribedBy,
  ...props
}: {
  error?: string;
  label: string;
  name: string;
  pending: boolean;
} & Omit<ComponentProps<typeof Input>, "disabled" | "id" | "name">) {
  const errorId = getFieldErrorId(name);
  const describedBy = [ariaDescribedBy, errorId].filter(Boolean).join(" ");

  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <FieldError id={errorId} message={error} />
      <Input
        aria-describedby={describedBy}
        aria-invalid={Boolean(error)}
        disabled={pending}
        id={name}
        name={name}
        {...props}
      />
    </div>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  return (
    <p
      className="text-destructive min-h-5 text-xs leading-5"
      id={id}
      role={message ? "alert" : undefined}
    >
      {message}
    </p>
  );
}
