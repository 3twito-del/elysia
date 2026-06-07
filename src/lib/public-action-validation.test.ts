import { describe, expect, it } from "vitest";

import {
  adminLoginInputSchema,
  newsletterInputSchema,
  wishlistInputSchema,
} from "./public-action-validation";

describe("public action validation", () => {
  it("normalizes newsletter emails", () => {
    const parsed = newsletterInputSchema.parse({
      email: " DANA@EXAMPLE.COM ",
      marketingConsent: "on",
    });

    expect(parsed.email).toBe("dana@example.com");
  });

  it("requires explicit newsletter marketing consent", () => {
    const parsed = newsletterInputSchema.safeParse({
      email: "dana@example.com",
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects missing wishlist product slugs with Hebrew copy", () => {
    const parsed = wishlistInputSchema.safeParse({ productSlug: "" });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]?.message).toBe("לא נמצא תכשיט לשמירה.");
    }
  });

  it("rejects short admin passwords before attempting sign-in", () => {
    const parsed = adminLoginInputSchema.safeParse({
      email: "admin@example.com",
      password: "short",
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]?.message).toBe(
        "יש להזין סיסמת אדמין תקינה.",
      );
    }
  });
});
