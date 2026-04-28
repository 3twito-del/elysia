"use client";

import { useActionState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

import { saveWishlistItem, type PublicActionState } from "~/app/actions";
import { Button } from "~/components/ui/button";

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
        <p
          className={`text-xs leading-5 ${
            state.ok ? "text-emerald-700" : "text-red-700"
          }`}
        >
          {state.message}
        </p>
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
