// ADR 0005 (docs/DECISIONS.md): one-time admin recovery codes. Generation is
// pure and display-only — hashing reuses ~/server/auth/password.ts's
// existing scrypt scheme (it works for any secret string, not just
// passwords), so this module has no crypto of its own beyond random
// selection.

import { randomInt } from "node:crypto";

// Excludes 0/O and 1/I/L to avoid transcription mistakes when an admin
// copies a code from a screen or a printed backup sheet.
const RECOVERY_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const RECOVERY_CODE_GROUP_LENGTH = 4;
const RECOVERY_CODE_GROUPS = 2;
export const RECOVERY_CODE_COUNT = 10;

export function generateRecoveryCodes(count: number = RECOVERY_CODE_COUNT) {
  return Array.from({ length: count }, () => generateRecoveryCode());
}

function generateRecoveryCode() {
  const groups = Array.from({ length: RECOVERY_CODE_GROUPS }, () =>
    Array.from(
      { length: RECOVERY_CODE_GROUP_LENGTH },
      () =>
        RECOVERY_CODE_ALPHABET[randomInt(RECOVERY_CODE_ALPHABET.length)],
    ).join(""),
  );

  return groups.join("-");
}

/** Strips separators/whitespace and uppercases, so a code hashed at
 * generation time matches one an admin re-types with or without the hyphen. */
export function normalizeRecoveryCodeInput(input: string) {
  return input.trim().toUpperCase().replace(/[^A-Z0-9]/gu, "");
}
