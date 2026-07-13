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
//
// G-11 (docs/QA_EVIDENCE.md -> g-11-checkout-security-review): this proxy is
// ALSO the single site-wide place that mints a per-request CSP nonce and sets
// the Content-Security-Policy on every response. The admin-gate logic below is
// unchanged in behavior; the CSP concern runs alongside it for every route.
//
// Tradeoff, confirmed by live testing (not just Next.js's docs): a hash-based
// script-src (no nonce, no headers() read) was tried first specifically to
// keep static pages static, but Next.js's App Router injects its own
// per-request RSC-streaming/hydration inline scripts, whose content differs
// every render -- only a nonce can allow those, a static hash cannot. So the
// root layout (src/app/layout.tsx) has to read this nonce via headers(),
// which forces every route into dynamic rendering. This is Next's own
// documented tradeoff for App Router CSP, not a bug -- confirmed here because
// the hash-only attempt broke real inline-script execution in a live browser
// (Playwright) check, not just in theory.

const ADMIN_LOGIN_PATH = "/admin/login";

const isDevelopment = process.env.NODE_ENV !== "production";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // One fresh nonce per request. Web Crypto only — node's crypto module is not
  // available in the edge runtime this proxy runs in.
  const nonce = generateNonce();
  const csp = buildContentSecurityPolicy(nonce);

  // Forward the nonce (and the CSP) to the app on the *request* headers. Next.js
  // reads the nonce out of the request's Content-Security-Policy header and
  // stamps it onto every framework <script> it emits; our Server Components read
  // x-nonce via headers() to stamp the inline theme-init script (layout.tsx).
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", csp);

  const forwardRequest = { request: { headers: requestHeaders } } as const;

  // Non-admin routes: apply the CSP and pass through. The remaining static
  // security headers (COOP, HSTS, Referrer-Policy, X-Frame-Options,
  // X-Content-Type-Options, Permissions-Policy) are already set site-wide by
  // next.config.js `headers()`; only the per-request CSP has to come from here.
  if (!isAdminPath(pathname)) {
    return withCsp(NextResponse.next(forwardRequest), csp);
  }

  // --- ADR 0005 admin gate (behavior preserved verbatim) ---

  // The login surface (and only it) stays reachable without authority.
  if (
    pathname === ADMIN_LOGIN_PATH ||
    pathname.startsWith(`${ADMIN_LOGIN_PATH}/`)
  ) {
    return withAdminSecurityHeaders(NextResponse.next(forwardRequest), csp);
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
        csp,
      );
    }

    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = ADMIN_LOGIN_PATH;
    loginUrl.search =
      pathname && pathname !== "/admin"
        ? `?next=${encodeURIComponent(pathname)}`
        : "";

    return withAdminSecurityHeaders(NextResponse.redirect(loginUrl), csp);
  }

  return withAdminSecurityHeaders(NextResponse.next(forwardRequest), csp);
}

function isAdminPath(pathname: string) {
  return (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/api/admin" ||
    pathname.startsWith("/api/admin/")
  );
}

function generateNonce() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);

  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);

  return btoa(binary);
}

function buildContentSecurityPolicy(nonce: string) {
  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    // Trust scripts loaded by an already-trusted (nonce'd) script — how Next
    // pulls its own chunks and RSC-streaming inline payloads in. Modern
    // browsers then ignore the 'self' host allowlist for scripts, so only
    // nonce'd code and its descendants run.
    "'strict-dynamic'",
    // Dev only: `next dev --webpack` + React Fast Refresh compile with eval().
    isDevelopment ? "'unsafe-eval'" : null,
  ]
    .filter(Boolean)
    .join(" ");

  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    `script-src ${scriptSrc}`,
    // Tailwind's compiled sheet is same-origin; React and Framer Motion write
    // inline style="" attributes (gated by style-src-attr, which falls back to
    // style-src). 'unsafe-inline' for STYLES only — no script execution risk —
    // keeps them working. No style nonce/hash is present, so it is honored.
    "style-src 'self' 'unsafe-inline'",
    // Mirrors next.config.js images.remotePatterns exactly, plus data:/blob:
    // for inline SVGs, canvas exports, and object-URL previews.
    "img-src 'self' data: blob: https://images.unsplash.com https://res.cloudinary.com https://upload.wikimedia.org https://cdn.shopify.com",
    "font-src 'self' data:",
    // Brand hero video is same-origin (/brand/**); Cloudinary may serve product
    // media; blob:/data: cover client-generated media.
    "media-src 'self' blob: data: https://res.cloudinary.com",
    // tRPC, analytics beacons, and rrweb replay all POST to this app's own
    // /api/* routes; nothing talks to a third-party host from the client.
    "connect-src 'self'",
    // Serwist service worker (prod / e2e opt-in) is same-origin; blob: covers
    // any worker bootstrapped from an object URL.
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "object-src 'none'",
    // Dropship click-out is a top-level window.location navigation, not a form
    // POST, so 'self' does not block it. No checkout form posts cross-origin.
    "form-action 'self'",
    "frame-ancestors 'none'",
    // Prod is always HTTPS; upgrade would break plain-HTTP localhost dev.
    isDevelopment ? null : "upgrade-insecure-requests",
  ].filter(Boolean);

  return directives.join("; ");
}

function withCsp(response: NextResponse, csp: string) {
  response.headers.set("Content-Security-Policy", csp);

  return response;
}

function withAdminSecurityHeaders(response: NextResponse, csp: string) {
  response.headers.set("Content-Security-Policy", csp);
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
  // Run on every route so the admin gate AND the site-wide CSP nonce both
  // apply. Excludes only Next's own static/image pipelines and common static
  // asset requests, which need no nonce and no gate. Admin prefetch requests
  // are intentionally NOT excluded — the ADR 0005 gate must see them too.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|favicon.svg|manifest.webmanifest|robots.txt|sitemap.xml|sw.js).*)",
  ],
};
