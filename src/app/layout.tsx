import "~/styles/globals.css";

import { type Metadata, type Viewport } from "next";
import { headers } from "next/headers";
import { Suspense } from "react";

import { AnalyticsProvider } from "~/components/analytics-provider";
import { CookieConsentBanner } from "~/components/cookie-consent-banner";
import { DeferredAccessibilityWidget } from "~/components/deferred-accessibility-widget";
import { DeferredFeedbackButton } from "~/components/deferred-feedback-button";
import { ExclusiveDetailsProvider } from "~/components/exclusive-details-provider";
import { PageTransitionFade } from "~/components/page-transition-fade";
import { PwaProvider } from "~/components/pwa-provider";
import { PublicMotionProvider } from "~/components/public-motion-provider";
import { SiteContextMenu } from "~/components/site-context-menu";
import { SiteFooter } from "~/components/site-footer";
import { SiteUndraggableMedia } from "~/components/site-undraggable-media";
import { ThemeSync } from "~/components/theme-sync";
import { env } from "~/env";

const appName = "Elysia";
const appDescription =
  "תכשיטי Elysia ללוק יומי, למתנה ולערב: טבעות, שרשראות, עגילים וצמידים עם פרטי חומר, מידה ומחיר.";

const sharePreviewImage = "/brand/boutique/lifestyle-hero.avif";

export const metadata: Metadata = {
  applicationName: appName,
  title: {
    default: "Elysia | תכשיטים",
    template: "%s | Elysia",
  },
  description:
    "תכשיטי Elysia ללוק יומי, למתנה ולערב: טבעות, שרשראות, עגילים וצמידים עם פרטי חומר, מידה ומחיר.",
  manifest: "/manifest.webmanifest",
  icons: [
    { rel: "icon", type: "image/svg+xml", url: "/favicon.svg" },
    { rel: "icon", sizes: "any", url: "/favicon.ico" },
    { rel: "apple-touch-icon", sizes: "180x180", url: "/apple-touch-icon.png" },
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: appName,
  },
  formatDetection: {
    telephone: false,
  },
  metadataBase: new URL(env.SITE_URL ?? "https://elysia-jewellery.com"),
  robots: {
    follow: false,
    index: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Elysia",
    description: "תכשיטי Elysia ללוק יומי, למתנה ולערב.",
    url: "/",
    images: [{ url: sharePreviewImage }],
    locale: "he_IL",
    siteName: appName,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: appName,
    description: appDescription,
    images: [sharePreviewImage],
  },
};

export const viewport: Viewport = {
  themeColor: "#fbf8f4",
};

// Runs before first paint so a stored night-mode preference never flashes the
// light theme. The admin surface stays light-only until it gets a dark audit.
const themeInitScript = `try{if(localStorage.getItem("elysia.theme-preference")==="dark"&&location.pathname.indexOf("/admin")!==0){document.documentElement.classList.add("dark");var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content","#161210");}}catch(e){}`;

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Per-request CSP nonce minted in src/proxy.ts. Next.js's own RSC-streaming
  // inline scripts change per request, so only a nonce (not a static hash)
  // can cover them -- this is why the root layout reads headers() and, yes,
  // that forces the whole route into dynamic rendering (see the tradeoff note
  // in src/proxy.ts). The inline theme-init script below needs the same nonce
  // or it is blocked too (a flash of the light theme before ThemeSync catches
  // up).
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <body>
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
        <ThemeSync />
        <PwaProvider>
          <a className="skip-link" href="#main-content">
            דילוג לתוכן
          </a>
          <div id="main-content" tabIndex={-1}>
            <PublicMotionProvider>
              <PageTransitionFade>{children}</PageTransitionFade>
            </PublicMotionProvider>
            <SiteFooter />
          </div>
          <CookieConsentBanner />
          <ExclusiveDetailsProvider />
          <SiteContextMenu />
          <SiteUndraggableMedia />
          <Suspense fallback={null}>
            <AnalyticsProvider />
          </Suspense>
          <DeferredAccessibilityWidget />
          <DeferredFeedbackButton />
        </PwaProvider>
      </body>
    </html>
  );
}
