"use client";

import { useActionState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

import { saveWishlistItem, type PublicActionState } from "~/app/actions";
import { Button } from "~/components/ui/button";
import { StatusMessage } from "~/components/ui/status-message";

const initialState: PublicActionState = {};

export function WishlistButton({
  productSlug,
  children,
}: {
  productSlug: string;
  children: ReactNode;
}) {
  const [state, formAction] = useActionState(saveWishlistItem, initialState);

  return (
    <form action={formAction} className="grid gap-2">
      <input name="productSlug" type="hidden" value={productSlug} />
      <SubmitButton>{children}</SubmitButton>
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

function SubmitButton({ children }: { children: ReactNode }) {
  const { pending } = useFormStatus();

  return (
    <Button
      className="w-full gap-2"
      disabled={pending}
      size="lg"
      type="submit"
      variant="outline"
    >
      {pending ? "שומר..." : children}
    </Button>
  );
}
