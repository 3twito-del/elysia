"use client";

import { useActionState } from "react";
import { Trash2 } from "lucide-react";

import { deleteCustomerAddressAction } from "../actions";
import { Button } from "~/components/ui/button";
import { StatusMessage } from "~/components/ui/status-message";

export function RemoveAddressButton({
  addressId,
  addressLabel,
}: {
  addressId: string;
  addressLabel: string;
}) {
  const [state, action, pending] = useActionState(
    deleteCustomerAddressAction,
    {},
  );

  return (
    <form action={action} className="relative">
      <input name="addressId" type="hidden" value={addressId} />
      <Button
        aria-label={`הסרת כתובת: ${addressLabel}`}
        disabled={pending}
        size="icon-sm"
        type="submit"
        variant="ghost"
      >
        <Trash2 aria-hidden="true" className="size-4" />
        <span className="sr-only">הסרת כתובת</span>
      </Button>
      {state.ok === false && state.message ? (
        <StatusMessage
          className="absolute top-[calc(100%+0.35rem)] right-0 z-30 w-max max-w-[min(16rem,calc(100vw-2rem))] rounded-md border bg-[var(--popover)] px-2.5 py-1.5 shadow-none"
          role="alert"
          size="xs"
          tone="error"
          variant="plain"
        >
          {state.message}
        </StatusMessage>
      ) : null}
    </form>
  );
}
