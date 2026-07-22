import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";

import { CompactPageIntro } from "~/components/compact-page-intro";
import { SiteHeader } from "~/components/site-header";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { listPublishedBlogPosts } from "~/server/services/blog";

export const metadata: Metadata = {
  title: "מגזין Elysia",
  description: "מדריכים קצרים על תכשיטים, התאמה, חומרים וטיפול יומיומי.",
  alternates: { canonical: "/blog" },
};

type BlogPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function optionalParam(value: string | string[] | undefined) {
  const param = firstParam(value);

  return param && param.length > 0 ? param : undefined;
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const query = await searchParams;
  const params = {
    category: optionalParam(query.category),
    page: Number(firstParam(query.page) ?? 1),
    q: optionalParam(query.q),
    tag: optionalParam(query.tag),
  };
  const blog = await listPublishedBlogPosts(params);
  const hasActiveFilters = [
    Boolean(params.category),
    Boolean(params.q),
    Boolean(params.tag),
    params.page > 1,
  ].some(Boolean);

  return (
    <>
      <SiteHeader />
      <main className="elysia-page bg-background text-foreground" dir="rtl">
        <CompactPageIntro
          description="מדריכים קצרים לבחירת תכשיט, טיפול נכון ושילובים ליום-יום."
          eyebrow="המגזין של Elysia"
          title="מגזין"
          variant="content"
        />

        <section className="mx-auto grid max-w-[92rem] gap-8 px-[var(--ui-page-x)] pb-16 sm:px-[var(--ui-page-x-wide)] lg:pb-24">
          <form
            action="/blog"
            className="grid gap-3 border-y border-[var(--glass-border)] py-5 md:grid-cols-[minmax(0,1fr)_auto_auto]"
            data-testid="blog-filters"
          >
            <label className="relative block">
              <Search
                aria-hidden="true"
                className="text-muted-foreground absolute top-1/2 right-3 size-4 -translate-y-1/2"
              />
              <Input
                aria-label="חיפוש במגזין"
                className="ps-10"
                defaultValue={params.q}
                name="q"
                placeholder="חיפוש מאמרים"
              />
            </label>
            {params.category ? (
              <input name="category" type="hidden" value={params.category} />
            ) : null}
            {params.tag ? (
              <input name="tag" type="hidden" value={params.tag} />
            ) : null}
            <Button type="submit">חיפוש</Button>
            {hasActiveFilters ? (
              <Button asChild variant="outline">
                <Link href="/blog">ניקוי</Link>
              </Button>
            ) : null}
          </form>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
            <section className="grid gap-5" data-testid="blog-results">
              <p
                className="text-muted-foreground text-sm"
                data-testid="blog-results-summary"
              >
                {blog.pageInfo.totalItems} מאמרים
              </p>
              {blog.posts.length === 0 ? (
                <div className="grid gap-3 border-y border-[var(--glass-border)] py-10">
                  <h2 className="text-xl font-semibold">אין מאמרים מתאימים</h2>
                  <p className="text-muted-foreground">
                    נסי חיפוש אחר או נקי את הסינון.
                  </p>
                </div>
              ) : (
                <div
                  className="grid gap-5 md:grid-cols-2"
                  data-testid="blog-grid"
                >
                  {blog.posts.map((post) => (
                    <article
                      className="bg-card grid overflow-hidden rounded-md border"
                      key={post.slug}
                    >
                      {post.heroImageUrl ? (
                        <Link
                          aria-label={post.title}
                          className="bg-muted relative block aspect-[16/9] overflow-hidden"
                          href={`/blog/${post.slug}`}
                        >
                          <Image
                            alt={post.heroImageAlt ?? ""}
                            className="object-cover"
                            fill
                            sizes="(min-width: 1024px) 36rem, (min-width: 768px) 50vw, 100vw"
                            src={post.heroImageUrl}
                          />
                        </Link>
                      ) : null}
                      <div className="grid gap-4 p-5">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          {post.category ? (
                            <Link
                              href={createBlogHref({
                                category: post.category.slug,
                              })}
                            >
                              <Badge variant="secondary">
                                {post.category.name}
                              </Badge>
                            </Link>
                          ) : null}
                          <span className="text-muted-foreground">
                            {formatDate(post.publishedAt)} ·{" "}
                            {post.readingMinutes} דק׳
                          </span>
                        </div>
                        <div className="grid gap-2">
                          <h2 className="text-xl leading-8 font-semibold">
                            <Link
                              className="underline-offset-4 hover:underline"
                              href={`/blog/${post.slug}`}
                            >
                              {post.title}
                            </Link>
                          </h2>
                          <p className="text-muted-foreground leading-7">
                            {post.excerpt}
                          </p>
                        </div>
                        <Link
                          className="text-sm font-medium underline-offset-4 hover:underline"
                          href={`/blog/${post.slug}`}
                        >
                          קריאה
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              )}
              <BlogPagination pageInfo={blog.pageInfo} params={params} />
            </section>

            <aside className="grid gap-6 lg:sticky lg:top-28">
              <FilterGroup
                activeSlug={params.category}
                items={blog.categories}
                param="category"
                title="קטגוריות"
              />
              <FilterGroup
                activeSlug={params.tag}
                items={blog.tags}
                param="tag"
                title="תגיות"
              />
            </aside>
          </div>
        </section>
      </main>
    </>
  );
}

function FilterGroup({
  activeSlug,
  items,
  param,
  title,
}: {
  activeSlug?: string;
  items: Array<{ count: number; name: string; slug: string }>;
  param: "category" | "tag";
  title: string;
}) {
  if (items.length === 0) return null;

  return (
    <section className="grid gap-3 border-t border-[var(--glass-border)] pt-5">
      <h2 className="text-sm font-semibold">{title}</h2>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <Button
            asChild
            key={item.slug}
            size="sm"
            variant={activeSlug === item.slug ? "secondary" : "outline"}
          >
            <Link href={createBlogHref({ [param]: item.slug })}>
              {item.name} · {item.count}
            </Link>
          </Button>
        ))}
      </div>
    </section>
  );
}

function BlogPagination({
  pageInfo,
  params,
}: {
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    page: number;
  };
  params: {
    category?: string;
    q?: string;
    tag?: string;
  };
}) {
  if (!pageInfo.hasNextPage && !pageInfo.hasPreviousPage) return null;

  return (
    <nav className="flex items-center justify-between gap-3 pt-4">
      <Button asChild disabled={!pageInfo.hasPreviousPage} variant="outline">
        <Link
          aria-disabled={!pageInfo.hasPreviousPage}
          href={createBlogHref({ ...params, page: pageInfo.page - 1 })}
        >
          הקודם
        </Link>
      </Button>
      <Button asChild disabled={!pageInfo.hasNextPage} variant="outline">
        <Link
          aria-disabled={!pageInfo.hasNextPage}
          href={createBlogHref({ ...params, page: pageInfo.page + 1 })}
        >
          הבא
        </Link>
      </Button>
    </nav>
  );
}

function createBlogHref(input: {
  category?: string;
  page?: number;
  q?: string;
  tag?: string;
}) {
  const params = new URLSearchParams();

  if (input.q) params.set("q", input.q);
  if (input.category) params.set("category", input.category);
  if (input.tag) params.set("tag", input.tag);
  if (input.page && input.page > 1) params.set("page", String(input.page));

  const query = params.toString();

  return query ? `/blog?${query}` : "/blog";
}

function formatDate(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("he-IL", { dateStyle: "medium" }).format(date);
}
