/**
 * Israeli master-data validators (MDM-007): national ID (ת.ז), company/registered
 * dealer number (ח.פ / ע.מ), IBAN, and phone/email format. All pure + unit-tested.
 */

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Validates an Israeli ID / company number (ת.ז / ח.פ / ע.מ) by its check digit.
 * Both use the same weighted (1,2,1,2…) mod-10 algorithm over 9 digits. Pure.
 */
export function isValidIsraeliId(value: string): boolean {
  const digits = digitsOnly(value);
  if (digits.length === 0 || digits.length > 9) return false;

  const padded = digits.padStart(9, "0");
  let sum = 0;
  for (let i = 0; i < 9; i += 1) {
    let product = Number(padded[i]) * ((i % 2) + 1);
    if (product > 9) product -= 9;
    sum += product;
  }
  return sum % 10 === 0;
}

/** Alias for company/registered-dealer numbers (same algorithm). Pure. */
export function isValidCompanyId(value: string): boolean {
  return isValidIsraeliId(value);
}

/**
 * Validates an IBAN by the ISO 13616 mod-97 check (optionally enforcing a
 * country's fixed length, e.g. IL = 23). Pure.
 */
export function isValidIban(value: string, expectedLength?: number): boolean {
  const iban = value.replace(/\s+/g, "").toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(iban)) return false;
  if (iban.length < 15 || iban.length > 34) return false;
  if (expectedLength != null && iban.length !== expectedLength) return false;

  // Move the first four chars to the end, convert letters to numbers (A=10..Z=35).
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  let remainder = 0;
  for (const char of rearranged) {
    const code = /[A-Z]/.test(char)
      ? String(char.charCodeAt(0) - 55)
      : char;
    for (const digit of code) {
      remainder = (remainder * 10 + Number(digit)) % 97;
    }
  }
  return remainder === 1;
}

/** Validates an Israeli IBAN (country IL, 23 chars). Pure. */
export function isValidIsraeliIban(value: string): boolean {
  const iban = value.replace(/\s+/g, "").toUpperCase();
  return iban.startsWith("IL") && isValidIban(iban, 23);
}

/**
 * Validates an Israeli phone number: landline 0X-XXXXXXX (9 digits) or mobile
 * 05X-XXXXXXX (10 digits), optionally in +972 form. Pure.
 */
export function isValidIsraeliPhone(value: string): boolean {
  let digits = digitsOnly(value);
  if (digits.startsWith("972")) digits = `0${digits.slice(3)}`;
  if (!digits.startsWith("0")) return false;
  if (digits.startsWith("05")) return digits.length === 10;
  return digits.length === 9;
}

/** Basic email format validation. Pure. */
export function isValidEmail(value: string): boolean {
  const email = value.trim();
  if (email.length === 0 || email.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
