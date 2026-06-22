import type { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import type { z } from "zod";

import { blogListInputSchema, type BlogListInput } from "~/lib/blog-validation";
import { db } from "~/server/db";
import {
  BLOG_CACHE_TAGS,
  blogCategoryCacheTag,
  blogPostCacheTag,
  blogTagCacheTag,
} from "~/server/services/blog-cache";
import {
  getFixtureBlogPostBySlug,
  listFixtureBlogPosts,
  fixtureBlogCategories,
  fixtureBlogTags,
  type FixtureBlogPost,
} from "~/server/services/blog-fixtures";
import { DEFAULT_CATALOG_IMAGE } from "~/server/services/catalog-assets";

const BLOG_REVALIDATE_SECONDS = 60 * 60;
const BLOG_CACHE_VERSION = "blog:v2";

type ParsedBlogListInput = z.output<typeof blogListInputSchema>;

const publicBlogPostSummaryInclude = {
  author: true,
  category: true,
  tags: { orderBy: { name: "asc" as const } },
} satisfies Prisma.BlogPostInclude;

const publicBlogPostDetailInclude = {
  ...publicBlogPostSummaryInclude,
  relatedProducts: {
    where: { status: "ACTIVE" as const },
    orderBy: { createdAt: "desc" as const },
    take: 4,
    include: {
      media: {
        where: { kind: "IMAGE" as const },
        orderBy: [
          { isPrimary: "desc" as const },
          { sortOrder: "asc" as const },
        ],
        take: 1,
      },
    },
  },
} satisfies Prisma.BlogPostInclude;

type BlogPostSummaryRecord = Prisma.BlogPostGetPayload<{
  include: typeof publicBlogPostSummaryInclude;
}>;

type BlogPostDetailRecord = Prisma.BlogPostGetPayload<{
  include: typeof publicBlogPostDetailInclude;
}>;

export type BlogTaxonomyItem = {
  count: number;
  description?: string;
  name: string;
  slug: string;
};

export type PublicBlogRelatedProduct = {
  image: string;
  name: string;
  slug: string;
};

export type PublicBlogPostSummary = {
  author?: {
    imageUrl?: string;
    name: string;
    slug: string;
    title?: string;
  };
  category?: {
    name: string;
    slug: string;
  };
  excerpt: string;
  featured: boolean;
  heroImageAlt?: string;
  heroImageUrl?: string;
  id: string;
  publishedAt: Date;
  readingMinutes: number;
  slug: string;
  tags: Array<{ name: string; slug: string }>;
  title: string;
  updatedAt: Date;
};

export type PublicBlogPostDetail = PublicBlogPostSummary & {
  bodyMarkdown: string;
  relatedProducts: PublicBlogRelatedProduct[];
  seoDescription?: string;
  seoTitle?: string;
};

export type BlogPostListResult = {
  categories: BlogTaxonomyItem[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  posts: PublicBlogPostSummary[];
  tags: BlogTaxonomyItem[];
};

export async function listPublishedBlogPosts(input: BlogListInput = {}) {
  const parsed = blogListInputSchema.parse(input);
  const getCached = unstable_cache(
    async () =>
      readBlogData({
        label: "blog-posts",
        fallback: () => listFixturePublishedBlogPosts(parsed),
        database: () => listDatabasePublishedBlogPosts(parsed),
      }),
    [
      BLOG_CACHE_VERSION,
      "blog:posts",
      parsed.q ?? "",
      parsed.category ?? "",
      parsed.tag ?? "",
      String(parsed.page),
      String(parsed.pageSize),
    ],
    {
      revalidate: BLOG_REVALIDATE_SECONDS,
      tags: [
        BLOG_CACHE_TAGS.posts,
        BLOG_CACHE_TAGS.taxonomy,
        ...(parsed.category ? [blogCategoryCacheTag(parsed.category)] : []),
        ...(parsed.tag ? [blogTagCacheTag(parsed.tag)] : []),
      ],
    },
  );

  return getCached();
}

export async function getPublishedBlogPostBySlug(slug: string) {
  const getCached = unstable_cache(
    async () =>
      readBlogData({
        label: `blog-post:${slug}`,
        fallback: () => {
          const post = getFixtureBlogPostBySlug(slug);

          return post ? mapFixtureBlogPostDetail(post) : null;
        },
        database: () => getDatabasePublishedBlogPostBySlug(slug),
      }),
    [BLOG_CACHE_VERSION, "blog:post", slug],
    {
      revalidate: BLOG_REVALIDATE_SECONDS,
      tags: [BLOG_CACHE_TAGS.posts, blogPostCacheTag(slug)],
    },
  );

  return getCached();
}

export const getPublishedBlogPostBySlugCachedRequest = cache(
  getPublishedBlogPostBySlug,
);

export async function listBlogTaxonomy() {
  const getCached = unstable_cache(
    async () =>
      readBlogData({
        label: "blog-taxonomy",
        fallback: getFixtureBlogTaxonomy,
        database: getDatabaseBlogTaxonomy,
      }),
    [BLOG_CACHE_VERSION, "blog:taxonomy"],
    {
      revalidate: BLOG_REVALIDATE_SECONDS,
      tags: [BLOG_CACHE_TAGS.taxonomy],
    },
  );

  return getCached();
}

export async function listSitemapBlogPosts() {
  return readBlogData({
    label: "blog-sitemap",
    fallback: () =>
      listFixtureBlogPosts()
        .filter(
          (post) =>
            post.status === "PUBLISHED" && post.publishedAt <= new Date(),
        )
        .map((post) => ({
          slug: post.slug,
          updatedAt: post.updatedAt,
        })),
    database: async () => {
      const posts = await db.blogPost.findMany({
        where: getPublishedBlogPostWhere(),
        orderBy: { publishedAt: "desc" },
        select: { slug: true, updatedAt: true },
      });

      return posts;
    },
  });
}

function getPublishedBlogPostWhere(): Prisma.BlogPostWhereInput {
  return {
    status: "PUBLISHED",
    publishedAt: { lte: new Date() },
  };
}

async function listDatabasePublishedBlogPosts(
  input: ParsedBlogListInput,
): Promise<BlogPostListResult> {
  const where = createPublishedBlogPostWhere(input);
  const [posts, totalItems, taxonomy] = await Promise.all([
    db.blogPost.findMany({
      where,
      orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
      skip: getSkip(input),
      take: input.pageSize,
      include: publicBlogPostSummaryInclude,
    }),
    db.blogPost.count({ where }),
    getDatabaseBlogTaxonomy(),
  ]);

  return {
    ...taxonomy,
    pageInfo: createPageInfo({
      page: input.page,
      pageSize: input.pageSize,
      totalItems,
    }),
    posts: posts.map(mapBlogPostSummary),
  };
}

async function getDatabasePublishedBlogPostBySlug(slug: string) {
  const post = await db.blogPost.findFirst({
    where: {
      ...getPublishedBlogPostWhere(),
      slug,
    },
    include: publicBlogPostDetailInclude,
  });

  return post ? mapBlogPostDetail(post) : null;
}

async function getDatabaseBlogTaxonomy() {
  const [categories, tags] = await Promise.all([
    db.blogCategory.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        posts: {
          where: getPublishedBlogPostWhere(),
          select: { id: true },
        },
      },
    }),
    db.blogTag.findMany({
      orderBy: { name: "asc" },
      include: {
        posts: {
          where: getPublishedBlogPostWhere(),
          select: { id: true },
        },
      },
    }),
  ]);

  return {
    categories: categories
      .map((category) => ({
        count: category.posts.length,
        description: category.description ?? undefined,
        name: category.name,
        slug: category.slug,
      }))
      .filter((category) => category.count > 0),
    tags: tags
      .map((tag) => ({
        count: tag.posts.length,
        name: tag.name,
        slug: tag.slug,
      }))
      .filter((tag) => tag.count > 0),
  };
}

