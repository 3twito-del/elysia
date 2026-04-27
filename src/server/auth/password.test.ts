import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "./password";

describe("admin password hashing", () => {
  it("verifies a matching password", async () => {
    const hash = await hashPassword("correct horse battery staple");

    await expect(
      verifyPassword("correct horse battery staple", hash),
    ).resolves.toBe(true);
  });

  it("rejects a wrong password", async () => {
    const hash = await hashPassword("correct horse battery staple");

    await expect(verifyPassword("wrong password", hash)).resolves.toBe(false);
  });

  it("rejects malformed hashes", async () => {
    await expect(verifyPassword("password", "plain-text")).resolves.toBe(false);
  });
});
