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
              אפשר לשנות את ההעדפה בכל עת. בחירה ב״רק חיוניים״ מפסיקה את
              המדידה ומוחקת את היסטוריית הצפייה מהדפדפן.
            </p>
            <p className="text-muted-foreground mt-2 leading-8">
              אישור מדידה מאפשר לנו לנתח את השימוש באתר — צפיות בעמודים
              ובמוצרים, הקלקות וחיפושים — לצורך שיפור השירות. נתוני רכישה,
              תשלום ושירות נשמרים בנפרד לצורך תפעולי, ללא כתובת IP מלאה וללא
              פרטים רגישים.
            </p>
          </div>

          <p className="text-muted-foreground mt-2 leading-8 lg:max-w-3xl">
            אישור מלא מאפשר גם תיעוד ממוסך של חוויית הגלישה וניתוח תהליך
            הרכישה, במערכת פנימית בלבד. בחירה ב״רק חיוניים״ מפסיקה את איסוף
            נתוני הגלישה; נתוני הזמנות ושירות נשמרים כנדרש לתפעול בלבד, ללא
            כתובת IP מלאה.
          </p>

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
