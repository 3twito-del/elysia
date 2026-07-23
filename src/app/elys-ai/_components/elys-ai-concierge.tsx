"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Edit3,
  LockKeyhole,
  MessageCircle,
  Sparkles,
} from "lucide-react";

import {
  ElysAiChat,
  type QueuedChatMessage,
} from "~/app/elys-ai/_components/elys-ai-chat";
import {
  BUDGET_OPTIONS,
  ELYS_AI_STEPS,
  JEWELRY_TYPE_OPTIONS,
  OCCASION_OPTIONS,
  SIZE_OPTIONS,
  STYLE_OPTIONS,
  buildConciergePrompt,
  createEmptyConciergePreferences,
  getConciergeSummary,
  toggleJewelryType,
  type ConciergePreferences,
} from "~/app/elys-ai/_lib/concierge";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

type FlowStage = "guide" | "summary" | "chat";

export function ElysAiConcierge() {
  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    getHydratedSnapshot,
    getServerHydrationSnapshot,
  );
  const [stage, setStage] = useState<FlowStage>("guide");
  const [chatStarted, setChatStarted] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [isRefining, setIsRefining] = useState(false);
  const [preferences, setPreferences] = useState(
    createEmptyConciergePreferences,
  );
  const [customBudget, setCustomBudget] = useState("");
  const [queuedMessage, setQueuedMessage] = useState<QueuedChatMessage>();
  const summary = useMemo(
    () => getConciergeSummary(preferences),
    [preferences],
  );

  const clearQueuedMessage = useCallback((id: number) => {
    setQueuedMessage((current) => (current?.id === id ? undefined : current));
  }, []);

  function continueGuide() {
    if (stepIndex === ELYS_AI_STEPS.length - 1) {
      setStage("summary");
      return;
    }

    setStepIndex((current) => current + 1);
  }

  function submitPreferences() {
    const prompt = buildConciergePrompt(preferences);
    setQueuedMessage({
      id: Date.now(),
      text: isRefining ? `חידוד ההעדפות שלי: ${prompt}` : prompt,
    });
    setChatStarted(true);
    setStage("chat");
    setIsRefining(false);
  }

  function beginRefinement() {
    setStepIndex(0);
    setStage("guide");
    setIsRefining(true);
  }

  return (
    <div
      aria-busy={!isHydrated}
      className="grid gap-5"
      data-hydrated={isHydrated}
      data-testid="elys-ai-concierge"
      inert={isHydrated ? undefined : true}
    >
      {stage === "chat" ? (
        <PreferenceStrip onEdit={beginRefinement} summary={summary} />
      ) : (
        <GuidePanel
          customBudget={customBudget}
          isRefining={isRefining}
          onBack={() => {
            if (stage === "summary") {
              setStage("guide");
              setStepIndex(ELYS_AI_STEPS.length - 1);
            } else if (stepIndex > 0) {
              setStepIndex((current) => current - 1);
            } else if (isRefining) {
              setStage("chat");
              setIsRefining(false);
            }
          }}
          onContinue={continueGuide}
          onCustomBudgetChange={(value) => {
            setCustomBudget(value);
            const amount = Number(value);
            setPreferences((current) => ({
              ...current,
              budget:
                Number.isFinite(amount) && amount > 0 ? amount : undefined,
            }));
          }}
          onEditStep={(index) => {
            setStage("guide");
            setStepIndex(index);
          }}
          onFreeChat={() => {
            setChatStarted(true);
            setStage("chat");
            setIsRefining(false);
          }}
          onPreferencesChange={setPreferences}
          onSubmit={submitPreferences}
          preferences={preferences}
          stage={stage}
          stepIndex={stepIndex}
          summary={summary}
        />
      )}

      {chatStarted ? (
        <section
          aria-label="שיחה עם elys-ai"
          className={cn("min-w-0", stage !== "chat" && "hidden")}
          data-testid="elys-ai-chat"
        >
          <ElysAiChat
            compact
            onQueuedMessageSent={clearQueuedMessage}
            queuedMessage={queuedMessage}
          />
        </section>
      ) : null}

      <div className="text-muted-foreground flex flex-wrap items-center justify-between gap-3 border-t border-[var(--glass-border)] pt-4 text-xs leading-6">
        <span className="inline-flex items-center gap-2">
          <LockKeyhole aria-hidden="true" className="size-4" />
          אין צורך בחשבון. ההעדפות נשמרות רק בזמן השיחה.
        </span>
        <span>אין לשלוח פרטי תשלום או מידע אישי רגיש.</span>
      </div>
    </div>
  );
}

