"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckCircle2, Cookie, Settings } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "~/components/ui/button";
import {
  type CookieConsentValue,
  writeCookieConsent,
} from "~/lib/cookie-consent";
import { useCookieConsentValue } from "~/lib/use-cookie-consent";
import { cn } from "~/lib/utils";

export function CookieConsentBanner() {
  const pathname = usePathname();
  const consentValue = useCookieConsentValue();
  const [selectedConsentValue, setSelectedConsentValue] =
    useState<CookieConsentValue | null>(null);
  const effectiveConsentValue = selectedConsentValue ?? consentValue;
  const isConsentLoading =
    consentValue === undefined && selectedConsentValue === null;
  const bannerRef = useRef<HTMLElement>(null);
  const isAdminRoute = pathname.startsWith("/admin");
  const usesCheckoutTopPlacement = pathname === "/checkout";

  useEffect(() => {
    const root = document.documentElement;

    if (isAdminRoute || isConsentLoading || effectiveConsentValue !== null) {
      delete root.dataset.cookieBannerOpen;
      delete root.dataset.cookieBannerPlacement;
      root.style.removeProperty("--floating-stack-bottom");
      root.style.removeProperty("--floating-stack-top");
      return;
    }

    root.dataset.cookieBannerOpen = "true";
    root.dataset.cookieBannerPlacement = usesCheckoutTopPlacement
      ? "top"
      : "bottom";

    const syncOffset = () => {
      const height = bannerRef.current?.getBoundingClientRect().height ?? 0;

      if (usesCheckoutTopPlacement) {
        root.style.removeProperty("--floating-stack-bottom");
        root.style.setProperty("--floating-stack-top", `${height + 16}px`);
        return;
      }

      root.style.removeProperty("--floating-stack-top");
      root.style.setProperty("--floating-stack-bottom", `${height + 16}px`);
    };

    syncOffset();

    if (typeof ResizeObserver === "undefined" || !bannerRef.current) {
      window.addEventListener("resize", syncOffset);

      return () => {
        window.removeEventListener("resize", syncOffset);
        delete root.dataset.cookieBannerOpen;
        delete root.dataset.cookieBannerPlacement;
        root.style.removeProperty("--floating-stack-bottom");
        root.style.removeProperty("--floating-stack-top");
      };
    }

    const observer = new ResizeObserver(syncOffset);
    observer.observe(bannerRef.current);
    window.addEventListener("resize", syncOffset);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncOffset);
      delete root.dataset.cookieBannerOpen;
      delete root.dataset.cookieBannerPlacement;
      root.style.removeProperty("--floating-stack-bottom");
      root.style.removeProperty("--floating-stack-top");
    };
  }, [
    effectiveConsentValue,
    isAdminRoute,
    isConsentLoading,
    usesCheckoutTopPlacement,
  ]);

  if (isAdminRoute || isConsentLoading || effectiveConsentValue !== null) {
    return null;
  }

  const chooseConsent = (value: CookieConsentValue) => {
    setSelectedConsentValue(value);
    writeCookieConsent(value);
  };

  return (
    <section
      aria-label="בחירת קוקיז"
      aria-describedby="cookie-consent-summary"
      className={cn(
        "minimal-scroll bg-background fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-50 max-h-[24dvh] overflow-y-auto rounded-md border border-[var(--glass-border)] px-3 py-2 shadow-none sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-[min(calc(100vw-2rem),20rem)] sm:px-3 sm:py-2.5",
        usesCheckoutTopPlacement &&
          "top-[calc(var(--site-header-height)+0.75rem+env(safe-area-inset-top))] bottom-[auto] sm:bottom-[auto]",
      )}
      data-cookie-consent-banner="true"
      data-public-floating-avoid="true"
      ref={bannerRef}
    >
      <div className="grid gap-2">
        <div className="flex min-w-0 gap-2 sm:gap-3">
          <div className="glass-inset mt-0.5 hidden size-10 shrink-0 items-center justify-center rounded-md border sm:flex">
            <Cookie className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xs font-semibold sm:text-base">שימוש בקוקיז</h2>
            <p
              className="text-muted-foreground mt-1 line-clamp-1 max-w-3xl text-[0.68rem] leading-5 sm:text-sm sm:leading-6"
              id="cookie-consent-summary"
            >
              האתר משתמש בקוקיז חיוניים לתפעולו. באישורך נשתמש בקוקיז נוספים
              למדידה ולשיפור החוויה.
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
            aria-describedby="cookie-consent-summary"
            className="cookie-button-secondary min-h-9 text-xs sm:min-h-10 sm:min-w-32 sm:text-sm"
            type="button"
            variant="outline"
            onClick={() => chooseConsent("essential")}
          >
            <Settings aria-hidden="true" className="size-4" />
            רק חיוניים
          </Button>
          <Button
            aria-describedby="cookie-consent-summary"
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
