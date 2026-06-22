import { describe, expect, it, vi, beforeEach } from "vitest";

const dbMocks = vi.hoisted(() => ({
  blogCategoryFindMany: vi.fn(),
  blogPostCount: vi.fn(),
  blogPostFindFirst: vi.fn(),
  blogPostFindMany: vi.fn(),
  blogTagFindMany: vi.fn(),
}));

vi.mock("next/cache", () => ({
  unstable_cache: (fn: () => unknown) => fn,
}));

vi.mock("~/server/db", () => ({
  db: {
    blogCategory: { findMany: dbMocks.blogCategoryFindMany },
    blogPost: {
      count: dbMocks.blogPostCount,
      findFirst: dbMocks.blogPostFindFirst,
      findMany: dbMocks.blogPostFindMany,
    },
    blogTag: { findMany: dbMocks.blogTagFindMany },
  },
}));

import { getPublishedBlogPostBySlug, listPublishedBlogPosts } from "./blog";

type PublishedWhereAssertion = {
  publishedAt?: { lte?: unknown };
  slug?: unknown;
  status?: unknown;
};

type BlogQueryAssertion = {
  where?: PublishedWhereAssertion;
};

describe("blog public service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMocks.blogCategoryFindMany.mockResolvedValue([]);
    dbMocks.blogPostCount.mockResolvedValue(0);
    dbMocks.blogPostFindFirst.mockResolvedValue(null);
    dbMocks.blogPostFindMany.mockResolvedValue([]);
    dbMocks.blogTagFindMany.mockResolvedValue([]);
  });

  it("queries only currently published posts for public lists", async () => {
    await listPublishedBlogPosts();

    const query = getFirstMockArg(
      dbMocks.blogPostFindMany,
    ) as BlogQueryAssertion;

    expect(query.where?.status).toBe("PUBLISHED");
    expect(query.where?.publishedAt?.lte).toBeInstanceOf(Date);
  });

  it("queries only currently published posts for public detail pages", async () => {
    await getPublishedBlogPostBySlug("draft-post");

    const query = getFirstMockArg(
      dbMocks.blogPostFindFirst,
    ) as BlogQueryAssertion;

    expect(query.where?.slug).toBe("draft-post");
    expect(query.where?.status).toBe("PUBLISHED");
    expect(query.where?.publishedAt?.lte).toBeInstanceOf(Date);
  });

  it("falls back to fixtures when the database is unavailable", async () => {
    dbMocks.blogPostFindMany.mockRejectedValueOnce(
      new Error("DATABASE_URL is required before accessing Prisma."),
    );

    const result = await listPublishedBlogPosts();

    expect(result.posts.map((post) => post.slug)).toContain(
      "elysia-jewellery-care-guide",
    );
  });

  it("falls back to fixtures when build-time database credentials are rejected", async () => {
    dbMocks.blogPostFindMany.mockRejectedValueOnce(
      new Error(
        "Authentication failed against database server, the provided database credentials are not valid.",
      ),
    );

    const result = await listPublishedBlogPosts();

    expect(result.posts.map((post) => post.slug)).toContain(
      "elysia-jewellery-care-guide",
    );
  });
});

function getFirstMockArg(mock: ReturnType<typeof vi.fn>): unknown {
  return mock.mock.calls[0]?.[0];
}
