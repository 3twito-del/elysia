"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { MapPin } from "lucide-react";

import { addCustomerAddressAction, type AccountActionState } from "../actions";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

const initialState: AccountActionState = {};

export function CustomerAddressForm() {
  const [state, action] = useActionState(
    addCustomerAddressAction,
    initialState,
  );

  return (
    <form action={action} className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Input name="label" placeholder="שם כתובת" />
        <Input name="recipient" placeholder="שם מקבל" required />
        <Input name="phone" placeholder="טלפון" required />
        <Input name="city" placeholder="עיר" required />
        <Input name="street" placeholder="רחוב ומספר" required />
        <Input name="postalCode" placeholder="מיקוד" />
      </div>
      {state.message ? (
        <p
          className={
            state.ok ? "text-sm text-emerald-700" : "text-sm text-red-700"
          }
        >
          {state.message}
        </p>
      ) : null}
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button className="w-fit gap-2" disabled={pending} type="submit">
      <MapPin className="size-4" />
      שמירת כתובת
    </Button>
  );
}
