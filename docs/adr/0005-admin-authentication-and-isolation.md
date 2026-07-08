# Admin control plane: mandatory TOTP, edge middleware, 12-hour sessions, audited logins

Status: accepted (2026-07-08)

Any surface that can alter money, books, users, roles, payroll, banking, audit
state, inventory truth, or customer-impacting operations is an **administrative
control plane**, not ordinary storefront functionality. The pre-decision state
— password-only admin login, no middleware in front of `/admin`, 30-day JWT
sessions, no rate limiting, failed logins leaving no trace — was ruled
unacceptable for launch.

## Decisions

1. **MFA: TOTP mandatory** for every admin including the bootstrap admin.
   Forced enrollment at next login before any console access. Recovery codes:
   generated once, shown once, hash-stored, single-use; regeneration
   invalidates unused codes. TOTP secrets protected at rest. **Email OTP is
   rejected** as an admin second factor (same channel as password reset = two
   steps through one compromised channel). **Passkeys/WebAuthn are post-launch
   additive hardening**, not the launch dependency. The daily operator friction
   is explicitly accepted: convenience does not outrank control-plane security.
2. **Isolation: path-based edge middleware now** (`src/middleware.ts`) —
   protects all `/admin` routes AND admin APIs, verifies admin authority,
   applies strict security headers; `/admin/login` and the narrow MFA-enrollment
   flow stay reachable. Defense in depth: middleware is the outer gate, never a
   replacement for per-procedure authorization and execution-time permission
   checks. **Admin subdomain** (host-based middleware, tighter cookie scope,
   stricter CSP) is named post-launch hardening. **Separate deployment is
   rejected** for launch.
3. **Sessions: admin ≤ 12 hours**, policy separate from customer sessions;
   admin authority revalidated against current server-side role state so a
   removed admin does not retain long-lived power; logout clears admin state.
   Long customer sessions are a usability decision; long admin sessions are a
   control failure.
4. **Abuse controls (launch requirements):** per-account + per-IP rate limiting
   on admin login, exponential lockout/delay (designed so the sole operator
   cannot be trivially locked out permanently), and audited security events for
   failed logins, successful logins, TOTP failures, recovery-code generation
   and use, MFA enrollment/reset, and role changes — with immutability
   equivalent to `AuditLog`. A failed admin login is security telemetry, not a
   rejected request.
5. **Step-up re-auth** (fresh password+TOTP within ~15–30 min) for destructive
   finance/authority actions — payment runs, refunds, period close, journal
   posting/reversal, payroll, banking, role changes, MFA reset, disabling
   admins — is the **first fast-follow**; pull into launch only if cheap while
   touching the auth layer.

## Launch acceptance criteria

Password alone cannot reach `/admin`; customer or non-admin accounts cannot
reach `/admin`; admin APIs are middleware-blocked (not UI-hidden); direct calls
to admin procedures fail without admin authority; admin session expires ≤ 12 h;
all listed security events are audited; rate limiting and lockout are active;
security headers applied; tests cover unauthenticated / customer / non-admin /
expired-session / missing-TOTP / failed-TOTP / successful-MFA paths.
