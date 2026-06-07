"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { Heart } from "lucide-react";

import { saveWishlistItem, type PublicActionState } from "~/app/actions";
import { Button } from "~/components/ui/button";
import { StatusMessage } from "~/components/ui/status-message";
import {
  isGuestWishlistSaved,
  removeGuestWishlistItem,
  saveGuestWishlistItem,
  subscribeToGuestWishlist,
} from "~/lib/guest-wishlist";
import { cn } from "~/lib/utils";

const initialState: PublicActionState = {};

type SavedServerState = {
  productSlug: string;
  saved: boolean;
};

type ProductCardFavoriteButtonProps = {
  productName: string;
  productSlug: string;
};

export function ProductCardFavoriteButton({
  productName,
  productSlug,
}: ProductCardFavoriteButtonProps) {
  const [state, setState] = useState(initialState);
  const [guestSaved, setGuestSaved] = useState(false);
  const [pending, setPending] = useState(false);
  const [serverSavedState, setServerSavedState] =
    useState<SavedServerState | null>(null);
  const statusId = useId();
  const serverSaved =
    serverSavedState?.productSlug === productSlug && serverSavedState.saved;
  const isSaved = guestSaved || serverSaved;
  const hasMessage = Boolean(state.message);

  useEffect(() => {
    const syncGuestSavedState = () => {
      setGuestSaved(isGuestWishlistSaved(productSlug));
    };

    syncGuestSavedState();
    return subscribeToGuestWishlist(syncGuestSavedState);
  }, [productSlug]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (pending) return;

    if (guestSaved) {
      removeGuestWishlistItem(productSlug);
      setGuestSaved(false);
      setServerSavedState({ productSlug, saved: false });
      setState({
        ok: true,
        saved: false,
        message: "הוסר מהמועדפים בדפדפן זה",
      });
      return;
    }

    const formData = new FormData(event.currentTarget);

    setPending(true);

    try {
      const nextState = await saveWishlistItem(initialState, formData);

      if (nextState.code === "AUTH_REQUIRED") {
        saveGuestWishlistItem(productSlug);
        setGuestSaved(true);
        setServerSavedState({ productSlug, saved: false });
        setState({
          ok: true,
          saved: true,
          message: "נשמר במועדפים בדפדפן זה",
        });
        return;
      }

      if (typeof nextState.saved === "boolean") {
        setServerSavedState({ productSlug, saved: nextState.saved });
      }

      setState(nextState);
    } catch {
      setState({ ok: false, message: "לא הצלחנו לשמור כרגע. נסו שוב." });
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="relative shrink-0" onSubmit={handleSubmit}>
      <input name="productSlug" type="hidden" value={productSlug} />
      <FavoriteSubmitButton
        canRemove={isSaved}
        hasMessage={hasMessage}
        isSaved={isSaved}
        pending={pending}
        productName={productName}
        statusId={hasMessage ? statusId : undefined}
      />
      {hasMessage ? (
        <StatusMessage
          className="product-card-favorite-status absolute top-[calc(100%+0.45rem)] right-0 z-30 w-max max-w-[min(16rem,calc(100vw-2rem))] rounded-md border bg-[var(--popover)] px-2.5 py-1.5 shadow-none"
          data-testid="product-card-favorite-feedback"
          id={statusId}
          role={state.ok === false ? "alert" : "status"}
          size="xs"
          tone={state.ok === false ? "error" : "neutral"}
          variant="plain"
        >
          {state.message}
        </StatusMessage>
      ) : null}
    </form>
  );
}

function FavoriteSubmitButton({
  canRemove,
  hasMessage,
  isSaved,
  pending,
  productName,
  statusId,
}: {
  canRemove: boolean;
  hasMessage: boolean;
  isSaved: boolean;
  pending: boolean;
  productName: string;
  statusId?: string;
}) {
  const label = pending
    ? `שומר למועדפים: ${productName}`
    : isSaved
      ? `נשמר במועדפים: ${productName}`
      : `שמירה למועדפים: ${productName}`;

  return (
    <Button
      aria-describedby={statusId}
      aria-label={canRemove ? `הסרה מהמועדפים: ${productName}` : label}
      aria-pressed={isSaved}
      className={cn(
        "product-card-favorite-button h-10 w-10 shrink-0 rounded-md border border-transparent bg-transparent text-[var(--foreground)] shadow-none",
        "hover:border-[rgb(29_25_22_/_18%)] hover:bg-[rgb(255_250_244_/_94%)] hover:text-[var(--foreground)] focus-visible:ring-3 focus-visible:ring-[var(--glass-focus)]",
        isSaved &&
          "border-[rgb(29_25_22_/_18%)] bg-[rgb(255_250_244_/_94%)] text-[var(--foreground)]",
      )}
      data-favorite-saved={isSaved ? "true" : "false"}
      data-icon-tooltip={
        hasMessage ? undefined : isSaved ? "נשמר במועדפים" : "שמירה למועדפים"
      }
      data-icon-tooltip-placement="bottom"
      disabled={pending}
      size="icon"
      type="submit"
      variant="ghost"
    >
      <Heart aria-hidden="true" className="size-4 fill-transparent" />
    </Button>
  );
}
