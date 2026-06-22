import type {
  BlogAuthor,
  BlogCategory,
  BlogPostStatus,
  BlogTag,
} from "@prisma/client";

import { DEFAULT_CATALOG_IMAGE } from "./catalog-assets";

export type FixtureBlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  bodyMarkdown: string;
  status: BlogPostStatus;
  publishedAt: Date;
  heroImageUrl: string;
  heroImageAlt: string;
  seoTitle: string;
  seoDescription: string;
  featured: boolean;
  author: BlogAuthor;
  category: BlogCategory;
  tags: BlogTag[];
  relatedProducts: [];
  createdAt: Date;
  updatedAt: Date;
};

const fixtureDate = new Date("2026-01-10T10:00:00.000Z");

export const fixtureBlogAuthor: BlogAuthor = {
  id: "blog_author_elysia",
  slug: "elysia-studio",
  name: "Elysia Studio",
  title: "צוות הסטודיו",
  bio: "הערות קצרות מהסטודיו על בחירת תכשיטים, טיפול יומיומי וחומרים.",
  imageUrl: null,
  createdAt: fixtureDate,
  updatedAt: fixtureDate,
};

export const fixtureBlogCategories: BlogCategory[] = [
  {
    id: "blog_category_care",
    slug: "care",
    name: "טיפול בתכשיטים",
    description: "מדריכים קצרים לשמירה על תכשיטי היום-יום.",
    sortOrder: 0,
    createdAt: fixtureDate,
    updatedAt: fixtureDate,
  },
  {
    id: "blog_category_styling",
    slug: "styling",
    name: "סטיילינג",
    description: "בחירות שכבות, מידות ומתנות לפי רגע.",
    sortOrder: 1,
    createdAt: fixtureDate,
    updatedAt: fixtureDate,
  },
];

export const fixtureBlogTags: BlogTag[] = [
  {
    id: "blog_tag_gold",
    slug: "gold",
    name: "זהב",
    createdAt: fixtureDate,
    updatedAt: fixtureDate,
  },
  {
    id: "blog_tag_daily-care",
    slug: "daily-care",
    name: "טיפול יומיומי",
    createdAt: fixtureDate,
    updatedAt: fixtureDate,
  },
];

export const fixtureBlogPosts: FixtureBlogPost[] = [
  {
    id: "blog_post_jewellery_care",
    slug: "elysia-jewellery-care-guide",
    title: "איך לשמור על תכשיטי Elysia ביום-יום",
    excerpt:
      "מדריך קצר לשגרה עדינה: אחסון, ניקוי ומגע עם מים או בישום לפני ענידה.",
    bodyMarkdown: [
      "תכשיט שנשמר נכון נשאר נעים לענידה לאורך זמן.",
      "",
      "## לפני ענידה",
      "",
      "- מרחי בושם וקרם לפני התכשיט.",
      "- המתיני כמה דקות לפני מגע עם מתכת או פנינים.",
      "- הסירי תכשיטים לפני מקלחת, ים או אימון.",
      "",
      "## אחסון",
      "",
      "שמרי כל פריט בנפרד, בתוך שקיק רך או קופסה יבשה. כך מצמצמים שריטות, קשרים בשרשראות ומגע מיותר בין מתכות.",
    ].join("\n"),
    status: "PUBLISHED",
    publishedAt: fixtureDate,
    heroImageUrl: DEFAULT_CATALOG_IMAGE,
    heroImageAlt: "תכשיטי Elysia על בד בהיר",
    seoTitle: "איך לשמור על תכשיטי Elysia",
    seoDescription:
      "מדריך קצר לטיפול יומיומי בתכשיטים: אחסון, ניקוי ומתי להסיר לפני מים, בישום או אימון.",
    featured: true,
    author: fixtureBlogAuthor,
    category: fixtureBlogCategories[0]!,
    tags: fixtureBlogTags,
    relatedProducts: [],
    createdAt: fixtureDate,
    updatedAt: fixtureDate,
  },
];

export function listFixtureBlogPosts() {
  return fixtureBlogPosts;
}

export function getFixtureBlogPostBySlug(slug: string) {
  return fixtureBlogPosts.find((post) => post.slug === slug) ?? null;
}
