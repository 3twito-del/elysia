"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { Gift, Sparkles } from "lucide-react";

import { AiProductRecommendations } from "~/components/ai-product-recommendations";
import { MessageResponse } from "~/components/ai-elements/message";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Spinner } from "~/components/ui/spinner";
import { StatusMessage } from "~/components/ui/status-message";
import { Textarea } from "~/components/ui/textarea";
import { recommendGiftInputSchema } from "~/lib/ai-commerce-validation";
import {
  getFirstZodIssueMessage,
  getZodFieldErrors,
  type FormFieldErrors,
} from "~/lib/form-validation";
import { api } from "~/trpc/react";

export function AiGiftRecommender() {
  const [relation, setRelation] = useState("אמא");
  const [occasion, setOccasion] = useState("יום הולדת");
  const [budget, setBudget] = useState("700");
  const [style, setStyle] = useState("עדין, יומיומי");
  const [fieldErrors, setFieldErrors] = useState<FormFieldErrors>({});
  const [validationMessage, setValidationMessage] = useState<string | null>(
    null,
  );
  const recommendGift = api.ai.recommendGift.useMutation();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = recommendGiftInputSchema.safeParse({
      relation,
      occasion,
      budget: Number(budget),
      style: splitStyleInput(style),
    });

    if (!parsed.success) {
      setFieldErrors(getZodFieldErrors(parsed.error));
      setValidationMessage(getFirstZodIssueMessage(parsed.error));
      return;
    }

    setFieldErrors({});
    setValidationMessage(null);
    recommendGift.mutate(parsed.data);
  }

  return (
    <div className="brand-surface grid gap-4 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 text-sm font-medium">
            <Gift aria-hidden="true" className="size-4" />
            התאמת מתנה
          </div>
          <h2 className="text-xl font-semibold">שאלון מתנה חכם</h2>
          <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
            הזינו קשר, אירוע, מחיר וסגנון. ההמלצות יישארו בתוך בחירות
            קיימים במבחר.
          </p>
        </div>
        <Sparkles aria-hidden="true" className="text-foreground size-6" />
      </div>

      <form className="grid gap-3" onSubmit={handleSubmit}>
        <div className="grid gap-3 md:grid-cols-3">
          <Field
            error={fieldErrors.relation}
            htmlFor="ai-gift-relation"
            label="למי המתנה"
          >
            <Input
              aria-invalid={Boolean(fieldErrors.relation)}
              disabled={recommendGift.isPending}
              id="ai-gift-relation"
              onChange={(event) => setRelation(event.currentTarget.value)}
              required
              value={relation}
            />
          </Field>
          <Field
            error={fieldErrors.occasion}
            htmlFor="ai-gift-occasion"
            label="אירוע"
          >
            <Input
              aria-invalid={Boolean(fieldErrors.occasion)}
              disabled={recommendGift.isPending}
              id="ai-gift-occasion"
              onChange={(event) => setOccasion(event.currentTarget.value)}
              required
              value={occasion}
            />
          </Field>
          <Field
            error={fieldErrors.budget}
            htmlFor="ai-gift-budget"
            label="מחיר"
          >
            <Input
              aria-invalid={Boolean(fieldErrors.budget)}
              disabled={recommendGift.isPending}
              id="ai-gift-budget"
              min={1}
              onChange={(event) => setBudget(event.currentTarget.value)}
              required
              type="number"
              value={budget}
            />
          </Field>
        </div>

        <Field error={fieldErrors.style} htmlFor="ai-gift-style" label="סגנון">
          <Textarea
            aria-invalid={Boolean(fieldErrors.style)}
            className="min-h-24"
            disabled={recommendGift.isPending}
            id="ai-gift-style"
            onChange={(event) => setStyle(event.currentTarget.value)}
            placeholder="לדוגמה: עדין, זהב לבן, שימוש יומיומי"
            value={style}
          />
        </Field>

        {(validationMessage ?? recommendGift.error) ? (
          <StatusMessage tone="error" variant="plain">
            {validationMessage ?? recommendGift.error?.message}
          </StatusMessage>
        ) : null}

        <Button
          className="w-fit gap-2"
          disabled={recommendGift.isPending || Number(budget) <= 0}
          type="submit"
        >
          {recommendGift.isPending ? (
            <Spinner aria-hidden="true" role="presentation" />
          ) : (
            <Sparkles aria-hidden="true" className="size-4" />
          )}
          קבלת המלצות
        </Button>
      </form>

      {recommendGift.data ? (
        <div className="grid gap-4 border-t border-[var(--glass-border)] pt-5">
          <MessageResponse>{recommendGift.data.summary}</MessageResponse>
          <AiProductRecommendations
            products={recommendGift.data.products}
            source="gift"
            title="בחירות למתנה"
          />
          {recommendGift.data.products.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              לא נמצאה התאמה פתוחה בטווח המחיר ובסגנון שבחרת.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Field({
  children,
  error,
  htmlFor,
  label,
}: {
  children: ReactNode;
  error?: string;
  htmlFor: string;
  label: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? <p className="text-destructive text-xs">{error}</p> : null}
    </div>
  );
}

function splitStyleInput(value: string) {
  return value
    .split(/[,،\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}
