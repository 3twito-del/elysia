import { db } from "~/server/db";

/**
 * Internal knowledge base / wiki (KNW, Phase 7).
 *
 * Articles are drafted, published and archived; published articles are the
 * staff-facing wiki. slugify and searchArticles are pure and exported for tests.
 */

/** URL-safe slug, Unicode-aware so Hebrew titles keep their letters. Pure. */
export function slugify(title: string): string {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");

  return slug.length > 0 ? slug : "article";
}

export type ArticleSearchInput = {
  title: string;
  body: string;
  category: string | null;
};

/** Case-insensitive filter over title/body/category. Pure. */
export function searchArticles<T extends ArticleSearchInput>(
  articles: T[],
  query: string,
): T[] {
  const needle = query.trim().toLowerCase();
  if (needle.length === 0) return articles;

  return articles.filter((article) =>
    [article.title, article.body, article.category]
      .filter((field): field is string => Boolean(field))
      .some((field) => field.toLowerCase().includes(needle)),
  );
}

async function uniqueSlug(title: string): Promise<string> {
  const base = slugify(title);
  const existing = await db.knowledgeArticle.count({
    where: { slug: { startsWith: base } },
  });
  return existing === 0 ? base : `${base}-${existing + 1}`;
}

/** Creates a DRAFT article. */
export async function createArticle(input: {
  title: string;
  body: string;
  category?: string;
  authorAdminUserId?: string;
}) {
  return db.knowledgeArticle.create({
    data: {
      slug: await uniqueSlug(input.title),
      title: input.title,
      body: input.body,
      category: input.category,
      authorAdminUserId: input.authorAdminUserId,
    },
  });
}

/** Sets an article's status (PUBLISHED / ARCHIVED / DRAFT). */
export async function setArticleStatus(input: {
  articleId: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
}) {
  return db.knowledgeArticle.update({
    where: { id: input.articleId },
    data: { status: input.status },
  });
}

/** Recent articles, optionally filtered by a search query. */
export async function listArticles(input: { query?: string; limit?: number } = {}) {
  const articles = await db.knowledgeArticle.findMany({
    orderBy: { updatedAt: "desc" },
    take: input.limit ?? 50,
    select: {
      id: true,
      slug: true,
      title: true,
      category: true,
      body: true,
      status: true,
      updatedAt: true,
    },
  });

  return input.query ? searchArticles(articles, input.query) : articles;
}
