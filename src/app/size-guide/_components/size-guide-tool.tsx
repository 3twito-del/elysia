"use client";

import {
  useActionState,
  useEffect,
  useId,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { Ruler, Save } from "lucide-react";

import {
  saveCustomerSizeAction,
  type AccountActionState,
} from "~/app/account/actions";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { StatusMessage } from "~/components/ui/status-message";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  formatSavedSize,
  getEarringLabel,
  getSizeKindLabel,
  normalizeSavedSize,
  sizeFitKinds,
  type SizeFitKind,
} from "~/lib/size-fit";
import {
  getSavedSize,
  setSavedSize,
  subscribeToSavedSizeUpdates,
} from "~/lib/size-fit-storage";

type SizeGuideToolProps = {
  initialKind: SizeFitKind;
};

const defaultManualValues = {
  bracelet: "18",
  earring: "classic",
  necklace: "45",
  ring: "54",
} satisfies Record<SizeFitKind, string>;

const earringOptions = [
  "mini",
  "stud",
  "classic",
  "drop",
  "small",
  "medium",
  "round",
  "long",
] as const;

const referenceCardWidthMm = 85.6;

export function SizeGuideTool({ initialKind }: SizeGuideToolProps) {
  const [activeKind, setActiveKind] = useState<SizeFitKind>(initialKind);
  const [manualValue, setManualValue] = useState(
    defaultManualValues[initialKind],
  );
  const [referencePx, setReferencePx] = useState(220);
  const [measurementPx, setMeasurementPx] = useState(
    getDefaultMeasurementPx(initialKind, 220),
  );
  const [localMessage, setLocalMessage] = useState<string | null>(null);
  const [state, action] = useActionState<AccountActionState, FormData>(
    saveCustomerSizeAction,
    {},
  );
  const calibratedValue = useMemo(
    () => getCalibratedValue(activeKind, referencePx, measurementPx),
    [activeKind, measurementPx, referencePx],
  );
  const normalizedManualValue = normalizeSavedSize(activeKind, manualValue);

  useEffect(() => {
    const syncSavedValue = () => {
      setManualValue(
        getSavedSize(activeKind) ?? defaultManualValues[activeKind],
      );
      setMeasurementPx(getDefaultMeasurementPx(activeKind, referencePx));
      setLocalMessage(null);
    };

    syncSavedValue();
    return subscribeToSavedSizeUpdates(syncSavedValue);
  }, [activeKind, referencePx]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const normalized = setSavedSize(activeKind, manualValue);

    if (!normalized) {
      event.preventDefault();
      setLocalMessage("המידה שנבחרה אינה נתמכת.");
      return;
    }

    setLocalMessage(`נשמר במכשיר: ${formatSavedSize(activeKind, normalized)}`);
  }

  return (
    <Card className="rounded-md" data-testid="size-guide-tool">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ruler aria-hidden="true" className="size-5" />
          התאמת מידה
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs
          className="gap-5"
          dir="rtl"
          onValueChange={(value) => setActiveKind(value as SizeFitKind)}
          value={activeKind}
        >
          <TabsList className="w-full flex-wrap justify-start">
            {sizeFitKinds.map((kind) => (
              <TabsTrigger key={kind} value={kind}>
                {getSizeKindLabel(kind)}
              </TabsTrigger>
            ))}
          </TabsList>

          {sizeFitKinds.map((kind) => (
            <TabsContent className="mt-0" key={kind} value={kind}>
              <form
                action={action}
                className="grid gap-5"
                onSubmit={handleSubmit}
              >
                <input name="kind" type="hidden" value={activeKind} />
                <input name="value" type="hidden" value={manualValue} />

                <div className="grid gap-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
                  <section className="glass-inset grid gap-3 rounded-md border p-4">
                    <div className="grid gap-2">
                      <Label htmlFor={`size-guide-${kind}`}>
                        בחירת מידה שמורה
                      </Label>
                      {kind === "earring" ? (
                        <div className="flex flex-wrap gap-2">
                          {earringOptions.map((option) => (
                            <Button
                              aria-pressed={manualValue === option}
                              className={
                                manualValue === option
                                  ? "bg-foreground text-background hover:bg-foreground/90 hover:text-background"
                                  : undefined
                              }
                              key={option}
                              onClick={() => setManualValue(option)}
                              type="button"
                              variant="outline"
                            >
                              {getEarringLabel(option)}
                            </Button>
                          ))}
                        </div>
                      ) : (
                        <Input
                          aria-describedby={`size-guide-${kind}-summary`}
                          id={`size-guide-${kind}`}
                          inputMode="decimal"
                          maxLength={40}
                          onChange={(event) =>
                            setManualValue(event.currentTarget.value)
                          }
                          value={manualValue}
                        />
                      )}
                    </div>

                    <div
                      className="text-muted-foreground min-h-12 text-sm leading-6"
                      id={`size-guide-${kind}-summary`}
                    >
                      {normalizedManualValue
                        ? `תישמר כ-${formatSavedSize(kind, normalizedManualValue)}`
                        : "המידה עדיין לא תקינה לשמירה."}
                    </div>
                    <Button className="w-fit gap-2" type="submit">
                      <Save aria-hidden="true" className="size-4" />
                      שמירת מידה
                    </Button>
                  </section>

                  <section className="glass-inset grid gap-4 rounded-md border p-4">
                    {kind === "earring" ? (
                      <div className="grid gap-3">
                        <p className="text-sm font-medium">העדפת עגילים</p>
                        <p className="text-muted-foreground text-sm leading-6">
                          לעגילים נשמרת העדפת גודל או סגנון, ומשתמשים בה מול
                          וריאנטים קיימים בקטלוג.
                        </p>
                      </div>
                    ) : (
                      <>
                        <RangeField
                          label="רוחב כרטיס ייחוס"
                          max={340}
                          min={160}
                          onChange={setReferencePx}
                          unit="px"
                          value={referencePx}
                        />
                        <RangeField
                          label="קו מדידה"
                          max={getMeasurementMax(kind)}
                          min={40}
                          onChange={setMeasurementPx}
                          unit="px"
                          value={measurementPx}
                        />
                        <div className="bg-background rounded-md border p-3">
                          <div
                            aria-hidden="true"
                            className="bg-foreground h-1 rounded-full"
                            style={{
                              width: `${Math.min(
                                100,
                                (measurementPx / getMeasurementMax(kind)) * 100,
                              )}%`,
                            }}
                          />
                          <p className="mt-3 text-sm font-medium">
                            {calibratedValue
                              ? formatSavedSize(kind, calibratedValue)
                              : "אין מידה מחושבת"}
                          </p>
                        </div>
                        <Button
                          disabled={!calibratedValue}
                          onClick={() => {
                            if (calibratedValue)
                              setManualValue(calibratedValue);
                          }}
                          type="button"
                          variant="outline"
                        >
                          שימוש במידה המחושבת
                        </Button>
                      </>
                    )}
                  </section>
                </div>

                {localMessage ? (
                  <StatusMessage tone="success" variant="plain">
                    {localMessage}
                  </StatusMessage>
                ) : null}
                {state.message ? (
                  <StatusMessage
                    tone={state.ok ? "success" : "error"}
                    variant="plain"
                  >
                    {state.message}
                  </StatusMessage>
                ) : null}
              </form>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}

function RangeField({
  label,
  max,
  min,
  onChange,
  unit,
  value,
}: {
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  unit: string;
  value: number;
}) {
  const inputId = useId();

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={inputId}>{label}</Label>
        <span className="text-muted-foreground text-xs">
          {value}
          {unit}
        </span>
      </div>
      <input
        className="accent-foreground h-8 w-full"
        id={inputId}
        max={max}
        min={min}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
        type="range"
        value={value}
      />
    </div>
  );
}

function getDefaultMeasurementPx(kind: SizeFitKind, referencePx: number) {
  if (kind === "ring")
    return Math.round((54 / Math.PI / referenceCardWidthMm) * referencePx);
  if (kind === "bracelet")
    return Math.round((18 * 10 * referencePx) / referenceCardWidthMm);
  if (kind === "necklace")
    return Math.round((45 * 10 * referencePx) / referenceCardWidthMm);

  return 0;
}

function getMeasurementMax(kind: SizeFitKind) {
  if (kind === "ring") return 260;
  if (kind === "bracelet") return 760;
  if (kind === "necklace") return 1600;

  return 100;
}

function getCalibratedValue(
  kind: SizeFitKind,
  referencePx: number,
  measurementPx: number,
) {
  if (kind === "earring") return null;

  const measurementMm = (measurementPx / referencePx) * referenceCardWidthMm;
  const rawValue =
    kind === "ring"
      ? String(Math.round(measurementMm * Math.PI))
      : String(Math.round(measurementMm / 10));

  return normalizeSavedSize(kind, rawValue);
}
