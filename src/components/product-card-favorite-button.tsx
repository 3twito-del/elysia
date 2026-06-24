"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
} from "react";
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
const FAVORITE_REMOVAL_VISUAL_DELAY_MS = 3_000;

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
  const [visuallySaved, setVisuallySaved] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const previousSavedRef = useRef(false);
  const pointerInsideCardRef = useRef(false);
  const removalStartedAtRef = useRef<number | null>(null);
  const removalTimeoutRef = useRef<number | null>(null);
  const statusId = useId();
  const serverSaved =
    serverSavedState?.productSlug === productSlug && serverSavedState.saved;
  const isSaved = guestSaved || serverSaved;
  const hasMessage = Boolean(state.message);

  useEffect(() => {
    const syncGuestSavedState = () => {
      const nextGuestSaved = isGuestWishlistSaved(productSlug);

      setGuestSaved(nextGuestSaved);
      if (nextGuestSaved) {
        setVisuallySaved(true);
      }
    };

    syncGuestSavedState();
    return subscribeToGuestWishlist(syncGuestSavedState);
  }, [productSlug]);

  const clearRemovalTimeout = useCallback(() => {
    if (removalTimeoutRef.current === null) return;

    window.clearTimeout(removalTimeoutRef.current);
    removalTimeoutRef.current = null;
  }, []);

  const maybeHideRemovedFavorite = useCallback(() => {
    const removalStartedAt = removalStartedAtRef.current;

    clearRemovalTimeout();

    if (removalStartedAt === null) return;

    const remainingDelay = Math.max(
      FAVORITE_REMOVAL_VISUAL_DELAY_MS - (Date.now() - removalStartedAt),
      0,
    );

    if (pointerInsideCardRef.current) return;

    if (remainingDelay === 0) {
      removalStartedAtRef.current = null;
      setVisuallySaved(false);
      return;
    }

    removalTimeoutRef.current = window.setTimeout(() => {
      removalTimeoutRef.current = null;

      if (pointerInsideCardRef.current) return;

      removalStartedAtRef.current = null;
      setVisuallySaved(false);
    }, remainingDelay);
  }, [clearRemovalTimeout]);

  useEffect(() => {
    if (isSaved) {
      previousSavedRef.current = true;
      removalStartedAtRef.current = null;
      clearRemovalTimeout();
      return;
    }

    if (previousSavedRef.current && removalStartedAtRef.current === null) {
      removalStartedAtRef.current = Date.now();
      maybeHideRemovedFavorite();
    }

    previousSavedRef.current = false;
  }, [clearRemovalTimeout, isSaved, maybeHideRemovedFavorite]);

  useEffect(() => {
    const card = formRef.current?.closest<HTMLElement>(
      '[data-testid="product-card"]',
    );

    if (!card) return;

    pointerInsideCardRef.current = card.matches(":hover");

    const handlePointerEnter = () => {
      pointerInsideCardRef.current = true;
      clearRemovalTimeout();
    };
    const handlePointerLeave = () => {
      pointerInsideCardRef.current = false;
      maybeHideRemovedFavorite();
    };

    card.addEventListener("pointerenter", handlePointerEnter);
    card.addEventListener("pointerleave", handlePointerLeave);

    return () => {
      card.removeEventListener("pointerenter", handlePointerEnter);
      card.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, [clearRemovalTimeout, maybeHideRemovedFavorite]);

  useEffect(() => {
    return clearRemovalTimeout;
  }, [clearRemovalTimeout]);

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
        setVisuallySaved(true);
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
        if (nextState.saved) {
          setVisuallySaved(true);
        }
      }

      setState(nextState);
    } catch {
      setState({ ok: false, message: "לא הצלחנו לשמור כרגע. נסו שוב." });
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="relative shrink-0" onSubmit={handleSubmit} ref={formRef}>
      <input name="productSlug" type="hidden" value={productSlug} />
      <FavoriteSubmitButton
        canRemove={isSaved}
        hasMessage={hasMessage}
        isSaved={isSaved}
        pending={pending}
        productName={productName}
        statusId={hasMessage ? statusId : undefined}
        visuallySaved={visuallySaved}
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
  visuallySaved,
}: {
  canRemove: boolean;
  hasMessage: boolean;
  isSaved: boolean;
  pending: boolean;
  productName: string;
  statusId?: string;
  visuallySaved: boolean;
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
        "product-card-favorite-button h-10 w-10 shrink-0 rounded-full border border-transparent !bg-transparent text-[var(--foreground)] shadow-none",
        "hover:border-transparent hover:!bg-transparent hover:text-[var(--foreground)] focus-visible:ring-3 focus-visible:ring-[var(--glass-focus)]",
      )}
      data-favorite-saved={visuallySaved ? "true" : "false"}
      data-icon-tooltip={
        hasMessage || visuallySaved ? undefined : "שמירה למועדפים"
      }
      data-icon-tooltip-placement="bottom"
      disabled={pending}
      size="icon"
      type="submit"
      variant="ghost"
    >
      <Heart aria-hidden="true" className="size-[1.15rem] fill-transparent" />
    </Button>
  );
}
