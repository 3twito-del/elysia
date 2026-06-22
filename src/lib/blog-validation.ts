import { z } from "zod";

import { optionalTrimmedString } from "./form-validation";

const blogPostStatuses = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const rawHtmlPattern = /<\/?[a-z][\s\S]*>/iu;

const requiredId = (message = "חסר מזהה.") =>
  z.string().trim().min(1, message).max(128, "המזהה ארוך מדי.");

const optionalUrl = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim().length === 0 ? undefined : value,
  z
    .string()
    .trim()
    .url("יש להזין כתובת תמונה תקינה.")
    .max(2_048, "כתובת התמונה ארוכה מדי.")
    .optional(),
);

export const blogSlugSchema = z
  .string()
  .trim()
  .min(3, "יש להזין slug באורך 3 תווים לפחות.")
  .max(120, "ה-slug ארוך מדי.")
  .regex(
    slugPattern,
    "ה-slug יכול לכלול אותיות קטנות באנגלית, מספרים ומקפים בלבד.",
  );

export const blogMarkdownSchema = z
  .string()
  .trim()
  .min(20, "יש להזין תוכן מאמר מלא.")
  .max(20_000, "תוכן המאמר ארוך מדי.")
  .refine(
    (value) => !rawHtmlPattern.test(value),
    "Markdown יכול לכלול טקסט, כותרות, רשימות וקישורים, אך לא HTML חופשי.",
  );

export const blogListInputSchema = z.object({
  category: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(24).default(12),
  q: z.string().trim().max(160).optional(),
  tag: z.string().trim().max(120).optional(),
});

export const adminBlogPostListInputSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  query: z.string().trim().max(160).optional(),
  sort: z
    .enum(["updated-desc", "published-desc", "title-asc"])
    .default("updated-desc"),
  status: z.enum(blogPostStatuses).optional(),
});

const blogPostFields = {
  authorId: requiredId("יש לבחור כותב.").optional(),
  bodyMarkdown: blogMarkdownSchema,
  categoryId: requiredId("יש לבחור קטגוריה.").optional(),
  excerpt: z
    .string()
    .trim()
    .min(20, "יש להזין תקציר.")
    .max(320, "התקציר ארוך מדי."),
  featured: z.boolean().default(false),
  heroImageAlt: optionalTrimmedString(160, "הטקסט החלופי ארוך מדי."),
  heroImageUrl: optionalUrl,
  publishedAt: z.coerce.date().optional(),
  relatedProductIds: z
    .array(requiredId())
    .max(8, "ניתן לקשר עד 8 מוצרים.")
    .default([]),
  seoDescription: optionalTrimmedString(170, "תיאור SEO ארוך מדי."),
  seoTitle: optionalTrimmedString(70, "כותרת SEO ארוכה מדי."),
  slug: blogSlugSchema,
  status: z.enum(blogPostStatuses).default("DRAFT"),
  tagIds: z.array(requiredId()).max(12, "ניתן לבחור עד 12 תגיות.").default([]),
  title: z
    .string()
    .trim()
    .min(3, "יש להזין כותרת.")
    .max(140, "הכותרת ארוכה מדי."),
};

type BlogPostValidationInput = {
  heroImageAlt?: string;
  heroImageUrl?: string;
};

function validateBlogPost(
  input: BlogPostValidationInput,
  context: z.RefinementCtx,
) {
  if (input.heroImageUrl && !input.heroImageAlt) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "יש להזין טקסט חלופי לתמונת Hero.",
      path: ["heroImageAlt"],
    });
  }
}

export const createAdminBlogPostInputSchema = z
  .object(blogPostFields)
  .superRefine(validateBlogPost);

export const updateAdminBlogPostInputSchema = z
  .object({
    id: requiredId("חסר מאמר לעדכון."),
    ...blogPostFields,
  })
  .superRefine(validateBlogPost);

export const createAdminBlogAuthorInputSchema = z.object({
  bio: optionalTrimmedString(700, "הביוגרפיה ארוכה מדי."),
  imageUrl: optionalUrl,
  name: z.string().trim().min(2, "יש להזין שם כותב.").max(120),
  slug: blogSlugSchema,
  title: optionalTrimmedString(120, "תפקיד הכותב ארוך מדי."),
});

export const createAdminBlogCategoryInputSchema = z.object({
  description: optionalTrimmedString(260, "תיאור הקטגוריה ארוך מדי."),
  name: z.string().trim().min(2, "יש להזין שם קטגוריה.").max(120),
  slug: blogSlugSchema,
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
});

export const createAdminBlogTagInputSchema = z.object({
  name: z.string().trim().min(2, "יש להזין שם תגית.").max(80),
  slug: blogSlugSchema,
});

export type BlogListInput = z.input<typeof blogListInputSchema>;
export type AdminBlogPostListInput = z.infer<
  typeof adminBlogPostListInputSchema
>;
