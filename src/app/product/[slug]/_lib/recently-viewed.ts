/**
 * Resolve the ordered list of recently-viewed slugs to render.
 *
 * localStorage is untrusted input, so this defensively de-duplicates (two cards
 * with the same slug would collide on their React `key`) and drops any slug the
 * caller already shows elsewhere on the page — the current product and any slug
 * already present in the recommendation rails — so the same piece never appears
 * twice on one route (F-09). Insertion order is preserved and the result is
 * capped to `limit`.
 */
export function selectRecentlyViewedSlugs({
  excludeSlugs = [],
  limit,
  slugs,
}: {
  excludeSlugs?: readonly string[];
  limit: number;
  slugs: readonly string[];
}): string[] {
  const excluded = new Set(excludeSlugs);
  const seen = new Set<string>();
  const result: string[] = [];

  for (const slug of slugs) {
    if (!slug || excluded.has(slug) || seen.has(slug)) continue;

    seen.add(slug);
    result.push(slug);

    if (result.length >= limit) break;
  }

  return result;
}
