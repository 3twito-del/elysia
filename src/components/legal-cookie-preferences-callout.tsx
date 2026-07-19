import Link from "next/link";
import { Cookie, ShieldCheck } from "lucide-react";

import { cookiePreferencesLink } from "~/lib/legal-content";

type LegalCookiePreferencesCalloutProps = {
  testId?: string;
};

export function LegalCookiePreferencesCallout({
  testId = "legal-cookie-preferences-callout",
}: LegalCookiePreferencesCalloutProps) {
  return (
    <section
      aria-label="ניהול העדפות קוקיז"
      className="grid gap-3 rounded-md border border-[var(--glass-border)] p-4 text-sm sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center"
      data-testid={testId}
    >
      <span className="glass-inset grid size-10 place-items-center rounded-md border">
        <Cookie aria-hidden="true" className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="block font-medium">העדפות קוקיז ומדידה</span>
        <span className="text-muted-foreground mt-1 block leading-6">
          ניתן לעדכן בכל רגע אם מאשרים מדידה או רק קוקיז חיוניים.
        </span>
      </span>
      <Link
        className="border-border hover:border-[var(--glass-border-hover)] hover:bg-[var(--glass-hover-overlay)] inline-flex min-h-9 items-center justify-center gap-2 rounded-md border px-3 font-medium transition"
        href={cookiePreferencesLink.href}
      >
        <ShieldCheck aria-hidden="true" className="size-4" />
        {cookiePreferencesLink.label}
      </Link>
    </section>
  );
}
