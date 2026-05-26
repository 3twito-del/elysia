import "~/styles/globals.css";

import { type Metadata, type Viewport } from "next";
import { Cormorant_Garamond, Geist, Geist_Mono } from "next/font/google";

import { CookieConsentBanner } from "~/components/cookie-consent-banner";
import { DeferredAccessibilityWidget } from "~/components/deferred-accessibility-widget";
import { PwaProvider } from "~/components/pwa-provider";
import { PublicMotionProvider } from "~/components/public-motion-provider";
import { SiteFooter } from "~/components/site-footer";
import { env } from "~/env";

const appName = "Elysia";
const appDescription =
  "בית תכשיטים ישראלי לטבעות, שרשראות, עגילים וצמידים, עם דיוק חומרי, אור שקט, שירות אישי והזמנה מדודה.";

export const metadata: Metadata = {
  applicationName: appName,
  title: {
    default: "Elysia | בית תכשיטים ישראלי",
    template: "%s | Elysia",
  },
  description:
    "בית תכשיטים ישראלי לטבעות, שרשראות, עגילים וצמידים, עם דיוק חומרי, אור שקט, שירות אישי והזמנה מדודה.",
  manifest: "/manifest.webmanifest",
  icons: [
    { rel: "icon", url: "/favicon.ico" },
    { rel: "apple-touch-icon", url: "/apple-touch-icon.png" },
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: appName,
  },
  formatDetection: {
    telephone: false,
  },
  metadataBase: new URL(env.SITE_URL ?? "https://elysia.co.il"),
  openGraph: {
    title: "Elysia",
    description: "תכשיטי בית בעברית, עם בחירה מדויקת ושירות אישי.",
    locale: "he_IL",
    siteName: appName,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: appName,
    description: appDescription,
  },
};

export const viewport: Viewport = {
  themeColor: "#101314",
};

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant-garamond",
  weight: ["400", "500", "600"],
});

const fontClassName = [
  cormorantGaramond.variable,
  geistSans.variable,
  geistMono.variable,
].join(" ");

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="he" dir="rtl" className={fontClassName}>
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
          <DeferredAccessibilityWidget />
        </PwaProvider>
      </body>
    </html>
  );
}
