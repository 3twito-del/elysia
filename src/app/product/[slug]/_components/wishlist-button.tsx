"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";

import { saveWishlistItem, type PublicActionState } from "~/app/actions";
import { Button } from "~/components/ui/button";
import { StatusMessage } from "~/components/ui/status-message";
import {
  isGuestWishlistSaved,
  saveGuestWishlistItem,
  subscribeToGuestWishlist,
} from "~/lib/guest-wishlist";

const initialState: PublicActionState = {};

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

    const formData = new FormData(event.currentTarget);

    setPending(true);

    try {
      const nextState = await saveWishlistItem(initialState, formData);

      if (nextState.code === "AUTH_REQUIRED") {
        saveGuestWishlistItem(productSlug);
        setGuestSaved(true);
        setState({ ok: true, message: "נשמר במועדפים בדפדפן זה" });
        return;
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
      <SubmitButton isSaved={state.ok === true || guestSaved} pending={pending}>
        {children}
      </SubmitButton>
      {state.message ? (
        <StatusMessage
          size="xs"
          tone={state.ok ? "success" : "error"}
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
      className="w-full gap-2"
      disabled={pending}
      size="lg"
      type="submit"
      variant="outline"
    >
      {children}
    </Button>
  );
}
