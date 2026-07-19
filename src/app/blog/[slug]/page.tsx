import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BlogMarkdown } from "~/components/blog-markdown";
import { SiteHeader } from "~/components/site-header";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { env } from "~/env";
import { stringifyJsonLd } from "~/lib/json-ld";
import { getPublishedBlogPostBySlugCachedRequest } from "~/server/services/blog";

type BlogPostPageProps = {
  params: Promise<{ slug: string }>;
};

const siteUrl = env.SITE_URL ?? "https://elysia-jewellery.com";

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedBlogPostBySlugCachedRequest(slug);

  if (!post) {
    return {
      title: "מאמר לא נמצא",
      robots: { index: false, follow: false },
    };
  }

  const title = post.seoTitle ?? post.title;
  const description = post.seoDescription ?? post.excerpt;
  const canonical = `/blog/${post.slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "article",
      title,
      description,
      publishedTime: toIsoString(post.publishedAt),
      modifiedTime: toIsoString(post.updatedAt),
      url: createAbsoluteUrl(canonical),
      images: post.heroImageUrl
        ? [{ url: post.heroImageUrl, alt: post.heroImageAlt ?? post.title }]
        : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getPublishedBlogPostBySlugCachedRequest(slug);

  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.seoDescription ?? post.excerpt,
    datePublished: toIsoString(post.publishedAt),
    dateModified: toIsoString(post.updatedAt),
    mainEntityOfPage: createAbsoluteUrl(`/blog/${post.slug}`),
    author: post.author
      ? {
          "@type": "Person",
          name: post.author.name,
        }
      : {
          "@type": "Organization",
          name: "Elysia",
        },
    image: post.heroImageUrl ? [post.heroImageUrl] : undefined,
  };

  return (
    <>
      <SiteHeader />
      <main className="elysia-page bg-background text-foreground" dir="rtl">
        <article
          className="mx-auto grid max-w-[74rem] gap-8 px-[var(--ui-page-x)] py-10 sm:px-[var(--ui-page-x-wide)] lg:py-16"
          data-testid="blog-post"
        >
          <script
            dangerouslySetInnerHTML={{ __html: stringifyJsonLd(jsonLd) }}
            type="application/ld+json"
          />
          <header className="grid gap-5 border-b border-[var(--glass-border)] pb-8">
            <Button asChild className="justify-self-start" variant="outline">
              <Link href="/blog">חזרה למגזין</Link>
            </Button>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {post.category ? (
                <Link href={`/blog?category=${post.category.slug}`}>
                  <Badge variant="secondary">{post.category.name}</Badge>
                </Link>
              ) : null}
              <span className="text-muted-foreground">
                {formatDate(post.publishedAt)} · {post.readingMinutes} דק׳
              </span>
            </div>
            <div className="grid gap-4">
              <h1 className="max-w-4xl text-4xl leading-tight font-semibold tracking-normal sm:text-5xl">
                {post.title}
              </h1>
              <p className="text-muted-foreground max-w-3xl text-lg leading-8">
                {post.excerpt}
              </p>
              {post.author ? (
                <p className="text-muted-foreground text-sm">
                  מאת {post.author.name}
                  {post.author.title ? ` · ${post.author.title}` : ""}
                </p>
              ) : null}
            </div>
          </header>

          {post.heroImageUrl ? (
            <div className="bg-muted relative aspect-[16/9] overflow-hidden rounded-md">
              <Image
                alt={post.heroImageAlt ?? ""}
                className="object-cover"
                fill
                priority
                sizes="(min-width: 1184px) 74rem, 100vw"
                src={post.heroImageUrl}
              />
            </div>
          ) : null}

          <BlogMarkdown markdown={post.bodyMarkdown} />

          {post.tags.length > 0 ? (
            <footer className="flex flex-wrap gap-2 border-t border-[var(--glass-border)] pt-6">
              {post.tags.map((tag) => (
                <Link href={`/blog?tag=${tag.slug}`} key={tag.slug}>
                  <Badge variant="outline">{tag.name}</Badge>
                </Link>
              ))}
            </footer>
          ) : null}
        </article>

        {post.relatedProducts.length > 0 ? (
          <section className="mx-auto grid max-w-[74rem] gap-5 px-[var(--ui-page-x)] pb-16 sm:px-[var(--ui-page-x-wide)] lg:pb-24">
            <h2 className="text-2xl font-semibold">תכשיטים קשורים</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {post.relatedProducts.map((product) => (
                <Link
                  className="bg-card grid gap-3 rounded-md border p-3 transition duration-[var(--motion-fast)] ease-[var(--ease-standard)] hover:border-[var(--glass-border-hover)]"
                  href={`/product/${product.slug}`}
                  key={product.slug}
                >
                  {product.image ? (
                    <span className="bg-muted relative block aspect-square overflow-hidden rounded-md">
                      <Image
                        alt=""
                        className="object-cover"
                        fill
                        sizes="(min-width: 1024px) 16rem, 50vw"
                        src={product.image}
                      />
                    </span>
                  ) : null}
                  <span className="font-medium">{product.name}</span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </>
  );
}

function createAbsoluteUrl(path: string) {
  return new URL(path, siteUrl).toString();
}

function formatDate(value: Date | string) {
  const date = parseDate(value);

  if (!date) return "";

  return new Intl.DateTimeFormat("he-IL", { dateStyle: "long" }).format(date);
}

function toIsoString(value: Date | string) {
  return parseDate(value)?.toISOString();
}

function parseDate(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}
