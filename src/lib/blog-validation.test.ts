import { describe, expect, it } from "vitest";

import {
  createAdminBlogPostInputSchema,
  updateAdminBlogPostInputSchema,
} from "./blog-validation";

const validPost = {
  slug: "elysia-care-guide",
  title: "מדריך טיפול בתכשיטים",
  excerpt: "תקציר מאמר ברור באורך מתאים שמוצג ברשימת המגזין.",
  bodyMarkdown:
    "## כותרת\n\nתוכן מאמר מלא וברור עם רשימה קצרה.\n\n- סעיף ראשון\n- סעיף שני",
  status: "PUBLISHED",
  publishedAt: new Date("2026-01-10T10:00:00.000Z"),
  featured: true,
  heroImageUrl: "https://res.cloudinary.com/demo/image/upload/sample.avif",
  heroImageAlt: "תכשיט על בד בהיר",
  seoTitle: "מדריך טיפול בתכשיטים",
  seoDescription: "מדריך קצר וברור לטיפול בתכשיטים, אחסון ושמירה יומיומית.",
  tagIds: ["tag_1"],
  relatedProductIds: ["product_1"],
};

describe("blog validation", () => {
  it("accepts scheduled published posts", () => {
    const parsed = createAdminBlogPostInputSchema.safeParse({
      ...validPost,
      publishedAt: new Date("2030-01-10T10:00:00.000Z"),
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects unsafe slugs and raw HTML in markdown", () => {
    const parsed = createAdminBlogPostInputSchema.safeParse({
      ...validPost,
      slug: "Bad Slug",
      bodyMarkdown: "## כותרת\n\n<script>alert(1)</script> תוכן מאמר מלא.",
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.flatten().fieldErrors.slug).toBeDefined();
      expect(parsed.error.flatten().fieldErrors.bodyMarkdown).toBeDefined();
    }
  });

  it("requires alt text when a hero image is configured", () => {
    const parsed = createAdminBlogPostInputSchema.safeParse({
      ...validPost,
      heroImageAlt: "",
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.flatten().fieldErrors.heroImageAlt).toBeDefined();
    }
  });

  it("validates SEO and image field lengths on update", () => {
    const parsed = updateAdminBlogPostInputSchema.safeParse({
      id: "post_1",
      ...validPost,
      heroImageUrl: "not-a-url",
      seoTitle: "א".repeat(71),
      seoDescription: "א".repeat(171),
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;

      expect(errors.heroImageUrl).toBeDefined();
      expect(errors.seoTitle).toBeDefined();
      expect(errors.seoDescription).toBeDefined();
    }
  });
});
