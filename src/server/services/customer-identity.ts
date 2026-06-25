import { db } from "~/server/db";

/**
 * Customer identity resolution / CDP (CRM, Phase 2).
 *
 * Surfaces likely-duplicate customers that share a normalized email or phone, so
 * staff can reconcile them. Detection is read-only and non-destructive; the
 * matching helpers are pure and exported for unit testing.
 */

/** Lowercased, trimmed email or null when empty. Pure. */
export function normalizeEmail(email: string | null | undefined): string | null {
  const value = (email ?? "").trim().toLowerCase();
  return value.length > 0 ? value : null;
}

/** Digits-only phone (≥7 digits) or null. Pure. */
export function normalizePhone(phone: string | null | undefined): string | null {
  const digits = (phone ?? "").replace(/\D/g, "");
  return digits.length >= 7 ? digits : null;
}

export type IdentityCustomer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
};

export type DuplicateGroup = {
  type: "email" | "phone";
  key: string;
  customers: IdentityCustomer[];
};

/** Groups customers sharing a normalized email or phone (size ≥ 2). Pure. */
export function findDuplicateGroups(
  customers: IdentityCustomer[],
): DuplicateGroup[] {
  const byEmail = new Map<string, IdentityCustomer[]>();
  const byPhone = new Map<string, IdentityCustomer[]>();

  for (const customer of customers) {
    const email = normalizeEmail(customer.email);
    if (email) {
      byEmail.set(email, [...(byEmail.get(email) ?? []), customer]);
    }
    const phone = normalizePhone(customer.phone);
    if (phone) {
      byPhone.set(phone, [...(byPhone.get(phone) ?? []), customer]);
    }
  }

  const groups: DuplicateGroup[] = [];
  for (const [key, list] of byEmail) {
    if (list.length >= 2) groups.push({ type: "email", key, customers: list });
  }
  for (const [key, list] of byPhone) {
    if (list.length >= 2) groups.push({ type: "phone", key, customers: list });
  }

  return groups;
}

/** Duplicate customer groups across the customer base (read-only). */
export async function getDuplicateCustomerGroups(limit = 2000) {
  const customers = await db.customer.findMany({
    take: limit,
    select: { id: true, email: true, phone: true, firstName: true, lastName: true },
  });

  return findDuplicateGroups(
    customers.map((customer) => {
      const name = [customer.firstName, customer.lastName]
        .filter(Boolean)
        .join(" ")
        .trim();
      return {
        id: customer.id,
        name: name.length > 0 ? name : (customer.email ?? "לקוח ללא שם"),
        email: customer.email,
        phone: customer.phone,
      };
    }),
  );
}
