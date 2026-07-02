import type { ReactNode } from "react";
import Link from "next/link";
import { Mail, Phone } from "lucide-react";

import { Button } from "~/components/ui/button";

export type LegalContact = {
  email: string;
  phoneHref: string;
  phoneDisplay: string;
};

/**
 * The email + phone card pair shared by every public legal/content page.
 * Kept in one place so the markup, styling and a11y stay identical.
 */
export function LegalContactGrid({ contact }: { contact: LegalContact }) {
  return (
    <div className="mt-5 grid gap-3 sm:grid-cols-2">
      <a
        className="glass-inset hover:text-foreground flex items-center gap-3 rounded-md border p-4 transition"
        href={`mailto:${contact.email}`}
      >
        <Mail className="size-5" aria-hidden="true" />
        <span>{contact.email}</span>
      </a>
      <a
        className="glass-inset hover:text-foreground flex items-center gap-3 rounded-md border p-4 transition"
        href={contact.phoneHref}
      >
        <Phone className="size-5" aria-hidden="true" />
        <span>{contact.phoneDisplay}</span>
      </a>
    </div>
  );
}

/**
 * A full "contact us" section: heading, intro copy, a service-request button
 * and the shared contact grid. Used by the accessibility, privacy, terms,
 * FAQ and shipping/returns pages.
 */
export function LegalContactSection({
  id,
  title,
  description,
  action,
  contact,
}: {
  id: string;
  title: string;
  description: ReactNode;
  action: { href: string; label: string; testId?: string };
  contact: LegalContact;
}) {
  return (
    <section aria-labelledby={id}>
      <h2 className="text-2xl font-semibold" id={id}>
        {title}
      </h2>
      <p className="text-muted-foreground mt-3 leading-8">{description}</p>
      <Button asChild className="mt-5" variant="secondary">
        <Link data-testid={action.testId} href={action.href}>
          {action.label}
        </Link>
      </Button>
      <LegalContactGrid contact={contact} />
    </section>
  );
}
