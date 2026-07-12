import { afterEach, describe, expect, it } from "vitest";

import {
  decryptTotpSecret,
  encryptTotpSecret,
  resetAdminTotpEncryptionKeyCacheForTests,
} from "./totp-encryption";

afterEach(() => {
  resetAdminTotpEncryptionKeyCacheForTests();
});

describe("encryptTotpSecret / decryptTotpSecret", () => {
  it("round-trips a secret", () => {
    const secret = "JBSWY3DPEHPK3PXP";
    const ciphertext = encryptTotpSecret(secret);

    expect(decryptTotpSecret(ciphertext)).toBe(secret);
  });

  it("produces a different ciphertext each time (random IV)", () => {
    const secret = "JBSWY3DPEHPK3PXP";

    expect(encryptTotpSecret(secret)).not.toBe(encryptTotpSecret(secret));
  });

  it("rejects a tampered ciphertext (auth tag mismatch)", () => {
    const secret = "JBSWY3DPEHPK3PXP";
    const ciphertext = encryptTotpSecret(secret);
    const parts = ciphertext.split(":");
    const dataHex = parts.at(-1)!;
    const flippedByte = (parseInt(dataHex.slice(0, 2), 16) ^ 0xff)
      .toString(16)
      .padStart(2, "0");
    const tampered = [
      ...parts.slice(0, -1),
      flippedByte + dataHex.slice(2),
    ].join(":");

    expect(() => decryptTotpSecret(tampered)).toThrow();
  });

  it("rejects an unrecognized ciphertext format", () => {
    expect(() => decryptTotpSecret("not-a-valid-ciphertext")).toThrow();
  });
});
