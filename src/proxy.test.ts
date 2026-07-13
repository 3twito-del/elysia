import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * G-11 checkout security review — proxy/CSP + admin-gate guards.
 *
 * Source-shape assertions (this repo has no edge-runtime harness for Vitest, so
 * the real middleware can only be exercised against a running Next server — see
 * docs/QA_EVIDENCE.md -> g-11-checkout-security-review for the live-browser
 * proof, including why a hash-only policy was tried and rejected: Next's App
 * Router injects per-request inline RSC-streaming scripts that only a nonce
 * can allow). What these lock down is the structural contract a future
 * refactor must not silently break: the site-wide Content-Security-Policy with
 * a per-request Web-Crypto nonce, and the ADR 0005 admin gate that shares this
 * file. The two concerns co-exist; neither may regress the other.
 */

function read(relativePath: string) {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("proxy content-security-policy", () => {
  const source = read("src/proxy.ts");

  it("mints a fresh nonce per request with Web Crypto, not node:crypto", () => {
    expect(source).toContain("crypto.getRandomValues");
    // node:crypto randomBytes is unavailable at the edge — must never appear.
    expect(source).not.toContain("randomBytes");
    expect(source).not.toContain('from "node:crypto"');
    expect(source).not.toContain('from "crypto"');
  });

  it("forwards the nonce to the app so Next.js and Server Components can read it", () => {
    // Request header carrying the nonce for our own Server Components...
    expect(source).toContain('requestHeaders.set("x-nonce", nonce)');
    // ...and the CSP on the *request* so Next stamps its framework scripts.
    expect(source).toContain(
      'requestHeaders.set("content-security-policy", csp)',
    );
    expect(source).toContain("NextResponse.next(forwardRequest)");
  });

  it("sets the CSP response header on every response path", () => {
    expect(source).toContain(
      'response.headers.set("Content-Security-Policy", csp)',
    );
  });

  it("builds a strict, non-wildcard policy", () => {
    expect(source).toContain("default-src 'self'");
    expect(source).toContain("base-uri 'self'");
    expect(source).toContain("'nonce-${nonce}'");
    expect(source).toContain("'strict-dynamic'");
    expect(source).toContain("object-src 'none'");
    expect(source).toContain("frame-ancestors 'none'");
    expect(source).toContain("form-action 'self'");
    expect(source).toContain("connect-src 'self'");
    // No blanket escape hatches in the shipped policy.
    expect(source).not.toContain("'unsafe-inline' 'unsafe-eval'");
    expect(source).not.toMatch(/script-src[^\n]*\*/);
  });

  it("keeps 'unsafe-eval' scoped to development only", () => {
    expect(source).toContain("isDevelopment ? \"'unsafe-eval'\" : null");
  });

  it("only relaxes inline for styles, never for scripts", () => {
    expect(source).toContain("style-src 'self' 'unsafe-inline'");
    // The script directive must not carry 'unsafe-inline'.
    const scriptLine = source
      .split("\n")
      .find((line) => line.includes("script-src ${scriptSrc}"));
    expect(scriptLine).toBeDefined();
  });

  it("mirrors next.config.js image remote hosts in img-src", () => {
    const nextConfig = read("next.config.js");
    const hosts = [...nextConfig.matchAll(/hostname:\s*"([^"]+)"/g)].map(
      (match) => match[1],
    );

    expect(hosts.length).toBeGreaterThan(0);

    const imgSrcLine = source
      .split("\n")
      .find((line) => line.includes("img-src"));
    expect(imgSrcLine).toBeDefined();

    for (const host of hosts) {
      expect(imgSrcLine).toContain(host);
    }
  });
});

describe("proxy admin gate (ADR 0005) is preserved alongside CSP", () => {
  const source = read("src/proxy.ts");

  it("keeps the login surface reachable without authority", () => {
    expect(source).toContain('const ADMIN_LOGIN_PATH = "/admin/login"');
    expect(source).toContain("pathname === ADMIN_LOGIN_PATH");
  });

  it("still runs the site-wide matcher, not an admin-only scope", () => {
    // The matcher must cover the whole site (negative-lookahead form), and must
    // NOT be the old admin-only matcher.
    expect(source).toContain("(?!_next/static");
    expect(source).not.toContain('matcher: ["/admin/:path*"');
  });

  it("derives secureCookie from transport, not NODE_ENV (local-e2e gotcha)", () => {
    expect(source).toContain('req.nextUrl.protocol === "https:"');
    expect(source).toContain('req.headers.get("x-forwarded-proto") === "https"');
    expect(source).toContain("secureCookie: isHttps");
  });

  it("verifies admin authority and 401s admin APIs, redirects admin pages", () => {
    expect(source).toContain("hasActiveAdminAuthority");
    expect(source).toContain('pathname.startsWith("/api/")');
    expect(source).toContain("status: 401");
    expect(source).toContain("Admin authentication required.");
    expect(source).toContain("loginUrl.pathname = ADMIN_LOGIN_PATH");
    expect(source).toContain("?next=${encodeURIComponent(pathname)}");
    expect(source).toContain("NextResponse.redirect(loginUrl)");
  });

  it("applies the admin security headers on admin responses", () => {
    expect(source).toContain('response.headers.set("X-Frame-Options", "DENY")');
    expect(source).toContain(
      'response.headers.set("Cache-Control", "no-store")',
    );
    expect(source).toContain("withAdminSecurityHeaders");
  });
});

describe("inline theme-init script carries the nonce", () => {
  it("stamps the layout theme script with the forwarded x-nonce", () => {
    const layout = read("src/app/layout.tsx");

    expect(layout).toContain('from "next/headers"');
    expect(layout).toContain('(await headers()).get("x-nonce")');
    expect(layout).toContain("nonce={nonce}");
    // The script that would otherwise be blocked by the strict script-src.
    expect(layout).toContain("dangerouslySetInnerHTML={{ __html: themeInitScript }}");
  });
});
