import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LockKeyhole } from "lucide-react";

import { AdminLoginForm } from "./_components/admin-login-form";
import { BrandLogo } from "~/components/brand-logo";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { auth } from "~/server/auth";
import { getAdminFromSession } from "~/server/auth/admin-access";
import { sanitizeAdminRedirect } from "~/server/auth/admin-redirect";

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false,
  },
  title: "כניסת אדמין",
};

type AdminLoginPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function AdminLoginPage({
  searchParams,
}: AdminLoginPageProps) {
  const params = await searchParams;
  const next = sanitizeAdminRedirect(params.next);
  const session = await auth();
  const admin = await getAdminFromSession(session);

  if (admin) {
    redirect(next);
  }

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
            <h1 className="text-4xl font-semibold">כניסת אדמין</h1>
            <p className="text-muted-foreground mt-3 leading-7">
              גישה להזמנות, מלאי ופעולות תפעוליות שמורה למנהלים מורשים בלבד.
            </p>
          </div>
          <Card className="rounded-md">
            <CardHeader className="border-b border-[var(--glass-border)] pb-4">
              <CardTitle className="flex items-center gap-2">
                <LockKeyhole aria-hidden="true" className="size-5" />
                אימות פנימי
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AdminLoginForm next={next} />
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
