"use client";

import Link from "next/link";
import { Cookie, Settings } from "lucide-react";
import { useEffect, useRef } from "react";

import { Button } from "~/components/ui/button";
import {
  type CookieConsentValue,
  writeCookieConsent,
} from "~/lib/cookie-consent";
import { useCookieConsentValue } from "~/lib/use-cookie-consent";

export function CookieConsentBanner() {
  const consentValue = useCookieConsentValue();
  const bannerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = document.documentElement;

    if (consentValue !== null) {
      root.style.removeProperty("--floating-stack-bottom");
      return;
    }

    const syncOffset = () => {
      const height = bannerRef.current?.getBoundingClientRect().height ?? 0;
      root.style.setProperty("--floating-stack-bottom", `${height + 24}px`);
    };

    syncOffset();

    if (typeof ResizeObserver === "undefined" || !bannerRef.current) {
      window.addEventListener("resize", syncOffset);

      return () => {
        window.removeEventListener("resize", syncOffset);
        root.style.removeProperty("--floating-stack-bottom");
      };
    }

    const observer = new ResizeObserver(syncOffset);
    observer.observe(bannerRef.current);
    window.addEventListener("resize", syncOffset);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncOffset);
      root.style.removeProperty("--floating-stack-bottom");
    };
  }, [consentValue]);

  if (consentValue !== null) return null;

  const chooseConsent = (value: CookieConsentValue) => {
    writeCookieConsent(value);
  };

  return (
    <section
      aria-label="בחירת קוקיז"
      className="popup-surface fixed inset-x-3 bottom-3 z-50 max-h-[min(54dvh,24rem)] overflow-y-auto rounded-md border px-4 py-3 backdrop-blur-xl sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[min(35rem,calc(100vw-3rem))] sm:px-5 sm:py-4"
      ref={bannerRef}
    >
      <div className="grid gap-4">
        <div className="flex min-w-0 gap-3">
          <div className="glass-inset mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-md border">
            <Cookie className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold sm:text-base">
              בחירת קוקיז באתר Aphrodite
            </h2>
            <p className="text-muted-foreground mt-1 max-w-3xl text-xs leading-6 sm:text-sm sm:leading-7">
              אנו משתמשים בקוקיז חיוניים להפעלת האתר והסל. באישורכם נשתמש גם
              במדידה ושיפור חוויית הקנייה, כולל מוצרים שנצפו לאחרונה. סירוב לא
              יפגע בשירותים חיוניים, וניתן לשנות את הבחירה בכל עת דרך מדיניות
              הפרטיות.
              <Link
                className="text-foreground ms-1 underline underline-offset-4"
                href="/privacy"
              >
                מדיניות פרטיות
              </Link>
            </p>
          </div>
        </div>

        <div className="grid shrink-0 grid-cols-2 gap-2">
          <Button
            className="min-h-10 text-xs sm:min-h-11 sm:text-sm"
            type="button"
            variant="outline"
            onClick={() => chooseConsent("essential")}
          >
            <Settings className="size-4" />
            הכרחי בלבד
          </Button>
          <Button
            className="min-h-10 text-xs sm:min-h-11 sm:text-sm"
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
