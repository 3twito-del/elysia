"use client";

import Link from "next/link";
import { Cookie, Settings } from "lucide-react";

import { Button } from "~/components/ui/button";
import {
  type CookieConsentValue,
  writeCookieConsent,
} from "~/lib/cookie-consent";
import { useCookieConsentValue } from "~/lib/use-cookie-consent";

export function CookieConsentBanner() {
  const consentValue = useCookieConsentValue();

  if (consentValue !== null) return null;

  const chooseConsent = (value: CookieConsentValue) => {
    writeCookieConsent(value);
  };

  return (
    <section
      aria-label="בחירת קוקיז"
      className="bg-background/95 fixed inset-x-0 bottom-0 z-50 border-t border-[var(--glass-border)] px-4 py-4 shadow-[0_-14px_40px_oklch(0_0_0_/_10%)] backdrop-blur-xl sm:px-6"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-3">
          <div className="glass-inset mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-md border">
            <Cookie className="size-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold">
              בחירת קוקיז באתר Aphrodite
            </h2>
            <p className="text-muted-foreground mt-1 max-w-3xl text-sm leading-7">
              אנו משתמשים בקוקיז חיוניים להפעלת האתר והסל. באישורכם נשתמש גם
              במדידה ושיפור חוויית הקנייה, כולל מוצרים שנצפו לאחרונה.
              <Link
                className="text-foreground ms-1 underline underline-offset-4"
                href="/privacy"
              >
                מדיניות פרטיות
              </Link>
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <Button
            className="sm:min-w-32"
            type="button"
            variant="outline"
            onClick={() => chooseConsent("essential")}
          >
            <Settings className="size-4" />
            הכרחי בלבד
          </Button>
          <Button
            className="sm:min-w-32"
            type="button"
            onClick={() => chooseConsent("all")}
          >
            אישור הכל
          </Button>
        </div>
      </div>
    </section>
  );
}
