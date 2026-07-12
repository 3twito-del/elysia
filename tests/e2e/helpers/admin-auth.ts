import { createHmac } from "node:crypto";

import { expect, type Page } from "@playwright/test";

export type AdminAuthFixtureRole = "full" | "limited";

export type AdminAuthFixture = {
  adminUserId: string;
  email: string;
  password: string;
  recoveryCodes: string[];
  roleName: string;
  totpSecret: string;
};

type AdminAuthFixtureResponse = {
  fixture: AdminAuthFixture;
  ok: true;
};

// Mirrors ~/server/auth/totp.ts's algorithm independently (RFC 6238) so the
// e2e test can compute a valid code for the fixture's plaintext secret
// without importing server-only code into the Playwright test bundle.
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Decode(input: string) {
  const cleaned = input.toUpperCase().replace(/[^A-Z2-7]/gu, "");
  let bits = "";

  for (const char of cleaned) {
    const value = BASE32_ALPHABET.indexOf(char);

    if (value === -1) continue;

    bits += value.toString(2).padStart(5, "0");
  }

  const bytes: number[] = [];

  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }

  return Buffer.from(bytes);
}

function currentTotpCode(secretBase32: string) {
  const step = Math.floor(Date.now() / 1000 / 30);
  const key = base32Decode(secretBase32);
  const counterBuffer = Buffer.alloc(8);

  counterBuffer.writeBigUInt64BE(BigInt(step));

  const hmac = createHmac("sha1", key).update(counterBuffer).digest();
  const offset = (hmac.at(-1) ?? 0) & 0x0f;
  const binaryCode =
    ((hmac[offset]! & 0x7f) << 24) |
    ((hmac[offset + 1]! & 0xff) << 16) |
    ((hmac[offset + 2]! & 0xff) << 8) |
    (hmac[offset + 3]! & 0xff);

  return (binaryCode % 1_000_000).toString().padStart(6, "0");
}

export async function createAdminAuthFixture(
  page: Page,
  role: AdminAuthFixtureRole = "full",
) {
  const response = await page.request.post("/api/e2e/admin-auth", {
    data: { role },
  });

  expect(
    response.status(),
    "E2E_AUTH_FIXTURES=1 must be enabled for admin auth fixture setup.",
  ).toBe(200);

  const body = (await response.json()) as AdminAuthFixtureResponse;

  return body.fixture;
}

/**
 * Drives the full password -> TOTP (or recovery code) -> session flow
 * through the real UI, using a freshly-seeded fixture admin. Leaves the page
 * on whatever `next` resolved to.
 */
export async function signInAdminWithFixture(
  page: Page,
  options: { role?: AdminAuthFixtureRole; useRecoveryCode?: boolean } = {},
) {
  const fixture = await createAdminAuthFixture(page, options.role ?? "full");

  await page.goto("/admin/login");
  await page.locator("#email").fill(fixture.email);
  await page.locator("#password").fill(fixture.password);
  await page.getByRole("button", { name: /אדמין|Admin/u }).click();

  await page.waitForURL(/\/admin\/login\/mfa/u);
  await page.locator("#code").waitFor({ state: "visible" });

  const code = options.useRecoveryCode
    ? fixture.recoveryCodes[0]!
    : currentTotpCode(fixture.totpSecret);

  await page.locator("#code").fill(code);
  await Promise.all([
    page.waitForURL((url) => !url.pathname.startsWith("/admin/login"), {
      timeout: 15_000,
    }),
    page.getByRole("button", { name: /אישור/u }).click(),
  ]);

  return fixture;
}
