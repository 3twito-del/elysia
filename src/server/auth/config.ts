import type { AdminPermission } from "@prisma/client";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

import { db } from "~/server/db";
import { recordAdminSecurityEvent } from "~/server/services/admin-security";
import { verifyCustomerOtp } from "~/server/services/customer-otp";
import {
  assertRateLimit,
  getHeadersIp,
  RateLimitExceededError,
} from "~/server/services/rate-limit";
import {
  type AdminSessionTokenFields,
  applyAdminAuthorityToToken,
  resolveActiveAdminAuthority,
} from "./admin-session";
import { isAdminUserEnabled } from "./admin-user-status";
import { verifyPassword } from "./password";

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

const adminCredentialsSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(12),
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
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const parsed = adminCredentialsSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        // ADR 0005 abuse controls: per-account + per-IP rate limiting with a
        // bounded window so the sole operator cannot be locked out forever.
        const ip = request?.headers
          ? getHeadersIp(new Headers(request.headers))
          : undefined;

        try {
          await assertRateLimit({
            key: `admin-login:ip:${ip ?? "unknown"}`,
            limit: 20,
            windowMs: 15 * 60_000,
          });
          await assertRateLimit({
            key: `admin-login:acct:${parsed.data.email}`,
            limit: 5,
            windowMs: 15 * 60_000,
          });
        } catch (error) {
          if (error instanceof RateLimitExceededError) {
            await recordAdminSecurityEvent({
              action: "admin_login.rate_limited",
              email: parsed.data.email,
              ip,
            });

            return null;
          }

          throw error;
        }

        const admin = await db.adminUser.findUnique({
          where: { email: parsed.data.email },
          include: { role: true },
        });

        if (!isAdminUserEnabled(admin)) {
          await recordAdminSecurityEvent({
            action: "admin_login.failed",
            adminUserId: admin?.id ?? null,
            email: parsed.data.email,
            ip,
            reason: admin ? "disabled" : "invalid-credentials",
          });

          return null;
        }

        const passwordMatches = await verifyPassword(
          parsed.data.password,
          admin.passwordHash,
        );

        if (!passwordMatches) {
          await recordAdminSecurityEvent({
            action: "admin_login.failed",
            adminUserId: admin.id,
            email: parsed.data.email,
            ip,
            reason: "invalid-credentials",
          });

          return null;
        }

        await recordAdminSecurityEvent({
          action: "admin_login.succeeded",
          adminUserId: admin.id,
          email: admin.email,
          ip,
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
