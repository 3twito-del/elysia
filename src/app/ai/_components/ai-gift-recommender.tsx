"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { Gift, Sparkles } from "lucide-react";

import { AiProductRecommendations } from "~/components/ai-product-recommendations";
import { MessageResponse } from "~/components/ai-elements/message";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Spinner } from "~/components/ui/spinner";
import { Textarea } from "~/components/ui/textarea";
import { api } from "~/trpc/react";

export function AiGiftRecommender() {
  const [relation, setRelation] = useState("אמא");
  const [occasion, setOccasion] = useState("יום הולדת");
  const [budget, setBudget] = useState("700");
  const [style, setStyle] = useState("עדין, יומיומי");
  const recommendGift = api.ai.recommendGift.useMutation();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    recommendGift.mutate({
      relation,
      occasion,
      budget: Number(budget),
      style: splitStyleInput(style),
    });
  }

  return (
    <div className="glass-panel grid gap-6 rounded-md border p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 text-sm font-medium">
            <Gift className="size-4" />
            התאמת מתנה
          </div>
          <h2 className="text-2xl font-semibold">שאלון מתנה חכם</h2>
          <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
            הזינו קשר, אירוע, תקציב וסגנון. ההמלצות יישארו בתוך מוצרים קיימים
            בקטלוג.
          </p>
        </div>
        <Sparkles className="text-foreground size-6" />
      </div>

      <form className="grid gap-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-3">
          <Field htmlFor="ai-gift-relation" label="למי המתנה">
            <Input
              id="ai-gift-relation"
              onChange={(event) => setRelation(event.currentTarget.value)}
              required
              value={relation}
            />
          </Field>
          <Field htmlFor="ai-gift-occasion" label="אירוע">
            <Input
              id="ai-gift-occasion"
              onChange={(event) => setOccasion(event.currentTarget.value)}
              required
              value={occasion}
            />
          </Field>
          <Field htmlFor="ai-gift-budget" label="תקציב">
            <Input
              id="ai-gift-budget"
              min={1}
              onChange={(event) => setBudget(event.currentTarget.value)}
              required
              type="number"
              value={budget}
            />
          </Field>
        </div>

        <Field htmlFor="ai-gift-style" label="סגנון">
          <Textarea
            className="min-h-24"
            id="ai-gift-style"
            onChange={(event) => setStyle(event.currentTarget.value)}
            placeholder="לדוגמה: עדין, זהב לבן, שימוש יומיומי"
            value={style}
          />
        </Field>

        {recommendGift.error ? (
          <p className="text-sm text-red-700">{recommendGift.error.message}</p>
        ) : null}

        <Button
          className="w-fit gap-2"
          disabled={recommendGift.isPending || Number(budget) <= 0}
          type="submit"
        >
          {recommendGift.isPending ? (
            <Spinner />
          ) : (
            <Sparkles className="size-4" />
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
            title="מוצרים מומלצים למתנה"
          />
          {recommendGift.data.products.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              לא נמצאו מוצרים זמינים בתקציב ובסגנון שבחרת.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Field({
  children,
  htmlFor,
  label,
}: {
  children: ReactNode;
  htmlFor: string;
  label: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

function splitStyleInput(value: string) {
  return value
    .split(/[,،\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}
