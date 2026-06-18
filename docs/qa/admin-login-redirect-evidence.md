# Admin Login Redirect Evidence

Date: 2026-06-01

Scope: `next` parameter handling for `/admin/login`.

## Expected Behavior

- Empty, missing, external, protocol-relative, JavaScript, control-character, and
  non-admin redirect values resolve to `/admin`.
- Internal admin paths remain usable after whitespace trimming and one safe
  percent-decoding pass.
- The login page may use the sanitized value only after
  `sanitizeAdminRedirect` has accepted it.

## Evidence

- `src/server/auth/admin-redirect.ts` normalizes the input and accepts only
  `/admin`, `/admin/...`, or `/admin?...`.
- `src/server/auth/admin-redirect.test.ts` covers internal admin redirects,
  encoded admin paths, external URLs, protocol-relative URLs, encoded external
  URLs, scheme payloads, control characters, and non-admin paths.
