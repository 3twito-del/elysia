"use client";

import { useActionState, useId } from "react";
import { useFormStatus } from "react-dom";
import { Heart } from "lucide-react";

import { saveWishlistItem, type PublicActionState } from "~/app/actions";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

const initialState: PublicActionState = {};

type ProductCardFavoriteButtonProps = {
  productName: string;
  productSlug: string;
};

export function ProductCardFavoriteButton({
  productName,
  productSlug,
}: ProductCardFavoriteButtonProps) {
  const [state, formAction] = useActionState(saveWishlistItem, initialState);
  const statusId = useId();
  const isSaved = state.ok === true;

  return (
    <form action={formAction} className="shrink-0">
      <input name="productSlug" type="hidden" value={productSlug} />
      <FavoriteSubmitButton
        isSaved={isSaved}
        productName={productName}
        statusId={state.message ? statusId : undefined}
      />
      <span
        className="sr-only"
        id={statusId}
        role={state.ok === false ? "alert" : "status"}
      >
        {state.message}
      </span>
    </form>
  );
}

function FavoriteSubmitButton({
  isSaved,
  productName,
  statusId,
}: {
  isSaved: boolean;
  productName: string;
  statusId?: string;
}) {
  const { pending } = useFormStatus();
  const label = pending
    ? `שומר למועדפים: ${productName}`
    : isSaved
      ? `נשמר למועדפים: ${productName}`
      : `שמירה למועדפים: ${productName}`;

  return (
    <Button
      aria-describedby={statusId}
      aria-label={label}
      className={cn(
        "h-10 w-10 shrink-0 rounded-md border border-transparent bg-transparent shadow-none",
        "hover:bg-background hover:text-foreground hover:border-[var(--glass-border-strong)] focus-visible:ring-3 focus-visible:ring-[var(--glass-focus)]",
        isSaved && "text-red-700 dark:text-red-300",
      )}
      data-icon-tooltip={isSaved ? "נשמר במועדפים" : "שמירה למועדפים"}
      data-icon-tooltip-placement="top"
      disabled={pending}
      size="icon"
      type="submit"
      variant="ghost"
    >
      <Heart
        aria-hidden="true"
        className={cn("size-4", isSaved && "fill-current")}
      />
    </Button>
  );
}
