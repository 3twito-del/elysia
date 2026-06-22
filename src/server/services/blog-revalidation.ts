import { revalidateTag } from "next/cache";

import {
  BLOG_CACHE_TAGS,
  blogCategoryCacheTag,
  blogPostCacheTag,
  blogTagCacheTag,
} from "~/server/services/blog-cache";

export function revalidateBlogTags(tags: string[]) {
  for (const tag of new Set(tags)) {
    revalidateTag(tag, "max");
  }
}

export function getBlogMutationRevalidationTags(input: {
  postSlugs?: string[];
  categorySlugs?: string[];
  tagSlugs?: string[];
}) {
  return [
    BLOG_CACHE_TAGS.posts,
    BLOG_CACHE_TAGS.taxonomy,
    ...(input.postSlugs ?? []).map(blogPostCacheTag),
    ...(input.categorySlugs ?? []).map(blogCategoryCacheTag),
    ...(input.tagSlugs ?? []).map(blogTagCacheTag),
  ];
}

export function revalidateBlogMutation(input: {
  postSlugs?: string[];
  categorySlugs?: string[];
  tagSlugs?: string[];
}) {
  revalidateBlogTags(getBlogMutationRevalidationTags(input));
}
