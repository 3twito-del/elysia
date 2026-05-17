export type CheckoutFulfillmentMethod = "DELIVERY" | "PICKUP";

export type CheckoutField =
  | "branchSlug"
  | "city"
  | "email"
  | "name"
  | "phone"
  | "quantity"
  | "session"
  | "street";

export type CheckoutFieldErrors = Partial<Record<CheckoutField, string>>;

export type CheckoutValidationInput = {
  branchSlug?: string | null;
  cartItemCount?: number;
  city?: string;
  email?: string;
  fulfillmentMethod: CheckoutFulfillmentMethod;
  name?: string;
  phone?: string;
  quantity?: number;
  requireCart?: boolean;
  requireQuantity?: boolean;
  sessionReady?: boolean;
  street?: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;
const phonePattern = /^[\d+\-()\s]{7,20}$/u;

export function validateCheckoutFields({
  cartItemCount = 1,
  city = "",
  email = "",
  fulfillmentMethod,
  name = "",
  phone = "",
  quantity = 1,
  requireCart = false,
  requireQuantity = false,
  sessionReady = true,
  street = "",
}: CheckoutValidationInput): CheckoutFieldErrors {
  const errors: CheckoutFieldErrors = {};

  if (!sessionReady) {
    errors.session = "יצירת סל מקומי עדיין בטעינה.";
  }

  if (requireCart && cartItemCount < 1) {
    errors.quantity = "יש להוסיף לפחות פריט אחד לסל.";
  }

  if (requireQuantity && (!Number.isInteger(quantity) || quantity < 1)) {
    errors.quantity = "יש לבחור כמות תקינה.";
  }

  if (name.trim().length < 2) {
    errors.name = "יש להזין שם מלא.";
  }

  if (!phonePattern.test(phone.trim())) {
    errors.phone = "יש להזין טלפון תקין.";
  }

  if (!emailPattern.test(email.trim())) {
    errors.email = "יש להזין אימייל תקין.";
  }

  if (fulfillmentMethod === "DELIVERY") {
    if (city.trim().length < 2) {
      errors.city = "יש להזין עיר למשלוח.";
    }

    if (street.trim().length < 2) {
      errors.street = "יש להזין רחוב ומספר.";
    }
  }

  return errors;
}

export function getCheckoutIssueList(errors: CheckoutFieldErrors) {
  return Object.values(errors).filter((error): error is string =>
    Boolean(error),
  );
}

export function hasCheckoutErrors(errors: CheckoutFieldErrors) {
  return getCheckoutIssueList(errors).length > 0;
}
