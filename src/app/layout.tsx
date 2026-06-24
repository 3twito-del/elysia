import "~/styles/globals.css";

import { type Metadata, type Viewport } from "next";
import { Suspense } from "react";

import { AnalyticsProvider } from "~/components/analytics-provider";
import { CookieConsentBanner } from "~/components/cookie-consent-banner";
import { DeferredAccessibilityWidget } from "~/components/deferred-accessibility-widget";
import { ExclusiveDetailsProvider } from "~/components/exclusive-details-provider";
import { PwaProvider } from "~/components/pwa-provider";
import { PublicMotionProvider } from "~/components/public-motion-provider";
import { SiteContextMenu } from "~/components/site-context-menu";
import { SiteFooter } from "~/components/site-footer";
import { SiteUndraggableMedia } from "~/components/site-undraggable-media";
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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="he" dir="rtl">
      <body>
        <PwaProvider>
          <a className="skip-link" href="#main-content">
            דילוג לתוכן
          </a>
          <div id="main-content" tabIndex={-1}>
            <PublicMotionProvider>{children}</PublicMotionProvider>
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
        </PwaProvider>
      </body>
    </html>
  );
}
