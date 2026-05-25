"use client";

import {
  useActionState,
  useEffect,
  useId,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import {
  CheckCircle2,
  Circle,
  Gem,
  Gauge,
  Save,
  ScanLine,
  SlidersHorizontal,
  Sparkles,
  StretchHorizontal,
  type LucideIcon,
} from "lucide-react";

import {
  saveCustomerSizeAction,
  type AccountActionState,
} from "~/app/account/actions";
import { Button } from "~/components/ui/button";
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
import { cn } from "~/lib/utils";

type SizeGuideToolProps = {
  initialKind: SizeFitKind;
};

type GuideCopy = {
  icon: LucideIcon;
  manualLabel: string;
  measurementLabel: string;
  presets: string[];
  range: string;
  resultLabel: string;
  title: string;
};

const defaultManualValues = {
  bracelet: "18",
  earring: "classic",
  necklace: "45",
  ring: "54",
} satisfies Record<SizeFitKind, string>;

const guideCopy = {
  bracelet: {
    icon: StretchHorizontal,
    manualLabel: "היקף צמיד בס״מ",
    measurementLabel: "אורך ההיקף על המסך",
    presets: ["16", "17", "18", "19", "20", "S", "M", "L"],
    range: "12-24 ס״מ או XS-L",
    resultLabel: "צמיד מחושב",
    title: "צמידים",
  },
  earring: {
    icon: Gem,
    manualLabel: "העדפת עגילים",
    measurementLabel: "סגנון וגודל",
    presets: [],
    range: "מיני, סטאד, קלאסי, תלוי ועוד",
    resultLabel: "העדפה נבחרת",
    title: "עגילים",
  },
  necklace: {
    icon: Sparkles,
    manualLabel: "אורך שרשרת בס״מ",
    measurementLabel: "אורך השרשרת על המסך",
    presets: ["38", "40", "42", "45", "50", "55", "60"],
    range: "35-70 ס״מ",
    resultLabel: "שרשרת מחושבת",
    title: "שרשראות",
  },
  ring: {
    icon: Circle,
    manualLabel: "מידת טבעת אירופאית",
    measurementLabel: "קוטר פנימי על המסך",
    presets: ["48", "50", "52", "54", "56", "58", "60"],
    range: "40-76",
    resultLabel: "טבעת מחושבת",
    title: "טבעות",
  },
} satisfies Record<SizeFitKind, GuideCopy>;

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
const defaultReferencePx = 220;

export function SizeGuideTool({ initialKind }: SizeGuideToolProps) {
  const [activeKind, setActiveKind] = useState<SizeFitKind>(initialKind);
  const [manualValue, setManualValue] = useState(
    defaultManualValues[initialKind],
  );
  const [referencePx, setReferencePx] = useState(defaultReferencePx);
  const [measurementPx, setMeasurementPx] = useState(
    getDefaultMeasurementPx(initialKind, defaultReferencePx),
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
  const activeCopy = guideCopy[activeKind];
  const ActiveIcon = activeCopy.icon;
  const savedSummary = normalizedManualValue
    ? formatSavedSize(activeKind, normalizedManualValue)
    : "מידה לא תקינה";
  const calculatedSummary = calibratedValue
    ? formatSavedSize(activeKind, calibratedValue)
    : "מחוץ לטווח";
  const confidenceScore = normalizedManualValue
    ? activeKind === "earring"
      ? 88
      : calibratedValue === normalizedManualValue
        ? 98
        : 92
    : 32;

  useEffect(() => {
    const syncSavedValue = () => {
      setManualValue(
        getSavedSize(activeKind) ?? defaultManualValues[activeKind],
      );
      setMeasurementPx(getDefaultMeasurementPx(activeKind, defaultReferencePx));
      setLocalMessage(null);
    };

    syncSavedValue();
    return subscribeToSavedSizeUpdates(syncSavedValue);
  }, [activeKind]);

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
    <section
      className="brand-surface overflow-hidden rounded-md"
      data-testid="size-guide-tool"
      dir="rtl"
    >
      <div className="grid gap-5 border-b border-[var(--glass-border)] p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid gap-3">
            <div className="glass-inset flex w-fit items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium">
              <ActiveIcon aria-hidden="true" className="size-4" />
              {activeCopy.title}
            </div>
            <div className="grid gap-2">
              <h2 className="text-2xl font-semibold tracking-normal sm:text-3xl">
                התאמת מידה מדויקת
              </h2>
              <p className="text-muted-foreground max-w-2xl text-sm leading-6 sm:text-base">
                בחרו מידה ידנית, כיילו לפי אובייקט מוכר או השתמשו בהמלצה
                המחושבת. התוצאה נשמרת ומשפיעה על התאמות המוצרים בקטלוג.
              </p>
            </div>
          </div>
          <div className="glass-inset grid min-w-0 gap-1 rounded-md border p-3 text-sm sm:min-w-56">
            <span className="text-muted-foreground">מידה פעילה</span>
            <strong className="truncate text-base">{savedSummary}</strong>
          </div>
        </div>

        <Tabs
          className="gap-5"
          dir="rtl"
          onValueChange={(value) => setActiveKind(value as SizeFitKind)}
          value={activeKind}
        >
          <TabsList className="h-auto w-full flex-wrap justify-start gap-1">
            {sizeFitKinds.map((kind) => {
              const Icon = guideCopy[kind].icon;

              return (
                <TabsTrigger
                  className="min-h-10 min-w-28 px-3"
                  key={kind}
                  value={kind}
                >
                  <Icon aria-hidden="true" className="size-4" />
                  {getSizeKindLabel(kind)}
                </TabsTrigger>
              );
            })}
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

                <div className="grid gap-5 xl:grid-cols-[minmax(18rem,0.85fr)_minmax(0,1.15fr)]">
                  <section className="grid gap-4">
                    <div className="glass-inset grid gap-4 rounded-md border p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="grid gap-1">
                          <h3 className="font-semibold">
                            {guideCopy[kind].manualLabel}
                          </h3>
                          <p className="text-muted-foreground text-sm">
                            טווח: {guideCopy[kind].range}
                          </p>
                        </div>
                        <CheckCircle2
                          aria-hidden="true"
                          className={cn(
                            "size-5 shrink-0",
                            normalizedManualValue
                              ? "text-foreground"
                              : "text-muted-foreground/50",
                          )}
                        />
                      </div>

                      {kind === "earring" ? (
                        <EarringSelector
                          selectedValue={manualValue}
                          onChange={setManualValue}
                        />
                      ) : (
                        <div className="grid gap-3">
                          <Label htmlFor={`size-guide-${kind}`}>
                            {guideCopy[kind].manualLabel}
                          </Label>
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
                          <div className="flex flex-wrap gap-2">
                            {guideCopy[kind].presets.map((preset) => (
                              <Button
                                aria-pressed={manualValue === preset}
                                className={cn(
                                  "min-w-12",
                                  manualValue === preset &&
                                    "bg-foreground text-background hover:bg-foreground/90 hover:text-background",
                                )}
                                key={preset}
                                onClick={() => setManualValue(preset)}
                                size="sm"
                                type="button"
                                variant="outline"
                              >
                                {preset}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div
                        className="text-muted-foreground min-h-12 text-sm leading-6"
                        id={`size-guide-${kind}-summary`}
                      >
                        {normalizedManualValue
                          ? `תישמר כ-${formatSavedSize(kind, normalizedManualValue)}`
                          : "המידה עדיין לא תקינה לשמירה."}
                      </div>
                    </div>

                    <div className="bg-background grid gap-3 rounded-md border border-[var(--glass-border)] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium">
                          מוכנות לשמירה
                        </span>
                        <span className="text-sm font-semibold">
                          {confidenceScore}%
                        </span>
                      </div>
                      <div
                        aria-hidden="true"
                        className="h-2 overflow-hidden rounded-full bg-[var(--muted)]"
                      >
                        <div
                          className="bg-foreground h-full rounded-full transition-[width]"
                          style={{ width: `${confidenceScore}%` }}
                        />
                      </div>
                      <Button className="w-full gap-2" type="submit">
                        <Save aria-hidden="true" className="size-4" />
                        שמירת מידה
                      </Button>
                    </div>
                  </section>

                  <section className="glass-inset grid gap-4 rounded-md border p-4">
                    {kind === "earring" ? (
                      <EarringPreview selectedValue={manualValue} />
                    ) : (
                      <>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="grid gap-1">
                            <h3 className="font-semibold">מדידה מכוילת</h3>
                            <p className="text-muted-foreground text-sm leading-6">
                              התאימו את כרטיס הייחוס לרוחב אמיתי, ואז את קו
                              המדידה לאובייקט הנמדד.
                            </p>
                          </div>
                          <div className="glass-inset flex w-fit items-center gap-2 rounded-md border px-3 py-2 text-sm">
                            <Gauge aria-hidden="true" className="size-4" />
                            {calculatedSummary}
                          </div>
                        </div>

                        <MeasurementStage
                          kind={kind}
                          measurementPx={measurementPx}
                          referencePx={referencePx}
                        />

                        <div className="grid gap-4 lg:grid-cols-2">
                          <RangeField
                            icon={SlidersHorizontal}
                            label="רוחב כרטיס ייחוס"
                            max={340}
                            min={160}
                            onChange={setReferencePx}
                            unit="px"
                            value={referencePx}
                          />
                          <RangeField
                            icon={ScanLine}
                            label={guideCopy[kind].measurementLabel}
                            max={getMeasurementMax(kind)}
                            min={40}
                            onChange={setMeasurementPx}
                            unit="px"
                            value={measurementPx}
                          />
                        </div>

                        <div className="bg-background grid gap-3 rounded-md border border-[var(--glass-border)] p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                          <div className="grid gap-1">
                            <span className="text-sm font-semibold">
                              {guideCopy[kind].resultLabel}
                            </span>
                            <span className="text-muted-foreground text-sm">
                              {calculatedSummary}
                            </span>
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
                        </div>
                      </>
                    )}
                  </section>
                </div>

                <div aria-live="polite" className="grid gap-2">
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
                </div>
              </form>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}

function EarringSelector({
  onChange,
  selectedValue,
}: {
  onChange: (value: string) => void;
  selectedValue: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {earringOptions.map((option) => (
        <Button
          aria-pressed={selectedValue === option}
          className={cn(
            "h-auto min-h-14 flex-col gap-1 px-2 py-2 text-center whitespace-normal",
            selectedValue === option &&
              "bg-foreground text-background hover:bg-foreground/90 hover:text-background",
          )}
          key={option}
          onClick={() => onChange(option)}
          type="button"
          variant="outline"
        >
          <span className="text-sm">{getEarringLabel(option)}</span>
        </Button>
      ))}
    </div>
  );
}

function EarringPreview({ selectedValue }: { selectedValue: string }) {
  const selectedLabel = getEarringLabel(selectedValue);

  return (
    <div className="grid min-h-80 gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="grid gap-1">
          <h3 className="font-semibold">התאמת עגילים</h3>
          <p className="text-muted-foreground text-sm leading-6">
            ההעדפה נשמרת מול וריאנטים וסגנונות קיימים בקטלוג.
          </p>
        </div>
        <div className="glass-inset flex w-fit items-center gap-2 rounded-md border px-3 py-2 text-sm">
          <Gem aria-hidden="true" className="size-4" />
          {selectedLabel}
        </div>
      </div>

      <div className="bg-background grid min-h-56 place-items-center rounded-md border border-[var(--glass-border)] p-6">
        <div className="relative grid size-44 place-items-center rounded-full border border-[var(--glass-border)] bg-[var(--glass-inset-bg)]">
          <div className="bg-background absolute top-8 grid size-12 place-items-center rounded-full border">
            <div className="bg-foreground size-3 rounded-full" />
          </div>
          <div
            className={cn(
              "bg-foreground absolute top-20 w-1 rounded-full transition-[height]",
              selectedValue === "mini" || selectedValue === "stud"
                ? "h-5"
                : selectedValue === "drop" || selectedValue === "long"
                  ? "h-24"
                  : "h-14",
            )}
          />
          <div
            className={cn(
              "border-foreground absolute rounded-full border-2 transition-[width,height]",
              selectedValue === "round"
                ? "bottom-8 size-16"
                : selectedValue === "small" || selectedValue === "mini"
                  ? "bottom-12 size-8"
                  : "bottom-8 size-12",
            )}
          />
        </div>
      </div>
    </div>
  );
}

function MeasurementStage({
  kind,
  measurementPx,
  referencePx,
}: {
  kind: SizeFitKind;
  measurementPx: number;
  referencePx: number;
}) {
  const max = getMeasurementMax(kind);
  const referenceWidth = `${Math.min(86, Math.max(42, (referencePx / 340) * 86))}%`;
  const measurementWidth = `${Math.min(92, Math.max(16, (measurementPx / max) * 92))}%`;

  return (
    <div className="bg-background grid gap-5 rounded-md border border-[var(--glass-border)] p-4">
      <div className="grid gap-2">
        <div className="text-muted-foreground flex items-center justify-between gap-3 text-xs">
          <span>כרטיס ייחוס</span>
          <span>{referenceCardWidthMm} מ״מ</span>
        </div>
        <div
          aria-hidden="true"
          className="h-12 rounded-md border border-dashed border-[var(--glass-border-strong)] bg-[var(--glass-inset-bg)] transition-[width]"
          style={{ width: referenceWidth }}
        />
      </div>

      <div className="grid gap-2">
        <div className="text-muted-foreground flex items-center justify-between gap-3 text-xs">
          <span>{guideCopy[kind].measurementLabel}</span>
          <span>{measurementPx}px</span>
        </div>
        <div className="relative h-16 rounded-md bg-[var(--glass-inset-bg)]">
          <div
            aria-hidden="true"
            className="bg-foreground absolute top-1/2 right-4 h-1 -translate-y-1/2 rounded-full transition-[width]"
            style={{ width: measurementWidth }}
          />
          <div
            aria-hidden="true"
            className="bg-foreground absolute top-1/2 right-4 size-3 -translate-y-1/2 rounded-full"
          />
        </div>
      </div>
    </div>
  );
}

function RangeField({
  icon: Icon,
  label,
  max,
  min,
  onChange,
  unit,
  value,
}: {
  icon: LucideIcon;
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
        <Label className="flex items-center gap-2" htmlFor={inputId}>
          <Icon aria-hidden="true" className="size-4" />
          {label}
        </Label>
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
