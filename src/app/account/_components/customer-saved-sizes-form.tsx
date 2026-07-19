"use client";

import { useRouter } from "next/navigation";
import {
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useFormStatus } from "react-dom";
import { Ruler } from "lucide-react";

import {
  saveCustomerSizeAction,
  syncCustomerSavedSizesAction,
  type AccountActionState,
} from "../actions";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { StatusMessage } from "~/components/ui/status-message";
import {
  formatSavedSize,
  getEarringLabel,
  getSizeKindLabel,
  normalizeSavedSize,
  sizeFitKinds,
  type SizeFitKind,
} from "~/lib/size-fit";
import { getAllSavedSizes, setSavedSize } from "~/lib/size-fit-storage";

type CustomerSavedSizesFormProps = {
  savedSizes: Array<{ kind: string; value: string }>;
};

const sizeOptions = {
  bracelet: ["XS", "S", "M", "L", "16", "18", "20"],
  earring: [
    "mini",
    "stud",
    "classic",
    "drop",
    "small",
    "medium",
    "round",
    "long",
  ],
  necklace: ["38", "40", "42", "45", "50", "55"],
  ring: ["48", "50", "52", "54", "56", "58", "60"],
} satisfies Record<SizeFitKind, string[]>;

const inputHints = {
  bracelet: "S / M / 18",
  earring: "classic",
  necklace: "45",
  ring: "54",
} satisfies Record<SizeFitKind, string>;

export function CustomerSavedSizesForm({
  savedSizes,
}: CustomerSavedSizesFormProps) {
  const router = useRouter();
  const initialSizes = useMemo(() => getInitialSizes(savedSizes), [savedSizes]);
  const [syncState, setSyncState] = useState<AccountActionState>({});
  const syncedSignatureRef = useRef<string | null>(null);

  useEffect(() => {
    const localSizes = getAllSavedSizes();
    const missingLocalSizes = sizeFitKinds.flatMap((kind) => {
      if (initialSizes[kind]) return [];

      const value = localSizes[kind];

      return value ? [{ kind, value }] : [];
    });

    for (const [kind, value] of Object.entries(initialSizes)) {
      setSavedSize(kind as SizeFitKind, value);
    }

    if (missingLocalSizes.length === 0) return;

    const signature = JSON.stringify(missingLocalSizes);

    if (syncedSignatureRef.current === signature) return;

    syncedSignatureRef.current = signature;
    let active = true;

    void syncCustomerSavedSizesAction(missingLocalSizes)
      .then((result) => {
        if (!active) return;

        setSyncState(result);
        if (result.ok) router.refresh();
      })
      .catch(() => {
        if (active) {
          setSyncState({
            ok: false,
            message: "לא ניתן לסנכרן מידות מקומיות כרגע.",
          });
        }
      });

    return () => {
      active = false;
    };
  }, [initialSizes, router]);

  return (
    <div className="grid gap-3" data-testid="account-saved-sizes-form">
      {syncState.message ? (
        <StatusMessage
          tone={syncState.ok === false ? "error" : "success"}
          variant="plain"
        >
          {syncState.message}
        </StatusMessage>
      ) : null}
      {sizeFitKinds.map((kind) => (
        <SavedSizeRow
          initialValue={initialSizes[kind] ?? ""}
          key={`${kind}:${initialSizes[kind] ?? ""}`}
          kind={kind}
        />
      ))}
    </div>
  );
}

function SavedSizeRow({
  initialValue,
  kind,
}: {
  initialValue: string;
  kind: SizeFitKind;
}) {
  const [state, action] = useActionState<AccountActionState, FormData>(
    saveCustomerSizeAction,
    {},
  );
  const inputId = `saved-size-${kind}`;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    const rawValue = formData.get("value");
    const value = typeof rawValue === "string" ? rawValue : "";

    setSavedSize(kind, value);
  }

  return (
    <form
      action={action}
      className="grid gap-3 border-b border-[var(--glass-border)] pb-4 last:border-b-0 last:pb-0"
      onSubmit={handleSubmit}
    >
      <input name="kind" type="hidden" value={kind} />
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div className="grid gap-2">
          <Label htmlFor={inputId} required>
            {getSizeKindLabel(kind)}
          </Label>
          <Input
            aria-describedby={`${inputId}-hint ${inputId}-error`}
            aria-invalid={Boolean(state.fieldErrors?.value)}
            defaultValue={initialValue}
            id={inputId}
            list={`${inputId}-options`}
            maxLength={40}
            name="value"
            placeholder={inputHints[kind]}
            required
          />
          <datalist id={`${inputId}-options`}>
            {sizeOptions[kind].map((option) => (
              <option key={option} value={option}>
                {kind === "earring" ? getEarringLabel(option) : option}
              </option>
            ))}
          </datalist>
          <p
            className="text-muted-foreground min-h-5 text-xs leading-5"
            id={`${inputId}-hint`}
          >
            {initialValue
              ? `שמורה כעת: ${formatSavedSize(kind, initialValue)}`
              : "עדיין לא נשמרה מידה."}
          </p>
          <p
            className="text-destructive min-h-5 text-xs leading-5"
            id={`${inputId}-error`}
          >
            {state.fieldErrors?.value ?? ""}
          </p>
        </div>
        <SubmitButton />
      </div>
      {state.message ? (
        <StatusMessage tone={state.ok ? "success" : "error"} variant="plain">
          {state.message}
        </StatusMessage>
      ) : null}
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button className="gap-2" disabled={pending} type="submit">
      <Ruler aria-hidden="true" className="size-4" />
      שמירה
    </Button>
  );
}

function getInitialSizes(savedSizes: Array<{ kind: string; value: string }>) {
  return Object.fromEntries(
    savedSizes.flatMap((size) => {
      if (!isSizeFitKind(size.kind)) return [];

      const normalized = normalizeSavedSize(size.kind, size.value);

      return normalized ? [[size.kind, normalized] as const] : [];
    }),
  ) as Partial<Record<SizeFitKind, string>>;
}

function isSizeFitKind(value: string): value is SizeFitKind {
  return (sizeFitKinds as readonly string[]).includes(value);
}
