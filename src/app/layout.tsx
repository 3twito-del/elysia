import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { CookieConsentBanner } from "~/components/cookie-consent-banner";
import { DeferredAccessibilityWidget } from "~/components/deferred-accessibility-widget";
import { PublicMotionProvider } from "~/components/public-motion-provider";
import { SiteFooter } from "~/components/site-footer";

export const metadata: Metadata = {
  title: {
    default: "Aphrodite | תכשיטי סטודיו מודרניים",
    template: "%s | Aphrodite",
  },
  description:
    "רשת תכשיטים ישראלית במיצוב יוקרה נגישה: טבעות, שרשראות, עגילים, צמידים, מתנות ורכישה אונליין.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
  metadataBase: new URL("https://aphrodite.local"),
  openGraph: {
    title: "Aphrodite",
    description:
      "תכשיטי סטודיו מודרניים בעברית, עם מסחר אונליין מלא ושירות אישי.",
    locale: "he_IL",
    type: "website",
  },
};

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body>
        <a className="skip-link" href="#main-content">
          דילוג לתוכן
        </a>
        <div id="main-content" tabIndex={-1}>
          <PublicMotionProvider footer={<SiteFooter />}>
            {children}
          </PublicMotionProvider>
        </div>
        <CookieConsentBanner />
        <DeferredAccessibilityWidget />
      </body>
    </html>
  );
}
