import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";

import {
  type AdminSessionTokenFields,
  hasActiveAdminAuthority,
} from "~/server/auth/admin-session";

// ADR 0005 (docs/DECISIONS.md): path-based edge proxy is the outer gate
// of the admin control plane. It protects every /admin route and admin API
// before any server code runs. Defense in depth — it never replaces
// per-procedure authorization (adminProcedure) or execution-time permission
// checks.

const ADMIN_LOGIN_PATH = "/admin/login";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // The login surface (and only it) stays reachable without authority.
  if (
    pathname === ADMIN_LOGIN_PATH ||
    pathname.startsWith(`${ADMIN_LOGIN_PATH}/`)
  ) {
    return withAdminSecurityHeaders(NextResponse.next());
  }

  // Must match whether NextAuth itself set a __Secure__-prefixed session
  // cookie, which it decides from the request's actual transport — not from
  // NODE_ENV. Those normally agree (every real Vercel deployment, preview or
  // production, is NODE_ENV=production AND https), but diverge under a local
  // `next start` production build served over plain HTTP (e.g. e2e runs),
  // where NODE_ENV=production is true while the connection is not.
  const secret = process.env.AUTH_SECRET;
  const isHttps =
    req.nextUrl.protocol === "https:" ||
    req.headers.get("x-forwarded-proto") === "https";
  const token = secret
    ? await getToken({
        req,
        secret,
        secureCookie: isHttps,
      }).catch(() => null)
    : null;

  if (
    !hasActiveAdminAuthority(
      token as AdminSessionTokenFields | null | undefined,
    )
  ) {
    if (pathname.startsWith("/api/")) {
      return withAdminSecurityHeaders(
        NextResponse.json(
          { ok: false, error: "Admin authentication required." },
          { status: 401 },
        ),
      );
    }

    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = ADMIN_LOGIN_PATH;
    loginUrl.search =
      pathname && pathname !== "/admin"
        ? `?next=${encodeURIComponent(pathname)}`
        : "";

    return withAdminSecurityHeaders(NextResponse.redirect(loginUrl));
  }

  return withAdminSecurityHeaders(NextResponse.next());
}

function withAdminSecurityHeaders(response: NextResponse) {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("Cache-Control", "no-store");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
