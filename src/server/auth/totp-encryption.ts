// ADR 0005 (docs/DECISIONS.md): TOTP secrets must be recoverable to verify
// codes, so they're encrypted at rest (AES-256-GCM via node:crypto — no
// external crypto dependency, matching ~/server/auth/password.ts), not
// hashed. The encryption key is deliberately a SEPARATE secret from
// AUTH_SECRET (docs/RUNBOOKS.md §10): AUTH_SECRET rotation is a routine,
// low-severity operation (admins simply re-login), but rotating this key
// would permanently undecrypt every stored TOTP secret and lock out every
// admin at once — that must stay a rare, explicit, documented operation, not
// a hidden side effect of routine AUTH_SECRET rotation.

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from "node:crypto";

import { env } from "~/env";

const ENCRYPTION_VERSION = "v1";
const KEY_LENGTH = 32;
const IV_LENGTH = 12;
const KEY_DERIVATION_SALT = "elysia-admin-totp-encryption-key-v1";
const DEV_FALLBACK_SECRET = "elysia-admin-totp-dev-fallback-insecure-key";

let cachedKey: Buffer | null = null;
let warnedDevFallback = false;

function getEncryptionKey() {
  if (cachedKey) {
    return cachedKey;
  }

  const configured = env.ADMIN_TOTP_ENCRYPTION_KEY;

  if (!configured && !warnedDevFallback) {
    console.warn(
      "[admin-totp] ADMIN_TOTP_ENCRYPTION_KEY is not set — using an " +
        "insecure, deterministic development-only key. Set a real secret " +
        "before production use (docs/RUNBOOKS.md §10).",
    );
    warnedDevFallback = true;
  }

  cachedKey = scryptSync(
    configured ?? DEV_FALLBACK_SECRET,
    KEY_DERIVATION_SALT,
    KEY_LENGTH,
  );

  return cachedKey;
}

export function encryptTotpSecret(secretBase32: string) {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(secretBase32, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    ENCRYPTION_VERSION,
    iv.toString("hex"),
    tag.toString("hex"),
    ciphertext.toString("hex"),
  ].join(":");
}

export function decryptTotpSecret(ciphertext: string) {
  const parts = ciphertext.split(":");

  if (parts.length !== 4 || parts[0] !== ENCRYPTION_VERSION) {
    throw new Error("Unrecognized TOTP ciphertext format");
  }

  const [, ivHex, tagHex, dataHex] = parts as [string, string, string, string];
  const key = getEncryptionKey();
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(ivHex, "hex"),
  );

  decipher.setAuthTag(Buffer.from(tagHex, "hex"));

  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(dataHex, "hex")),
    decipher.final(),
  ]);

  return plaintext.toString("utf8");
}

export function resetAdminTotpEncryptionKeyCacheForTests() {
  cachedKey = null;
  warnedDevFallback = false;
}
