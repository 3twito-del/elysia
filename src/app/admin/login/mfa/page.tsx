import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import QRCode from "qrcode";

import { AdminMfaEnrollForm } from "./_components/admin-mfa-enroll-form";
import { AdminMfaRecoveryReveal } from "./_components/admin-mfa-recovery-reveal";
import { AdminMfaVerifyForm } from "./_components/admin-mfa-verify-form";
import { BrandLogo } from "~/components/brand-logo";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  getAdminLoginTicketCookie,
  getAdminMfaRecoveryRevealCodes,
} from "~/server/auth/admin-login-ticket-cookie";
import { verifyAdminLoginTicket } from "~/server/auth/admin-mfa-ticket";
import { sanitizeAdminRedirect } from "~/server/auth/admin-redirect";
import {
  beginAdminMfaEnrollment,
  getAdminMfaStatus,
} from "~/server/services/admin-mfa";

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false,
  },
  title: "אימות דו-שלבי — אדמין",
};

type AdminMfaPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function AdminMfaPage({
  searchParams,
}: AdminMfaPageProps) {
  const params = await searchParams;
  const next = sanitizeAdminRedirect(params.next);

  const ticket = await getAdminLoginTicketCookie();
  // No expectedStage restriction here: this page only decides *which* MFA
  // step to render. It accepts either a fresh password_verified ticket or
  // an mfa_verified one minted moments ago by a successful enrollment
  // confirm — the latter matters because Next.js re-renders this Server
  // Component as part of that same action response, after the ticket has
  // already been rotated. The actions themselves still enforce the exact
  // stage they require.
  const payload = verifyAdminLoginTicket(ticket);

  if (!payload) {
    redirect("/admin/login");
  }

  const recoveryCodes = await getAdminMfaRecoveryRevealCodes();
  const status = await getAdminMfaStatus(payload.adminUserId);

  const heading = recoveryCodes
    ? "שמירת קודי גיבוי"
    : status.enabled
      ? "אימות קוד"
      : "הפעלת אימות דו-שלבי";
  const description = recoveryCodes
    ? "קודי הגיבוי מוצגים כעת בפעם היחידה — יש לשמור אותם במקום בטוח."
    : status.enabled
      ? "יש להזין קוד מאפליקציית האימות, או קוד גיבוי."
      : "הפעלת אימות דו-שלבי היא חובה לפני כניסה לניהול.";

  return (
    <main className="elysia-page elysia-admin-shell min-h-screen">
      <section className="mx-auto grid min-h-screen max-w-7xl items-center px-[var(--ui-page-x)] py-[var(--ui-section-y)] lg:px-[var(--ui-page-x-wide)]">
        <div className="mx-auto grid w-full max-w-md gap-6">
          <Link
            aria-label="Elysia - עמוד הבית"
            className="brand-header-mark mx-auto inline-flex items-center"
            dir="ltr"
            href="/"
          >
            <BrandLogo className="h-6 w-auto max-w-[8rem]" />
          </Link>
          <div>
            <Badge className="mb-4" variant="secondary">
              ניהול פנימי
            </Badge>
            <h1 className="text-4xl font-semibold">אימות דו-שלבי</h1>
            <p className="text-muted-foreground mt-3 leading-7">
              {description}
            </p>
          </div>
          <Card className="rounded-md">
            <CardHeader className="border-b border-[var(--glass-border)] pb-4">
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck aria-hidden="true" className="size-5" />
                {heading}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recoveryCodes ? (
                <AdminMfaRecoveryReveal codes={recoveryCodes} next={next} />
              ) : status.enabled ? (
                <AdminMfaVerifyForm next={next} />
              ) : (
                <EnrollmentPanel adminUserId={payload.adminUserId} next={next} />
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}

async function EnrollmentPanel({
  adminUserId,
  next,
}: {
  adminUserId: string;
  next: string;
}) {
  const { otpauthUri, secretBase32 } = await beginAdminMfaEnrollment(adminUserId);
  const qrDataUrl = await QRCode.toDataURL(otpauthUri, { margin: 1, width: 220 });

  return (
    <AdminMfaEnrollForm
      next={next}
      otpauthUri={otpauthUri}
      qrDataUrl={qrDataUrl}
      secretBase32={secretBase32}
    />
  );
}
