import { AdminShell } from "../_components/admin-shell";
import { AdminForbidden } from "../_components/admin-states";
import { getAdminSelfPageAccess } from "../_lib/access";
import { AdminSecurityMfaCard } from "./_components/admin-security-mfa-card";
import { TRPCReactProvider } from "~/trpc/react";

export const metadata = { title: "אבטחה | Admin" };

export const dynamic = "force-dynamic";

export default async function AdminSecurityPage() {
  const access = await getAdminSelfPageAccess("/admin/security");

  if (access.denied) return <AdminForbidden {...access.denied} />;

  return (
    <AdminShell
      active="security"
      admin={access.admin}
      description="ניהול אימות דו-שלבי (TOTP) וקודי גיבוי לחשבון האדמין שלך."
      title="אבטחה"
    >
      <TRPCReactProvider>
        <AdminSecurityMfaCard />
      </TRPCReactProvider>
    </AdminShell>
  );
}
