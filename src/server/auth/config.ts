import type { AdminPermission } from "@prisma/client";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

import { db } from "~/server/db";
import { recordAdminSecurityEvent } from "~/server/services/admin-security";
import { verifyCustomerOtp } from "~/server/services/customer-otp";
import { verifyAdminLoginTicket } from "./admin-mfa-ticket";
import {
  type AdminSessionTokenFields,
  applyAdminAuthorityToToken,
  resolveActiveAdminAuthority,
} from "./admin-session";
import { isAdminUserEnabled } from "./admin-user-status";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      adminUserId?: string | null;
      permissions?: AdminPermission[];
    } & DefaultSession["user"];
  }

  interface User {
    adminUserId?: string | null;
    permissions?: AdminPermission[];
  }
}

type AdminTokenFields = AdminSessionTokenFields & {
  permissions?: AdminPermission[];
};

const otpCredentialsSchema = z.object({
  identifier: z.string().min(5),
  code: z.string().min(4).max(8),
  sessionKey: z.string().min(16).max(128).optional(),
});

// ADR 0005: password + TOTP/recovery-code verification happen in server
// actions before any NextAuth session exists (~/app/admin/actions.ts,
// ~/app/admin/login/mfa/actions.ts). This provider only ever mints the
// actual session, gated on a signed, short-lived "mfa_verified" ticket
// (~/server/auth/admin-mfa-ticket.ts) proving both steps already succeeded.
const adminTicketCredentialsSchema = z.object({
  ticket: z.string().min(20).max(2048),
});

export const authConfig = {
  trustHost: true,
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      id: "otp",
      name: "OTP",
      credentials: {
        identifier: { label: "Email or phone", type: "text" },
        code: { label: "Code", type: "text" },
      },
      async authorize(credentials) {
        const parsed = otpCredentialsSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        try {
          const customer = await verifyCustomerOtp(parsed.data);

          return {
            id: customer.userId,
            email: customer.email,
            name: customer.name,
            adminUserId: null,
            permissions: [],
          };
        } catch {
          return null;
        }
      },
    }),
    Credentials({
      id: "admin",
      name: "Admin",
      credentials: {
        ticket: { label: "Ticket", type: "text" },
      },
      async authorize(credentials) {
        const parsed = adminTicketCredentialsSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        const payload = verifyAdminLoginTicket(parsed.data.ticket, {
          expectedStage: "mfa_verified",
        });

        if (!payload) {
          return null;
        }

        // Re-fetch fresh rather than trusting the ticket's identity alone —
        // covers the account being disabled in the few minutes between
        // password verification and finishing the MFA step.
        const admin = await db.adminUser.findUnique({
          where: { id: payload.adminUserId },
          include: { role: true },
        });

        if (!isAdminUserEnabled(admin)) {
          await recordAdminSecurityEvent({
            action: "admin_login.failed",
            adminUserId: admin?.id ?? null,
            email: admin?.email ?? "unknown",
            reason: admin ? "disabled" : "invalid-credentials",
          });

          return null;
        }

        await recordAdminSecurityEvent({
          action: "admin_login.succeeded",
          adminUserId: admin.id,
          email: admin.email,
        });

        return {
          id: `admin:${admin.id}`,
          adminUserId: admin.id,
          email: admin.email,
          name: admin.name,
          permissions: admin.role.permissions,
        };
      },
    }),
  ],
  callbacks: {
    // ADR 0005: admin authority expires after 12 hours regardless of the
    // customer session policy; re-authentication restores it. The logic is
    // pure and unit-tested in ./admin-session.
    jwt: ({ token, user }) =>
      applyAdminAuthorityToToken(
        token as typeof token & AdminTokenFields,
        user
          ? {
              adminUserId: user.adminUserId,
              permissions: user.permissions,
            }
          : null,
      ),
    session: ({ session, token }) => {
      const authority = resolveActiveAdminAuthority(
        token as typeof token & AdminTokenFields,
      );

      return {
        ...session,
        user: {
          ...session.user,
          id: token.sub ?? "guest",
          adminUserId: authority.adminUserId,
          permissions: authority.permissions as AdminPermission[],
        },
      };
    },
  },
} satisfies NextAuthConfig;
