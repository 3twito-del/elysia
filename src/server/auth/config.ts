import type { AdminPermission } from "@prisma/client";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

import { db } from "~/server/db";
import { verifyCustomerOtp } from "~/server/services/customer-otp";
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

type AdminTokenFields = {
  adminUserId?: string | null;
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
      async authorize(credentials) {
        const parsed = adminCredentialsSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        const admin = await db.adminUser.findUnique({
          where: { email: parsed.data.email },
          include: { role: true },
        });

        if (!admin?.passwordHash) {
          return null;
        }

        const passwordMatches = await verifyPassword(
          parsed.data.password,
          admin.passwordHash,
        );

        if (!passwordMatches) {
          return null;
        }

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
    jwt: ({ token, user }) => {
      const adminToken = token as typeof token & AdminTokenFields;

      if (user) {
        adminToken.adminUserId = user.adminUserId ?? null;
        adminToken.permissions = user.permissions ?? [];
      }

      return adminToken;
    },
    session: ({ session, token }) => {
      const adminToken = token as typeof token & AdminTokenFields;

      return {
        ...session,
        user: {
          ...session.user,
          id: token.sub ?? "guest",
          adminUserId: adminToken.adminUserId ?? null,
          permissions: adminToken.permissions ?? [],
        },
      };
    },
  },
} satisfies NextAuthConfig;
