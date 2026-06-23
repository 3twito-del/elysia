"use client";

import { BarChart3, CheckCircle2, ShieldCheck } from "lucide-react";

import { Button } from "~/components/ui/button";
import {
  type CookieConsentValue,
  writeCookieConsent,
} from "~/lib/cookie-consent";
import { useCookieConsentValue } from "~/lib/use-cookie-consent";

export function CookiePreferencesPanel() {
  const consentValue = useCookieConsentValue();
  const statusText =
    consentValue === "all"
      ? "מאושרים קוקיז חיוניים וגם מדידה לשיפור האתר."
      : consentValue === "essential"
        ? "מאושרים קוקיז חיוניים בלבד."
        : "עדיין לא נשמרה העדפת קוקיז בדפדפן זה.";

  const chooseConsent = (value: CookieConsentValue) => {
    writeCookieConsent(value);
  };

  return (
    <section
      aria-describedby="cookie-preferences-status"
      aria-labelledby="cookie-preferences"
      data-testid="cookie-preferences-panel"
    >
      <div className="flex items-center gap-3">
        <ShieldCheck className="size-5" aria-hidden="true" />
        <h2 className="text-2xl font-semibold" id="cookie-preferences">
          ניהול העדפות קוקיז
        </h2>
      </div>

      <div className="glass-inset mt-4 rounded-md border p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p
              aria-live="polite"
              className="flex items-center gap-2 font-medium"
              data-testid="cookie-preferences-status"
              id="cookie-preferences-status"
              role="status"
            >
              <CheckCircle2 className="size-5" aria-hidden="true" />
              {statusText}
            </p>
            <p className="text-muted-foreground mt-2 leading-8">
              אפשר לשנות העדפה בכל רגע. ״רק חיוניים״ עוצר מדידה ומוחק צפיות
              אחרונות מהדפדפן.
            </p>
            <p className="text-muted-foreground mt-2 leading-8">
              אישור מדידה מאפשר ניתוח first-party של page views, צפיות מוצר,
              clicks וחיפושים. אירועי רכישה, תשלום ושירות נשמרים בנפרד כצורך
              עסקי, בלי לשמור IP raw או פרטים רגישים בתוך payload אנליטי.
            </p>
          </div>

          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <Button
              aria-describedby="cookie-preferences-status"
              aria-pressed={consentValue === "essential"}
              className="cookie-button-secondary"
              type="button"
              variant="outline"
              onClick={() => chooseConsent("essential")}
            >
              <ShieldCheck aria-hidden="true" className="size-4" />
              רק חיוניים
            </Button>
            <Button
              aria-describedby="cookie-preferences-status"
              aria-pressed={consentValue === "all"}
              className="cookie-button-primary"
              type="button"
              variant="default"
              onClick={() => chooseConsent("all")}
            >
              <BarChart3 aria-hidden="true" className="size-4" />
              אישור מדידה
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
