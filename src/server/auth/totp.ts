// ADR 0005 (docs/DECISIONS.md): mandatory admin TOTP MFA. HOTP/TOTP (RFC
// 4226 / RFC 6238) implemented directly with node:crypto, matching this
// module's sibling ~/server/auth/password.ts (hand-rolled scrypt, no
// bcrypt/otplib dependency) — no external TOTP library exists in this repo.

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const TOTP_STEP_SECONDS = 30;
export const TOTP_DIGITS = 6;
export const TOTP_SECRET_BYTES = 20;

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function generateTotpSecret(byteLength: number = TOTP_SECRET_BYTES) {
  return base32Encode(randomBytes(byteLength));
}

export function base32Encode(buffer: Buffer) {
  let bits = "";

  for (const byte of buffer) {
    bits += byte.toString(2).padStart(8, "0");
  }

  let output = "";

  for (let i = 0; i + 5 <= bits.length; i += 5) {
    output += BASE32_ALPHABET[parseInt(bits.slice(i, i + 5), 2)];
  }

  const remainder = bits.length % 5;

  if (remainder > 0) {
    const chunk = bits.slice(bits.length - remainder).padEnd(5, "0");
    output += BASE32_ALPHABET[parseInt(chunk, 2)];
  }

  return output;
}

export function base32Decode(input: string) {
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

function hotpCodeAtCounter(
  secretBase32: string,
  counter: number,
  digits: number = TOTP_DIGITS,
) {
  const key = base32Decode(secretBase32);
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));

  const hmac = createHmac("sha1", key).update(counterBuffer).digest();
  const offset = (hmac.at(-1) ?? 0) & 0x0f;
  const binaryCode =
    ((hmac[offset]! & 0x7f) << 24) |
    ((hmac[offset + 1]! & 0xff) << 16) |
    ((hmac[offset + 2]! & 0xff) << 8) |
    (hmac[offset + 3]! & 0xff);

  const modDivisor = 10 ** digits;

  return (binaryCode % modDivisor).toString().padStart(digits, "0");
}

export function totpCodeAtStep(
  secretBase32: string,
  step: number,
  digits: number = TOTP_DIGITS,
) {
  return hotpCodeAtCounter(secretBase32, step, digits);
}

export function currentTotpStep(
  now: number = Date.now(),
  stepSeconds: number = TOTP_STEP_SECONDS,
) {
  return Math.floor(now / 1000 / stepSeconds);
}

/**
 * Accepts the current step plus a small drift window (default ±1 step, i.e.
 * ±30s) so a slightly-off device clock doesn't lock the admin out.
 */
export function verifyTotpCode(
  secretBase32: string,
  code: string,
  opts: { now?: number; windowSteps?: number } = {},
) {
  const trimmed = code.replace(/\s+/gu, "");

  if (!/^\d{6}$/u.test(trimmed)) {
    return false;
  }

  const step = currentTotpStep(opts.now);
  const window = opts.windowSteps ?? 1;
  const trimmedBuffer = Buffer.from(trimmed);

  for (let delta = -window; delta <= window; delta++) {
    const candidate = Buffer.from(hotpCodeAtCounter(secretBase32, step + delta));

    if (timingSafeEqual(candidate, trimmedBuffer)) {
      return true;
    }
  }

  return false;
}

export function buildOtpAuthUri(opts: {
  secretBase32: string;
  accountLabel: string;
  issuer: string;
}) {
  const label = encodeURIComponent(`${opts.issuer}:${opts.accountLabel}`);
  const params = new URLSearchParams({
    algorithm: "SHA1",
    digits: String(TOTP_DIGITS),
    issuer: opts.issuer,
    period: String(TOTP_STEP_SECONDS),
    secret: opts.secretBase32,
  });

  return `otpauth://totp/${label}?${params.toString()}`;
}
