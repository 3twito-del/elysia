// ADR 0005: password verification for the phase-1 login step
// (~/app/admin/actions.ts). Extracted so it isn't duplicated between the
// server action and NextAuth's authorize() — the latter no longer checks a
// password at all, only a post-MFA ticket (~/server/auth/config.ts).

import { db } from "~/server/db";
import { isAdminUserEnabled } from "./admin-user-status";
import { verifyPassword } from "./password";

export async function verifyAdminCredentials(input: {
  email: string;
  password: string;
}) {
  const admin = await db.adminUser.findUnique({
    where: { email: input.email },
  });

  if (!isAdminUserEnabled(admin)) {
    return null;
  }

  const passwordMatches = await verifyPassword(
    input.password,
    admin.passwordHash,
  );

  if (!passwordMatches) {
    return null;
  }

  return { email: admin.email, id: admin.id };
}