function createPublishedBlogPostWhere(
  input: ParsedBlogListInput,
): Prisma.BlogPostWhereInput {
  const query = input.q?.trim();

  return {
    ...getPublishedBlogPostWhere(),
    ...(input.category ? { category: { slug: input.category } } : {}),
    ...(input.tag ? { tags: { some: { slug: input.tag } } } : {}),
    ...(query
      ? {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { excerpt: { contains: query, mode: "insensitive" } },
            { bodyMarkdown: { contains: query, mode: "insensitive" } },
            { category: { name: { contains: query, mode: "insensitive" } } },
            {
              tags: {
                some: { name: { contains: query, mode: "insensitive" } },
              },
            },
          ],
        }
      : {}),
  };
}

function listFixturePublishedBlogPosts(
  input: ParsedBlogListInput,
): BlogPostListResult {
  const query = input.q?.trim().toLowerCase();
  const filtered = listFixtureBlogPosts()
    .filter(
      (post) => post.status === "PUBLISHED" && post.publishedAt <= new Date(),
    )
    .filter((post) =>
      input.category ? post.category.slug === input.category : true,
    )
    .filter((post) =>
      input.tag ? post.tags.some((tag) => tag.slug === input.tag) : true,
    )
    .filter((post) => {
      if (!query) return true;

      return [
        post.title,
        post.excerpt,
        post.bodyMarkdown,
        post.category.name,
        ...post.tags.map((tag) => tag.name),
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    })
    .sort(
      (first, second) =>
        Number(second.featured) - Number(first.featured) ||
        second.publishedAt.getTime() - first.publishedAt.getTime(),
    );

  return {
    ...getFixtureBlogTaxonomy(),
    pageInfo: createPageInfo({
      page: input.page,
      pageSize: input.pageSize,
      totalItems: filtered.length,
    }),
    posts: filtered
      .slice(getSkip(input), getSkip(input) + input.pageSize)
      .map(mapFixtureBlogPostSummary),
  };
}

function getFixtureBlogTaxonomy() {
  const posts = listFixtureBlogPosts().filter(
    (post) => post.status === "PUBLISHED" && post.publishedAt <= new Date(),
  );

  return {
    categories: fixtureBlogCategories
      .map((category) => ({
        count: posts.filter((post) => post.category.slug === category.slug)
          .length,
        description: category.description ?? undefined,
        name: category.name,
        slug: category.slug,
      }))
      .filter((category) => category.count > 0),
    tags: fixtureBlogTags
      .map((tag) => ({
        count: posts.filter((post) =>
          post.tags.some((postTag) => postTag.slug === tag.slug),
        ).length,
        name: tag.name,
        slug: tag.slug,
      }))
      .filter((tag) => tag.count > 0),
  };
}

function mapBlogPostSummary(
  post: BlogPostSummaryRecord,
): PublicBlogPostSummary {
  return {
    author: post.author
      ? {
          imageUrl: post.author.imageUrl ?? undefined,
          name: post.author.name,
          slug: post.author.slug,
          title: post.author.title ?? undefined,
        }
      : undefined,
    category: post.category
      ? { name: post.category.name, slug: post.category.slug }
      : undefined,
    excerpt: post.excerpt,
    featured: post.featured,
    heroImageAlt: post.heroImageAlt ?? undefined,
    heroImageUrl: post.heroImageUrl ?? undefined,
    id: post.id,
    publishedAt: post.publishedAt ?? post.createdAt,
    readingMinutes: getReadingMinutes(post.bodyMarkdown),
    slug: post.slug,
    tags: post.tags.map((tag) => ({ name: tag.name, slug: tag.slug })),
    title: post.title,
    updatedAt: post.updatedAt,
  };
}

function mapBlogPostDetail(post: BlogPostDetailRecord): PublicBlogPostDetail {
  return {
    ...mapBlogPostSummary(post),
    bodyMarkdown: post.bodyMarkdown,
    relatedProducts: post.relatedProducts.map((product) => ({
      image: product.media[0]?.url ?? DEFAULT_CATALOG_IMAGE,
      name: product.name,
      slug: product.slug,
    })),
    seoDescription: post.seoDescription ?? undefined,
    seoTitle: post.seoTitle ?? undefined,
  };
}

function mapFixtureBlogPostSummary(
  post: FixtureBlogPost,
): PublicBlogPostSummary {
  return {
    author: {
      imageUrl: post.author.imageUrl ?? undefined,
      name: post.author.name,
      slug: post.author.slug,
      title: post.author.title ?? undefined,
    },
    category: { name: post.category.name, slug: post.category.slug },
    excerpt: post.excerpt,
    featured: post.featured,
    heroImageAlt: post.heroImageAlt,
    heroImageUrl: post.heroImageUrl,
    id: post.id,
    publishedAt: post.publishedAt,
    readingMinutes: getReadingMinutes(post.bodyMarkdown),
    slug: post.slug,
    tags: post.tags.map((tag) => ({ name: tag.name, slug: tag.slug })),
    title: post.title,
    updatedAt: post.updatedAt,
  };
}

function mapFixtureBlogPostDetail(post: FixtureBlogPost): PublicBlogPostDetail {
  return {
    ...mapFixtureBlogPostSummary(post),
    bodyMarkdown: post.bodyMarkdown,
    relatedProducts: [],
    seoDescription: post.seoDescription,
    seoTitle: post.seoTitle,
  };
}

async function readBlogData<T>({
  database,
  fallback,
  label,
}: {
  database: () => Promise<T>;
  fallback: () => Promise<T> | T;
  label: string;
}) {
  try {
    return await database();
  } catch (error) {
    if (!isBlogDatabaseReadError(error)) throw error;

    if (process.env.NODE_ENV === "development") {
      console.warn(
        `[blog] Falling back to fixture data for ${label}: ${getBlogErrorMessage(error)}`,
      );
    }

    return fallback();
  }
}

function isBlogDatabaseReadError(error: unknown) {
  const code =
    error && typeof error === "object" && "code" in error
      ? (error as { code?: unknown }).code
      : undefined;
  const message = getBlogErrorMessage(error);

  return (
    (typeof code === "string" &&
      ["P1000", "P1001", "P1002", "P1008", "P1017", "P2021", "P2024"].includes(
        code,
      )) ||
    /DATABASE_URL is required|Authentication failed against database server|Can't reach database server|Timed out fetching a new connection|Unable to start a transaction|Connection pool timeout|Cannot read properties of undefined \(reading '(findMany|findFirst|count)'\)/i.test(
      message,
    )
  );
}

function getBlogErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function getSkip(input: { page: number; pageSize: number }) {
  return (input.page - 1) * input.pageSize;
}

function createPageInfo(input: {
  page: number;
  pageSize: number;
  totalItems: number;
}) {
  const totalPages = Math.max(1, Math.ceil(input.totalItems / input.pageSize));
  const page = Math.min(input.page, totalPages);

  return {
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
    page,
    pageSize: input.pageSize,
    totalItems: input.totalItems,
    totalPages,
  };
}

function getReadingMinutes(markdown: string) {
  const words = markdown
    .replace(/[`*_#[\]()!>-]/gu, " ")
    .split(/\s+/u)
    .filter(Boolean);

  return Math.max(1, Math.ceil(words.length / 220));
}
