"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckCircle2, Cookie, Settings } from "lucide-react";
import { useEffect, useRef } from "react";

import { Button } from "~/components/ui/button";
import {
  type CookieConsentValue,
  writeCookieConsent,
} from "~/lib/cookie-consent";
import { useCookieConsentValue } from "~/lib/use-cookie-consent";

export function CookieConsentBanner() {
  const pathname = usePathname();
  const consentValue = useCookieConsentValue();
  const bannerRef = useRef<HTMLElement>(null);
  const isAdminRoute = pathname.startsWith("/admin");

  useEffect(() => {
    const root = document.documentElement;

    if (isAdminRoute || consentValue !== null) {
      delete root.dataset.cookieBannerOpen;
      root.style.removeProperty("--floating-stack-bottom");
      root.style.removeProperty("--public-bottom-safe-offset");
      root.style.removeProperty("--public-cookie-top-offset");
      return;
    }

    root.dataset.cookieBannerOpen = "true";

    const syncOffset = () => {
      const height = bannerRef.current?.getBoundingClientRect().height ?? 0;
      root.style.setProperty("--floating-stack-bottom", `${height + 16}px`);
      root.style.setProperty("--public-bottom-safe-offset", `${height}px`);
      root.style.setProperty("--public-cookie-top-offset", `${height + 8}px`);
    };

    syncOffset();

    if (typeof ResizeObserver === "undefined" || !bannerRef.current) {
      window.addEventListener("resize", syncOffset);

      return () => {
        window.removeEventListener("resize", syncOffset);
        delete root.dataset.cookieBannerOpen;
        root.style.removeProperty("--floating-stack-bottom");
        root.style.removeProperty("--public-bottom-safe-offset");
        root.style.removeProperty("--public-cookie-top-offset");
      };
    }

    const observer = new ResizeObserver(syncOffset);
    observer.observe(bannerRef.current);
    window.addEventListener("resize", syncOffset);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncOffset);
      delete root.dataset.cookieBannerOpen;
      root.style.removeProperty("--floating-stack-bottom");
      root.style.removeProperty("--public-bottom-safe-offset");
      root.style.removeProperty("--public-cookie-top-offset");
    };
  }, [consentValue, isAdminRoute]);

  if (isAdminRoute || consentValue !== null) return null;

  const chooseConsent = (value: CookieConsentValue) => {
    writeCookieConsent(value);
  };

  return (
    <section
      aria-label="בחירת קוקיז"
      className="bg-background fixed inset-x-3 top-[calc(var(--site-header-height)+0.5rem+env(safe-area-inset-top))] bottom-auto z-50 max-h-[28dvh] overflow-y-auto rounded-md border border-[var(--glass-border)] px-3 py-2 shadow-[0_-10px_28px_oklch(0_0_0_/_9%)] sm:inset-x-auto sm:top-auto sm:right-4 sm:bottom-4 sm:max-h-[32dvh] sm:w-[min(calc(100vw-2rem),22rem)] sm:px-4 sm:py-3"
      ref={bannerRef}
    >
      <div className="grid gap-2">
        <div className="flex min-w-0 gap-2 sm:gap-3">
          <div className="glass-inset mt-0.5 hidden size-10 shrink-0 items-center justify-center rounded-md border sm:flex">
            <Cookie className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xs font-semibold sm:text-base">
              בחירת קוקיז באתר Aphrodite
            </h2>
            <p className="text-muted-foreground mt-1 line-clamp-1 max-w-3xl text-[0.68rem] leading-5 sm:text-sm sm:leading-6">
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

        <div className="grid shrink-0 grid-cols-2 gap-2">
          <Button
            className="cookie-button-secondary min-h-9 text-xs sm:min-h-10 sm:min-w-32 sm:text-sm"
            type="button"
            variant="outline"
            onClick={() => chooseConsent("essential")}
          >
            <Settings aria-hidden="true" className="size-4" />
            הכרחי בלבד
          </Button>
          <Button
            className="cookie-button-primary min-h-9 text-xs sm:min-h-10 sm:min-w-32 sm:text-sm"
            type="button"
            onClick={() => chooseConsent("all")}
          >
            <CheckCircle2 aria-hidden="true" className="size-4" />
            אישור הכל
          </Button>
        </div>
      </div>
    </section>
  );
}
