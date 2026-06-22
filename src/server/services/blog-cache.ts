export const BLOG_CACHE_TAGS = {
  posts: "blog:posts",
  taxonomy: "blog:taxonomy",
} as const;

export function blogPostCacheTag(slug: string) {
  return `blog:post:${slug}`;
}

export function blogCategoryCacheTag(slug: string) {
  return `blog:category:${slug}`;
}

export function blogTagCacheTag(slug: string) {
  return `blog:tag:${slug}`;
}