function subscribeToHydration() {
  return () => undefined;
}

function getHydratedSnapshot() {
  return true;
}

function getServerHydrationSnapshot() {
  return false;
}

function GuidePanel({
  customBudget,
  isRefining,
  onBack,
  onContinue,
  onCustomBudgetChange,
  onEditStep,
  onFreeChat,
  onPreferencesChange,
  onSubmit,
  preferences,
  stage,
  stepIndex,
  summary,
}: {
  customBudget: string;
  isRefining: boolean;
  onBack: () => void;
  onContinue: () => void;
  onCustomBudgetChange: (value: string) => void;
  onEditStep: (index: number) => void;
  onFreeChat: () => void;
  onPreferencesChange: (preferences: ConciergePreferences) => void;
  onSubmit: () => void;
  preferences: ConciergePreferences;
  stage: FlowStage;
  stepIndex: number;
  summary: Array<{ label: string; value: string }>;
}) {
  return (
    <section
      aria-labelledby="elys-ai-guide-title"
      className="elys-ai-guide-surface overflow-hidden border border-[var(--glass-border)] bg-[color-mix(in_srgb,var(--card)_88%,var(--brand-ivory))]"
      data-testid="elys-ai-guide"
    >
      <div className="grid gap-5 border-b border-[var(--glass-border)] px-5 py-5 sm:px-8 sm:py-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="grid gap-2">
            <span className="text-muted-foreground text-xs font-medium uppercase">
              {isRefining ? "חידוד הבחירה" : "ייעוץ אישי"}
            </span>
            <h2
              className="text-2xl font-semibold sm:text-3xl"
              id="elys-ai-guide-title"
            >
              {stage === "summary"
                ? "הבחירה שלך, לפני שמתחילות"
                : "כמה פרטים, והבחירה נעשית מדויקת יותר"}
            </h2>
          </div>
          <span className="grid size-11 place-items-center rounded-full border border-[var(--glass-border)]">
            <Sparkles aria-hidden="true" className="size-5" />
          </span>
        </div>

        <ol
          aria-label="התקדמות בשאלון"
          className="grid grid-cols-5 gap-2"
          dir="rtl"
        >
          {ELYS_AI_STEPS.map((step, index) => {
            const isCurrent = stage === "guide" && stepIndex === index;
            const isComplete = stage === "summary" || index < stepIndex;

            return (
              <li className="grid min-w-0 gap-2" key={step.id}>
                <span
                  aria-current={isCurrent ? "step" : undefined}
                  className={cn(
                    "h-1 rounded-full bg-[var(--muted)] transition-colors",
                    (isCurrent || isComplete) && "bg-foreground",
                  )}
                />
                <span
                  className={cn(
                    "text-muted-foreground hidden truncate text-[0.68rem] sm:block",
                    isCurrent && "text-foreground font-medium",
                  )}
                >
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="grid min-h-[24rem] content-between gap-8 px-5 py-6 sm:px-8 sm:py-8">
        {stage === "summary" ? (
          <SummaryGrid onEditStep={onEditStep} rows={summary} />
        ) : (
          <StepContent
            customBudget={customBudget}
            onCustomBudgetChange={onCustomBudgetChange}
            onPreferencesChange={onPreferencesChange}
            preferences={preferences}
            stepIndex={stepIndex}
          />
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--glass-border)] pt-5">
          <div className="flex flex-wrap gap-2">
            {(stepIndex > 0 || stage === "summary" || isRefining) && (
              <Button
                className="gap-2"
                onClick={onBack}
                type="button"
                variant="ghost"
              >
                <ArrowRight aria-hidden="true" className="size-4" />
                חזרה
              </Button>
            )}
            {!isRefining ? (
              <Button onClick={onFreeChat} type="button" variant="ghost">
                שיחה חופשית
              </Button>
            ) : null}
          </div>
          <Button
            className="min-w-36 gap-2"
            data-testid={
              stage === "summary"
                ? "elys-ai-submit-preferences"
                : "elys-ai-next-step"
            }
            onClick={stage === "summary" ? onSubmit : onContinue}
            type="button"
          >
            {stage === "summary"
              ? isRefining
                ? "שליחת החידוד"
                : "התחלת השיחה"
              : stepIndex === ELYS_AI_STEPS.length - 1
                ? "לסיכום"
                : "המשך"}
            {stage === "summary" ? (
              <MessageCircle aria-hidden="true" className="size-4" />
            ) : (
              <ArrowLeft aria-hidden="true" className="size-4" />
            )}
          </Button>
        </div>
      </div>
    </section>
  );
}

function StepContent({
  customBudget,
  onCustomBudgetChange,
  onPreferencesChange,
  preferences,
  stepIndex,
}: {
  customBudget: string;
  onCustomBudgetChange: (value: string) => void;
  onPreferencesChange: (preferences: ConciergePreferences) => void;
  preferences: ConciergePreferences;
  stepIndex: number;
}) {
  if (stepIndex === 0) {
    return (
      <StepFrame
        description="אפשר לבחור יותר מסוג אחד. אם תרצי, נחבר ביניהם למראה שלם."
        title="אילו תכשיטים מעניינים אותך?"
      >
        <div
          className="grid auto-cols-[minmax(9rem,1fr)] grid-flow-col gap-2 overflow-x-auto overscroll-x-contain pb-2 lg:auto-cols-fr"
          data-testid="elys-ai-jewelry-options"
        >
          {JEWELRY_TYPE_OPTIONS.map((option) => (
            <ChoiceButton
              key={option.value}
              label={option.label}
              onClick={() =>
                onPreferencesChange(
                  toggleJewelryType(preferences, option.value),
                )
              }
              selected={preferences.jewelryTypes.includes(option.value)}
            />
          ))}
          <ChoiceButton
            label="בני לי שילוב"
            onClick={() =>
              onPreferencesChange({
                ...preferences,
                combination: !preferences.combination,
              })
            }
            selected={preferences.combination}
          />
          <ChoiceButton
            label="ללא העדפה"
            onClick={() =>
              onPreferencesChange({
                ...preferences,
                jewelryTypes: [],
                combination: false,
              })
            }
            selected={
              preferences.jewelryTypes.length === 0 && !preferences.combination
            }
          />
        </div>
      </StepFrame>
    );
  }

  if (stepIndex === 1) {
    return (
      <StepFrame
        description="ההקשר עוזר לנו לכוון בין נוכחות שקטה למראה חגיגי."
        title="לאן התכשיט הולך איתך?"
      >
        <OptionGrid>
          {OCCASION_OPTIONS.map((option) => (
            <ChoiceButton
              key={option.value}
              label={option.label}
              onClick={() =>
                onPreferencesChange({
                  ...preferences,
                  occasion: option.value,
                })
              }
              selected={preferences.occasion === option.value}
            />
          ))}
        </OptionGrid>
      </StepFrame>
    );
  }

  if (stepIndex === 2) {
    return (
      <StepFrame
        description="אפשר לבחור את התחושה הקרובה ביותר — אין כאן תשובה נכונה."
        title="איזה אופי את מחפשת?"
      >
        <OptionGrid>
          {STYLE_OPTIONS.map((option) => (
            <ChoiceButton
              key={option.value}
              label={option.label}
              onClick={() =>
                onPreferencesChange({
                  ...preferences,
                  style: option.value,
                })
              }
              selected={preferences.style === option.value}
            />
          ))}
        </OptionGrid>
      </StepFrame>
    );
  }

  if (stepIndex === 3) {
    return (
      <StepFrame
        description={
          preferences.combination
            ? "התקציב יחול על הסכום הכולל של כל הפריטים בשילוב."
            : "נציג רק בחירות שאינן חורגות מהתקרה."
        }
        title="מה מסגרת התקציב?"
      >
        <OptionGrid>
          {BUDGET_OPTIONS.map((amount) => (
            <ChoiceButton
              key={amount}
              label={`עד ${amount.toLocaleString("he-IL")} ₪`}
              onClick={() => {
                onCustomBudgetChange("");
                onPreferencesChange({ ...preferences, budget: amount });
              }}
              selected={preferences.budget === amount && !customBudget}
            />
          ))}
          <ChoiceButton
            label="ללא תקרה"
            onClick={() => {
              onCustomBudgetChange("");
              onPreferencesChange({ ...preferences, budget: undefined });
            }}
            selected={!preferences.budget}
          />
        </OptionGrid>
        <label className="grid max-w-sm gap-2">
          <span className="text-sm font-medium">תקרה אחרת</span>
          <span className="relative">
            <input
              className="field-control h-12 w-full rounded-md bg-transparent px-4 pl-12"
              inputMode="numeric"
              min="1"
              onChange={(event) =>
                onCustomBudgetChange(event.currentTarget.value)
              }
              placeholder="לדוגמה: 1500"
              type="number"
              value={customBudget}
            />
            <span className="text-muted-foreground absolute top-1/2 left-4 -translate-y-1/2">
              ₪
            </span>
          </span>
        </label>
      </StepFrame>
    );
  }

  return (
    <StepFrame
      description="אפשר להשאיר את המידה פתוחה ולקבל עזרה לפני ההזמנה."
      title="ומה לגבי מידה?"
    >
      <OptionGrid>
        {SIZE_OPTIONS.map((option) => (
          <ChoiceButton
            key={option.value}
            label={option.label}
            onClick={() =>
              onPreferencesChange({
                ...preferences,
                size: option.value,
              })
            }
            selected={preferences.size === option.value}
          />
        ))}
      </OptionGrid>
      {preferences.size === "known" ? (
        <label className="grid max-w-sm gap-2">
          <span className="text-sm font-medium">המידה שלך</span>
          <input
            className="field-control h-12 rounded-md bg-transparent px-4"
            onChange={(event) =>
              onPreferencesChange({
                ...preferences,
                knownSize: event.currentTarget.value,
              })
            }
            placeholder="לדוגמה: טבעת 54"
            type="text"
            value={preferences.knownSize ?? ""}
          />
        </label>
      ) : null}
    </StepFrame>
  );
}

function StepFrame({
  children,
  description,
  title,
}: {
  children: React.ReactNode;
  description: string;
  title: string;
}) {
  return (
    <div className="grid content-start gap-6">
      <div className="grid gap-2">
        <h3 className="text-xl font-semibold sm:text-2xl">{title}</h3>
        <p className="text-muted-foreground max-w-2xl text-sm leading-7">
          {description}
        </p>
      </div>
      {children}
    </div>
  );
}

function OptionGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{children}</div>
  );
}

function ChoiceButton({
  className,
  label,
  onClick,
  selected,
}: {
  className?: string;
  label: string;
  onClick: () => void;
  selected: boolean;
}) {
  return (
    <button
      aria-pressed={selected}
      className={cn(
        "hover:border-foreground/35 focus-visible:ring-ring relative min-h-14 rounded-md border border-[var(--glass-border)] px-4 py-3 text-right text-sm transition-colors outline-none focus-visible:ring-2",
        selected && "border-foreground bg-foreground text-background",
        className,
      )}
      onClick={onClick}
      type="button"
    >
      <span className="flex items-center justify-between gap-3">
        {label}
        {selected ? <Check aria-hidden="true" className="size-4" /> : null}
      </span>
    </button>
  );
}

function SummaryGrid({
  onEditStep,
  rows,
}: {
  onEditStep: (index: number) => void;
  rows: Array<{ label: string; value: string }>;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {rows.map((row, index) => (
        <div
          className="grid min-h-24 content-between gap-3 rounded-md border border-[var(--glass-border)] p-4"
          key={row.label}
        >
          <span className="text-muted-foreground text-xs">{row.label}</span>
          <div className="flex items-end justify-between gap-3">
            <strong className="text-sm font-medium">{row.value}</strong>
            <button
              aria-label={`עריכת ${row.label}`}
              className="text-muted-foreground hover:text-foreground rounded-sm p-1 outline-none focus-visible:ring-2"
              onClick={() => onEditStep(index)}
              type="button"
            >
              <Edit3 aria-hidden="true" className="size-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function PreferenceStrip({
  onEdit,
  summary,
}: {
  onEdit: () => void;
  summary: Array<{ label: string; value: string }>;
}) {
  const active = summary.filter(
    (row) => row.value !== "ללא העדפה" && row.value !== "ללא תקרה",
  );

  return (
    <section
      aria-label="העדפות השיחה"
      className="flex flex-wrap items-center justify-between gap-3 border-y border-[var(--glass-border)] py-3"
      data-testid="elys-ai-preference-strip"
    >
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <span className="text-sm font-semibold">הכיוון שלך</span>
        {active.length > 0 ? (
          active.map((row) => (
            <span
              className="text-muted-foreground rounded-full border border-[var(--glass-border)] px-3 py-1 text-xs"
              key={row.label}
            >
              {row.value}
            </span>
          ))
        ) : (
          <span className="text-muted-foreground text-xs">שיחה חופשית</span>
        )}
      </div>
      <Button className="gap-2" onClick={onEdit} size="sm" variant="ghost">
        <Edit3 aria-hidden="true" className="size-4" />
        עריכה
      </Button>
    </section>
  );
}
