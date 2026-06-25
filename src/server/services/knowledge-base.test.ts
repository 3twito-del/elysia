import { describe, expect, it } from "vitest";

import { searchArticles, slugify } from "./knowledge-base";

describe("slugify", () => {
  it("produces a url-safe slug from a Latin title", () => {
    expect(slugify("  Getting Started Guide ")).toBe("getting-started-guide");
  });

  it("keeps Hebrew letters", () => {
    expect(slugify("מדריך התחלה")).toBe("מדריך-התחלה");
  });

  it("falls back to 'article' for symbol-only titles", () => {
    expect(slugify("!!!")).toBe("article");
  });
});

describe("searchArticles", () => {
  const articles = [
    { title: "Refund policy", body: "How to refund", category: "ops" },
    { title: "Shipping", body: "Carriers and SLA", category: "logistics" },
  ];

  it("matches across title, body and category, case-insensitively", () => {
    expect(searchArticles(articles, "REFUND")).toHaveLength(1);
    expect(searchArticles(articles, "logistics")).toHaveLength(1);
  });

  it("returns all articles for an empty query", () => {
    expect(searchArticles(articles, "  ")).toHaveLength(2);
  });
});
