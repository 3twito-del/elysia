import { describe, expect, it } from "vitest";

import { feedbackInputSchema } from "./feedback-validation";

describe("feedback validation", () => {
  it("accepts a valid message", () => {
    const result = feedbackInputSchema.safeParse({
      message: "אשמח לראות יותר טבעות בגדלים גדולים.",
    });
    expect(result.success).toBe(true);
  });

  it("accepts message with optional email and url", () => {
    const result = feedbackInputSchema.safeParse({
      message: "כיף מאוד לקנות כאן!",
      email: "test@example.com",
      url: "/product/ring-1",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("test@example.com");
      expect(result.data.url).toBe("/product/ring-1");
    }
  });

  it("rejects empty message", () => {
    const result = feedbackInputSchema.safeParse({ message: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("יש להזין הודעה.");
    }
  });

  it("rejects message over 1000 characters", () => {
    const result = feedbackInputSchema.safeParse({ message: "א".repeat(1001) });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("ארוכה מדי");
    }
  });

  it("rejects invalid email", () => {
    const result = feedbackInputSchema.safeParse({
      message: "בדיקה",
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "יש להזין כתובת אימייל תקינה.",
      );
    }
  });

  it("lowercases the email", () => {
    const result = feedbackInputSchema.safeParse({
      message: "בדיקה",
      email: "User@Example.COM",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("user@example.com");
    }
  });

  it("allows empty string for email", () => {
    const result = feedbackInputSchema.safeParse({
      message: "בדיקה",
      email: "",
    });
    expect(result.success).toBe(true);
  });

  it("trims whitespace from message", () => {
    const result = feedbackInputSchema.safeParse({ message: "  הודעה  " });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.message).toBe("הודעה");
    }
  });
});
