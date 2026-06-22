import type { BlogPostStatus, Prisma } from "@prisma/client";
import type { z } from "zod";

import {
  adminBlogPostListInputSchema,
  createAdminBlogAuthorInputSchema,
  createAdminBlogCategoryInputSchema,
  createAdminBlogPostInputSchema,
  createAdminBlogTagInputSchema,
  updateAdminBlogPostInputSchema,
} from "~/lib/blog-validation";
import { db } from "~/server/db";
import { revalidateBlogMutation } from "~/server/services/blog-revalidation";
import { DEFAULT_CATALOG_IMAGE } from "~/server/services/catalog-assets";
import {
  createAdminPageInfo,
  getAdminSkip,
} from "~/server/services/admin-operations-inputs";
import { writeAdminAudit } from "~/server/services/admin-commerce-workflow";

export {
  adminBlogPostListInputSchema,
  createAdminBlogAuthorInputSchema,
  createAdminBlogCategoryInputSchema,
  createAdminBlogPostInputSchema,
  createAdminBlogTagInputSchema,
  updateAdminBlogPostInputSchema,
} from "~/lib/blog-validation";

export async function listAdminBlogPosts(
  input: z.infer<typeof adminBlogPostListInputSchema>,
) {
  const parsed = adminBlogPostListInputSchema.parse(input);
  const where: Prisma.BlogPostWhereInput = {
    ...(parsed.status ? { status: parsed.status } : {}),
    ...(parsed.query
      ? {
          OR: [
            { title: { contains: parsed.query, mode: "insensitive" } },
            { slug: { contains: parsed.query, mode: "insensitive" } },
            { excerpt: { contains: parsed.query, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const [posts, totalItems, options] = await Promise.all([
    db.blogPost.findMany({
      where,
      orderBy: getAdminBlogPostSort(parsed.sort),
      skip: getAdminSkip(parsed),
      take: parsed.pageSize,
      include: {
        author: true,
        category: true,
        tags: { orderBy: { name: "asc" } },
      },
    }),
    db.blogPost.count({ where }),
    listAdminBlogEditorOptions(),
  ]);

  return {
    ...options,
    pageInfo: createAdminPageInfo({
      page: parsed.page,
      pageSize: parsed.pageSize,
      totalItems,
    }),
    posts: posts.map((post) => ({
      id: post.id,
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      status: post.status,
      featured: post.featured,
      publishedAt: post.publishedAt,
      updatedAt: post.updatedAt,
      authorName: post.author?.name ?? null,
      categoryName: post.category?.name ?? null,
      tagNames: post.tags.map((tag) => tag.name),
    })),
  };
}

export async function getAdminBlogPostEditor(postId: string) {
  const [post, options] = await Promise.all([
    db.blogPost.findUnique({
      where: { id: postId },
      include: {
        author: true,
        category: true,
        tags: { orderBy: { name: "asc" } },
        relatedProducts: {
          orderBy: { name: "asc" },
          include: {
            media: {
              where: { kind: "IMAGE" },
              orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
              take: 1,
            },
          },
        },
      },
    }),
    listAdminBlogEditorOptions(),
  ]);

  if (!post) return null;

  return {
    ...options,
    post: {
      id: post.id,
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      bodyMarkdown: post.bodyMarkdown,
      status: post.status,
      publishedAt: post.publishedAt,
      heroImageUrl: post.heroImageUrl,
      heroImageAlt: post.heroImageAlt,
      seoTitle: post.seoTitle,
      seoDescription: post.seoDescription,
      featured: post.featured,
      authorId: post.authorId,
      categoryId: post.categoryId,
      tagIds: post.tags.map((tag) => tag.id),
      relatedProductIds: post.relatedProducts.map((product) => product.id),
      relatedProducts: post.relatedProducts.map((product) => ({
        id: product.id,
        slug: product.slug,
        name: product.name,
        image: product.media[0]?.url ?? DEFAULT_CATALOG_IMAGE,
      })),
    },
  };
}

export async function listAdminBlogEditorOptions() {
  const [authors, categories, tags, products] = await Promise.all([
    db.blogAuthor.findMany({ orderBy: { name: "asc" } }),
    db.blogCategory.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    db.blogTag.findMany({ orderBy: { name: "asc" } }),
    db.product.findMany({
      orderBy: { name: "asc" },
      take: 80,
      include: {
        media: {
          where: { kind: "IMAGE" },
          orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
          take: 1,
        },
      },
    }),
  ]);

  return {
    authors: authors.map((author) => ({
      id: author.id,
      slug: author.slug,
      name: author.name,
      title: author.title,
    })),
    categories: categories.map((category) => ({
      id: category.id,
      slug: category.slug,
      name: category.name,
      description: category.description,
    })),
    tags: tags.map((tag) => ({
      id: tag.id,
      slug: tag.slug,
      name: tag.name,
    })),
    products: products.map((product) => ({
      id: product.id,
      slug: product.slug,
      name: product.name,
      image: product.media[0]?.url ?? DEFAULT_CATALOG_IMAGE,
    })),
  };
}

export async function createAdminBlogPost(input: {
  data: z.infer<typeof createAdminBlogPostInputSchema>;
  adminUserId: string;
}) {
  const parsed = createAdminBlogPostInputSchema.parse(input.data);
  const created = await db.$transaction(async (tx) => {
    const post = await tx.blogPost.create({
      data: {
        ...toBlogPostWriteData(parsed),
        createdByAdminUserId: input.adminUserId,
        updatedByAdminUserId: input.adminUserId,
        tags: { connect: parsed.tagIds.map((id) => ({ id })) },
        relatedProducts: {
          connect: parsed.relatedProductIds.map((id) => ({ id })),
        },
      },
      include: { category: true, tags: true },
    });

    await writeAdminAudit(tx, {
      adminUserId: input.adminUserId,
      action: "blog_post_created",
      entity: "BlogPost",
      entityId: post.id,
      metadata: {
        slug: post.slug,
        status: post.status,
      },
    });

    return post;
  });

  revalidateBlogMutation({
    postSlugs: [created.slug],
    categorySlugs: created.category ? [created.category.slug] : [],
    tagSlugs: created.tags.map((tag) => tag.slug),
  });

  return { id: created.id, slug: created.slug };
}

export async function updateAdminBlogPost(input: {
  data: z.infer<typeof updateAdminBlogPostInputSchema>;
  adminUserId: string;
}) {
  const parsed = updateAdminBlogPostInputSchema.parse(input.data);
  const updated = await db.$transaction(async (tx) => {
    const current = await tx.blogPost.findUniqueOrThrow({
      where: { id: parsed.id },
      include: { category: true, tags: true },
    });
    const post = await tx.blogPost.update({
      where: { id: parsed.id },
      data: {
        ...toBlogPostWriteData(parsed, current),
        updatedByAdminUserId: input.adminUserId,
        tags: { set: parsed.tagIds.map((id) => ({ id })) },
        relatedProducts: {
          set: parsed.relatedProductIds.map((id) => ({ id })),
        },
      },
      include: { category: true, tags: true },
    });

    await writeAdminAudit(tx, {
      adminUserId: input.adminUserId,
      action: "blog_post_updated",
      entity: "BlogPost",
      entityId: post.id,
      metadata: {
        previousSlug: current.slug,
        slug: post.slug,
        status: post.status,
      },
    });

    return {
      current,
      post,
    };
  });

  revalidateBlogMutation({
    postSlugs: [updated.current.slug, updated.post.slug],
    categorySlugs: [
      updated.current.category?.slug,
      updated.post.category?.slug,
    ].filter((slug): slug is string => Boolean(slug)),
    tagSlugs: [
      ...updated.current.tags.map((tag) => tag.slug),
      ...updated.post.tags.map((tag) => tag.slug),
    ],
  });

  return { id: updated.post.id, slug: updated.post.slug };
}

export async function createAdminBlogAuthor(input: {
  data: z.infer<typeof createAdminBlogAuthorInputSchema>;
  adminUserId: string;
}) {
  const parsed = createAdminBlogAuthorInputSchema.parse(input.data);
  const author = await db.blogAuthor.create({ data: parsed });

  await db.auditLog.create({
    data: {
      adminUserId: input.adminUserId,
      action: "blog_author_created",
      entity: "BlogAuthor",
      entityId: author.id,
      metadata: { slug: author.slug },
    },
  });

  revalidateBlogMutation({});

  return { id: author.id, slug: author.slug };
}

export async function createAdminBlogCategory(input: {
  data: z.infer<typeof createAdminBlogCategoryInputSchema>;
  adminUserId: string;
}) {
  const parsed = createAdminBlogCategoryInputSchema.parse(input.data);
  const category = await db.blogCategory.create({ data: parsed });

  await db.auditLog.create({
    data: {
      adminUserId: input.adminUserId,
      action: "blog_category_created",
      entity: "BlogCategory",
      entityId: category.id,
      metadata: { slug: category.slug },
    },
  });

  revalidateBlogMutation({ categorySlugs: [category.slug] });

  return { id: category.id, slug: category.slug };
}

export async function createAdminBlogTag(input: {
  data: z.infer<typeof createAdminBlogTagInputSchema>;
  adminUserId: string;
}) {
  const parsed = createAdminBlogTagInputSchema.parse(input.data);
  const tag = await db.blogTag.create({ data: parsed });

  await db.auditLog.create({
    data: {
      adminUserId: input.adminUserId,
      action: "blog_tag_created",
      entity: "BlogTag",
      entityId: tag.id,
      metadata: { slug: tag.slug },
    },
  });

  revalidateBlogMutation({ tagSlugs: [tag.slug] });

  return { id: tag.id, slug: tag.slug };
}

function toBlogPostWriteData(
  input: z.infer<typeof createAdminBlogPostInputSchema>,
  current?: { publishedAt: Date | null; status: BlogPostStatus },
) {
  const publishedAt =
    input.status === "PUBLISHED"
      ? (input.publishedAt ?? current?.publishedAt ?? new Date())
      : (input.publishedAt ?? null);

  return {
    slug: input.slug,
    title: input.title,
    excerpt: input.excerpt,
    bodyMarkdown: input.bodyMarkdown,
    status: input.status,
    publishedAt,
    heroImageUrl: input.heroImageUrl ?? null,
    heroImageAlt: input.heroImageAlt ?? null,
    seoTitle: input.seoTitle ?? null,
    seoDescription: input.seoDescription ?? null,
    featured: input.featured,
    authorId: input.authorId ?? null,
    categoryId: input.categoryId ?? null,
  };
}

function getAdminBlogPostSort(
  sort: z.infer<typeof adminBlogPostListInputSchema>["sort"],
): Prisma.BlogPostOrderByWithRelationInput {
  if (sort === "published-desc") return { publishedAt: "desc" };
  if (sort === "title-asc") return { title: "asc" };

  return { updatedAt: "desc" };
}
