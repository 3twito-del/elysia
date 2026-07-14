import { describe, expect, it, vi } from "vitest";

const catalogMocks = {
  getCatalogCategories: vi.fn(),
  listCatalogProducts: vi.fn(),
};
const blogMocks = {
  listSitemapBlogPosts: vi.fn(),
};

vi.mock("~/server/services/catalog", () => catalogMocks);
vi.mock("~/server/services/blog", () => blogMocks);

describe("sitemap", () => {
  it("produces unique, absolute, siteUrl-rooted entries for every source", async () => {
    catalogMocks.getCatalogCategories.mockResolvedValue([
      { slug: "rings", name: "טבעות" },
      { slug: "earrings", name: "עגילים" },
    ]);
    catalogMocks.listCatalogProducts.mockResolvedValue([
      { slug: "venus-line-ring", createdAt: new Date("2026-01-01") },
      { slug: "hera-bracelet", createdAt: new Date("2026-02-01") },
    ]);
    blogMocks.listSitemapBlogPosts.mockResolvedValue([
      { slug: "care-guide", updatedAt: new Date("2026-03-01") },
    ]);

    const { default: sitemap } = await import("./sitemap");
    const entries = await sitemap();

    const urls = entries.map((entry) => entry.url);

    // Every entry is a fully-qualified https URL, and every one is unique --
    // duplicate sitemap URLs are exactly the kind of thing that silently
    // confuses crawlers and search-console coverage reports.
    for (const url of urls) {
      expect(url).toMatch(/^https:\/\//);
    }
    expect(new Set(urls).size).toBe(urls.length);

    expect(urls).toContain("https://elysia-jewellery.com/");
    expect(urls).toContain("https://elysia-jewellery.com/category/rings");
    expect(urls).toContain(
      "https://elysia-jewellery.com/product/venus-line-ring",
    );
    expect(urls).toContain("https://elysia-jewellery.com/blog/care-guide");

    // The homepage is the only priority-1 entry -- everything else is a
    // secondary page for crawl-priority purposes.
    const home = entries.find((entry) => entry.url.endsWith(".com/"));
    expect(home?.priority).toBe(1);
    expect(
      entries.filter((entry) => entry.priority === 1),
    ).toHaveLength(1);
  });

  it("includes every documented static route", async () => {
    catalogMocks.getCatalogCategories.mockResolvedValue([]);
    catalogMocks.listCatalogProducts.mockResolvedValue([]);
    blogMocks.listSitemapBlogPosts.mockResolvedValue([]);

    const { default: sitemap } = await import("./sitemap");
    const entries = await sitemap();
    const paths = entries.map((entry) => new URL(entry.url).pathname);

    for (const route of [
      "/",
      "/search",
      "/gifts",
      "/wishlist",
      "/service",
      "/blog",
      "/about",
      "/faq",
      "/terms",
      "/privacy",
      "/accessibility",
    ]) {
      expect(paths).toContain(route);
    }
  });
});
