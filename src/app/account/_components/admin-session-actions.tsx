import Link from "next/link";
import { LayoutDashboard, LogOut } from "lucide-react";

import { Button } from "~/components/ui/button";
import { customerLogoutAction } from "../actions";

/**
 * Action pair shown when an admin session lands on a customer-only screen
 * (account / wishlist): jump to the admin dashboard, or sign out of the
 * admin session. Shared so both pages stay in sync.
 */
export function AdminSessionActions() {
  return (
    <>
      <Button asChild>
        <Link href="/admin">
          <LayoutDashboard aria-hidden="true" className="size-4" />
          מעבר לניהול
        </Link>
      </Button>
      <form action={customerLogoutAction}>
        <Button className="gap-2" type="submit" variant="outline">
          <LogOut aria-hidden="true" className="size-4" />
          יציאה
        </Button>
      </form>
    </>
  );
}
