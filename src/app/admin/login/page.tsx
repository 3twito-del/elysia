import { redirect } from "next/navigation";
import { LockKeyhole } from "lucide-react";

import { AdminLoginForm } from "./_components/admin-login-form";
import { SiteHeader } from "~/components/site-header";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { auth } from "~/server/auth";
import { getAdminFromSession } from "~/server/auth/admin-access";
import { sanitizeAdminRedirect } from "~/server/auth/admin-redirect";

export const metadata = {
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
    <main>
      <SiteHeader />
      <section className="admin-command-center grid min-h-[70vh] items-center border-b border-[var(--glass-border)] px-4 py-12 sm:px-6">
        <div className="mx-auto grid w-full max-w-md gap-6">
          <div>
            <Badge className="mb-4 rounded-none" variant="secondary">
              Back office
            </Badge>
            <h1 className="editorial-title text-4xl font-semibold">
              כניסת אדמין
            </h1>
            <p className="text-muted-foreground mt-3 leading-7">
              גישה להזמנות, מלאי ופעולות תפעוליות שמורה למנהלים מורשים בלבד.
            </p>
          </div>
          <Card className="checkout-ledger purchase-chamber rounded-md">
            <CardHeader className="border-b border-[var(--glass-border)] pb-4">
              <CardTitle className="flex items-center gap-2">
                <LockKeyhole className="size-5" />
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
