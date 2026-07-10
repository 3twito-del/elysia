"use client";

import { useActionState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { MapPin } from "lucide-react";

import { addCustomerAddressAction, type AccountActionState } from "../actions";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { StatusMessage } from "~/components/ui/status-message";

const initialState: AccountActionState = {};
const accountInputClassName = "h-12 px-4 text-base md:text-sm";
const accountLabelClassName = "mb-2 justify-start leading-5";

export function CustomerAddressForm() {
  const [state, action, pending] = useActionState(
    addCustomerAddressAction,
    initialState,
  );
  const fieldErrors = state.fieldErrors ?? {};

  return (
    <form action={action} className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <AddressField
          error={fieldErrors.label}
          id="address-label"
          label="שם כתובת"
        >
          <Input
            autoComplete="address-line3"
            className={accountInputClassName}
            disabled={pending}
            id="address-label"
            maxLength={80}
            name="label"
            placeholder="בית / עבודה"
          />
        </AddressField>
        <AddressField
          error={fieldErrors.recipient}
          id="address-recipient"
          label="שם מקבל"
          required
        >
          <Input
            aria-describedby="address-recipient-error"
            aria-invalid={Boolean(fieldErrors.recipient)}
            autoComplete="name"
            className={accountInputClassName}
            disabled={pending}
            id="address-recipient"
            maxLength={80}
            minLength={2}
            name="recipient"
            required
          />
        </AddressField>
        <AddressField
          error={fieldErrors.phone}
          id="address-phone"
          label="טלפון"
          required
        >
          <Input
            aria-describedby="address-phone-error"
            aria-invalid={Boolean(fieldErrors.phone)}
            autoComplete="tel"
            className={accountInputClassName}
            dir="ltr"
            disabled={pending}
            id="address-phone"
            inputMode="tel"
            maxLength={20}
            minLength={7}
            name="phone"
            placeholder="050..."
            required
          />
        </AddressField>
        <AddressField
          error={fieldErrors.city}
          id="address-city"
          label="עיר"
          required
        >
          <Input
            aria-describedby="address-city-error"
            aria-invalid={Boolean(fieldErrors.city)}
            autoComplete="address-level2"
            className={accountInputClassName}
            disabled={pending}
            id="address-city"
            maxLength={80}
            minLength={2}
            name="city"
            required
          />
        </AddressField>
        <AddressField
          error={fieldErrors.street}
          id="address-street"
          label="רחוב ומספר"
          required
        >
          <Input
            aria-describedby="address-street-error"
            aria-invalid={Boolean(fieldErrors.street)}
            autoComplete="street-address"
            className={accountInputClassName}
            disabled={pending}
            id="address-street"
            maxLength={120}
            minLength={2}
            name="street"
            required
          />
        </AddressField>
        <AddressField
          error={fieldErrors.postalCode}
          id="address-postal-code"
          label="מיקוד"
        >
          <Input
            aria-describedby="address-postal-code-error"
            aria-invalid={Boolean(fieldErrors.postalCode)}
            autoComplete="postal-code"
            className={accountInputClassName}
            dir="ltr"
            disabled={pending}
            id="address-postal-code"
            inputMode="numeric"
            maxLength={20}
            name="postalCode"
          />
        </AddressField>
      </div>
      {state.message ? (
        <StatusMessage tone={state.ok ? "success" : "error"} variant="plain">
          {state.message}
        </StatusMessage>
      ) : null}
      <SubmitButton />
    </form>
  );
}

function AddressField({
  children,
  error,
  id,
  label,
  required,
}: {
  children: ReactNode;
  error?: string;
  id: string;
  label: string;
  required?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <Label className={accountLabelClassName} htmlFor={id} required={required}>
        {label}
      </Label>
      {children}
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  return (
    <p className="text-destructive min-h-5 text-xs leading-5" id={id}>
      {message ?? ""}
    </p>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button className="w-fit gap-2" disabled={pending} type="submit">
      <MapPin aria-hidden="true" className="size-4" />
      שמירת כתובת
    </Button>
  );
}
