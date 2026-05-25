"use client";

import {
  useActionState,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import {
  CheckCircle2,
  Circle,
  Gem,
  Ruler,
  Save,
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

type SizeGuideRow = {
  measurement: string;
  size: string;
};

type GuideCopy = {
  icon: LucideIcon;
  inputLabel: string;
  instructions: string[];
  placeholder: string;
  presets: string[];
  range: string;
  rows: SizeGuideRow[];
  tip: string;
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
    inputLabel: "היקף פרק כף היד בס״מ",
    instructions: [
      "כרכי סרט מדידה סביב החלק הרחב של פרק כף היד.",
      "אם משתמשים בחוט, סמני את נקודת המפגש ומדדי אותו על סרגל.",
      "לצמיד שרשרת בחרי מידה עם מעט תנועה; לצמיד קשיח בחרי התאמה צמודה יותר.",
    ],
    placeholder: "לדוגמה: 17",
    presets: ["16", "17", "18", "19", "20", "XS", "S", "M", "L"],
    range: "12-24 ס״מ או XS-L",
    rows: [
      { measurement: "12-14 ס״מ", size: "XS" },
      { measurement: "14-16 ס״מ", size: "S" },
      { measurement: "16-18 ס״מ", size: "M" },
      { measurement: "18-20 ס״מ", size: "L" },
      { measurement: "20-24 ס״מ", size: "התאמה אישית" },
    ],
    tip: "אם את בין שתי מידות, בחרי את הגדולה יותר לצמידי שרשרת או צמידים עם תליונים.",
    title: "צמידים",
  },
  earring: {
    icon: Gem,
    inputLabel: "סגנון עגילים מועדף",
    instructions: [
      "בחרי את הסגנון שאת עונדת בדרך כלל.",
      "סטאד ומיני יישמרו כהעדפה עדינה; תלוי וארוך יכוונו לעיצובים עם נוכחות.",
      "ההתאמה משפיעה על המלצות סגנון, לא על מידה פיזית מחייבת.",
    ],
    placeholder: "",
    presets: [
      "mini",
      "stud",
      "classic",
      "drop",
      "small",
      "medium",
      "round",
      "long",
    ],
    range: "מיני, סטאד, קלאסי, תלוי ועוד",
    rows: [
      { measurement: "עדין ויומיומי", size: "מיני / סטאד" },
      { measurement: "מאוזן", size: "קלאסי / בינוני" },
      { measurement: "נוכחות", size: "תלוי / ארוך" },
      { measurement: "קו עגול", size: "עגול" },
    ],
    tip: "לעגילים אין מידת גוף אחת. השמירה כאן מיועדת להמלצות ולסינון סגנוני.",
    title: "עגילים",
  },
  necklace: {
    icon: Sparkles,
    inputLabel: "אורך שרשרת בס״מ",
    instructions: [
      "מדדי שרשרת קיימת מקצה לקצה כשהיא פתוחה וישרה.",
      "לבשי חולצה דומה לזו שאיתה תרצי לענוד את השרשרת ובחרי את נקודת הנפילה הרצויה.",
      "לשכבות, שמרי את האורך המרכזי והוסיפי שרשרת קצרה או ארוכה יותר לצידו.",
    ],
    placeholder: "לדוגמה: 45",
    presets: ["38", "40", "42", "45", "50", "55", "60"],
    range: "35-70 ס״מ",
    rows: [
      { measurement: "38-40 ס״מ", size: "צווארון קצר" },
      { measurement: "42-45 ס״מ", size: "יומיומי / קלאסי" },
      { measurement: "50-55 ס״מ", size: "נפילה נמוכה" },
      { measurement: "60-70 ס״מ", size: "ארוך / שכבות" },
    ],
    tip: "45 ס״מ היא נקודת פתיחה טובה לרוב השרשראות הקלאסיות.",
    title: "שרשראות",
  },
  ring: {
    icon: Circle,
    inputLabel: "מידת טבעת אירופאית",
    instructions: [
      "השתמשי בטבעת קיימת שיושבת בנוחות על אותה אצבע.",
      "אם את מודדת אצבע, בדקי בסוף היום כשהיד בטמפרטורה רגילה.",
      "בין שתי מידות, טבעות רחבות בדרך כלל מרגישות טוב יותר במידה הגדולה.",
    ],
    placeholder: "לדוגמה: 54",
    presets: ["48", "50", "52", "54", "56", "58", "60"],
    range: "40-76",
    rows: [
      { measurement: "48-50", size: "קטנה" },
      { measurement: "52-54", size: "נפוצה" },
      { measurement: "56-58", size: "בינונית" },
      { measurement: "60 ומעלה", size: "גדולה" },
    ],
    tip: "המספר האירופאי קרוב להיקף האצבע במ״מ, ולכן הוא נוח להשוואה בין דגמים.",
    title: "טבעות",
  },
} satisfies Record<SizeFitKind, GuideCopy>;

export function SizeGuideTool({ initialKind }: SizeGuideToolProps) {
  const [activeKind, setActiveKind] = useState<SizeFitKind>(initialKind);
  const [manualValue, setManualValue] = useState(
    defaultManualValues[initialKind],
  );
  const [localMessage, setLocalMessage] = useState<string | null>(null);
  const [state, action] = useActionState<AccountActionState, FormData>(
    saveCustomerSizeAction,
    {},
  );
  const activeCopy = guideCopy[activeKind];
  const normalizedManualValue = normalizeSavedSize(activeKind, manualValue);
  const savedSummary = normalizedManualValue
    ? formatSavedSize(activeKind, normalizedManualValue)
    : "מידה לא תקינה";
  const selectedInstruction = useMemo(
    () =>
      activeKind === "earring"
        ? getEarringLabel(manualValue)
        : normalizedManualValue
          ? formatSavedSize(activeKind, normalizedManualValue)
          : activeCopy.range,
    [activeCopy.range, activeKind, manualValue, normalizedManualValue],
  );

  useEffect(() => {
    const syncSavedValue = () => {
      setManualValue(
        getSavedSize(activeKind) ?? defaultManualValues[activeKind],
      );
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
    <section className="grid gap-5" data-testid="size-guide-tool" dir="rtl">
      <div className="grid gap-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="grid gap-1">
            <h2 className="text-lg font-semibold tracking-normal">
              בחירת סוג תכשיט
            </h2>
            <p className="text-muted-foreground text-sm">
              הזיני מידה קיימת או מדידה פשוטה ושמרי להמשך.
            </p>
          </div>
          <div className="brand-surface w-full rounded-md px-4 py-3 text-sm md:w-64">
            <span className="text-muted-foreground block">מידה פעילה</span>
            <strong className="mt-1 block truncate text-base">
              {savedSummary}
            </strong>
          </div>
        </div>

        <div
          aria-label="בחירת סוג תכשיט"
          className="grid grid-cols-2 gap-2 md:grid-cols-4"
          role="group"
        >
          {sizeFitKinds.map((kind) => {
            const Icon = guideCopy[kind].icon;
            const isActive = activeKind === kind;

            return (
              <Button
                aria-pressed={isActive}
                className="min-h-12 justify-center gap-2"
                key={kind}
                onClick={() => setActiveKind(kind)}
                type="button"
                variant={isActive ? "default" : "outline"}
              >
                <Icon aria-hidden="true" className="size-4" />
                {getSizeKindLabel(kind)}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.92fr)_minmax(20rem,1fr)] lg:items-start">
        <form
          action={action}
          className="brand-surface grid gap-5 p-5 sm:p-6"
          onSubmit={handleSubmit}
        >
          <input name="kind" type="hidden" value={activeKind} />
          <input name="value" type="hidden" value={manualValue} />

          <div className="flex items-start justify-between gap-4">
            <div className="grid gap-1">
              <h3 className="text-lg font-semibold">{activeCopy.title}</h3>
              <p className="text-muted-foreground text-sm">
                טווח נתמך: {activeCopy.range}
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

          {activeKind === "earring" ? (
            <EarringSelector
              onChange={setManualValue}
              selectedValue={manualValue}
            />
          ) : (
            <div className="grid gap-3">
              <Label htmlFor={`size-guide-${activeKind}`}>
                {activeCopy.inputLabel}
              </Label>
              <Input
                aria-describedby={`size-guide-${activeKind}-summary`}
                id={`size-guide-${activeKind}`}
                inputMode="decimal"
                maxLength={40}
                onChange={(event) => setManualValue(event.currentTarget.value)}
                placeholder={activeCopy.placeholder}
                value={manualValue}
              />
              <PresetButtons
                onChange={setManualValue}
                options={activeCopy.presets}
                selectedValue={manualValue}
              />
            </div>
          )}

          <div
            className="text-muted-foreground min-h-10 text-sm leading-6"
            id={`size-guide-${activeKind}-summary`}
          >
            {normalizedManualValue
              ? `תישמר כ-${formatSavedSize(activeKind, normalizedManualValue)}`
              : "המידה עדיין לא תקינה לשמירה."}
          </div>

          <Button className="w-full gap-2" type="submit">
            <Save aria-hidden="true" className="size-4" />
            שמירת מידה
          </Button>

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

        <aside className="brand-surface grid gap-5 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="glass-inset grid size-11 shrink-0 place-items-center rounded-md border">
              <Ruler aria-hidden="true" className="size-5" />
            </div>
            <div className="grid gap-1">
              <h3 className="text-lg font-semibold">
                איך לבחור {activeCopy.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-6">
                ההמלצה הנוכחית: {selectedInstruction}
              </p>
            </div>
          </div>

          <ol className="grid gap-3 text-sm leading-6">
            {activeCopy.instructions.map((instruction, index) => (
              <li className="grid grid-cols-[2rem_1fr] gap-3" key={instruction}>
                <span className="glass-inset grid size-8 place-items-center rounded-md border text-xs font-semibold">
                  {index + 1}
                </span>
                <span>{instruction}</span>
              </li>
            ))}
          </ol>

          <div className="grid gap-3 border-t border-[var(--glass-border)] pt-5">
            <h4 className="text-sm font-semibold">טבלת עזר</h4>
            <div className="grid gap-2 text-sm">
              {activeCopy.rows.map((row) => (
                <div
                  className="grid gap-2 rounded-md border border-[var(--glass-border)] px-3 py-2 sm:grid-cols-[1fr_auto] sm:items-center"
                  key={`${row.measurement}-${row.size}`}
                >
                  <span>{row.measurement}</span>
                  <strong className="font-semibold">{row.size}</strong>
                </div>
              ))}
            </div>
          </div>

          <p className="text-muted-foreground border-t border-[var(--glass-border)] pt-5 text-sm leading-6">
            {activeCopy.tip}
          </p>
        </aside>
      </div>
    </section>
  );
}

function PresetButtons({
  onChange,
  options,
  selectedValue,
}: {
  onChange: (value: string) => void;
  options: string[];
  selectedValue: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isSelected = selectedValue === option;

        return (
          <Button
            aria-pressed={isSelected}
            className="min-w-12"
            key={option}
            onClick={() => onChange(option)}
            size="sm"
            type="button"
            variant={isSelected ? "default" : "outline"}
          >
            {option}
          </Button>
        );
      })}
    </div>
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
      {guideCopy.earring.presets.map((option) => {
        const isSelected = selectedValue === option;

        return (
          <Button
            aria-pressed={isSelected}
            className="h-auto min-h-12 px-2 py-2 text-center whitespace-normal"
            key={option}
            onClick={() => onChange(option)}
            type="button"
            variant={isSelected ? "default" : "outline"}
          >
            {getEarringLabel(option)}
          </Button>
        );
      })}
    </div>
  );
}
