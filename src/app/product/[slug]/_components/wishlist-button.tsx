"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";

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

export function WishlistButton({
  productSlug,
  children,
}: {
  productSlug: string;
  children: ReactNode;
}) {
  const [state, setState] = useState(initialState);
  const [guestSaved, setGuestSaved] = useState(false);
  const [pending, setPending] = useState(false);
  const [serverSavedState, setServerSavedState] =
    useState<SavedServerState | null>(null);
  const serverSaved =
    serverSavedState?.productSlug === productSlug && serverSavedState.saved;
  const isSaved = guestSaved || serverSaved;

  useEffect(() => {
    const syncGuestSavedState = () => {
      setGuestSaved(isGuestWishlistSaved(productSlug));
    };

    syncGuestSavedState();
    return subscribeToGuestWishlist(syncGuestSavedState);
  }, [productSlug]);

  useEffect(() => {
    if (!state.message || state.ok === false) return;

    const message = state.message;
    const ok = state.ok;
    const timeoutId = window.setTimeout(() => {
      setState((current) =>
        current.message === message && current.ok === ok
          ? { ...current, message: undefined }
          : current,
      );
    }, 1800);

    return () => window.clearTimeout(timeoutId);
  }, [state.message, state.ok]);

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
    <form className="grid gap-2" onSubmit={handleSubmit}>
      <input name="productSlug" type="hidden" value={productSlug} />
      <SubmitButton isSaved={isSaved} pending={pending}>
        {children}
      </SubmitButton>
      {state.message ? (
        <StatusMessage
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

function SubmitButton({
  children,
  isSaved,
  pending,
}: {
  children: ReactNode;
  isSaved: boolean;
  pending: boolean;
}) {
  return (
    <Button
      aria-pressed={isSaved}
      className={cn(
        "product-wishlist-button w-full gap-2",
        isSaved && "text-[var(--foreground)]",
      )}
      data-favorite-saved={isSaved ? "true" : "false"}
      disabled={pending}
      size="lg"
      type="submit"
      variant="outline"
    >
      {children}
    </Button>
  );
}
