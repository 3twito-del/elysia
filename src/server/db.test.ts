import { describe, expect, it } from "vitest";

import { addPrismaConnectionDefaults } from "./db";

describe("addPrismaConnectionDefaults", () => {
  it("adds fail-fast PostgreSQL defaults when they are missing", () => {
    const result = new URL(
      addPrismaConnectionDefaults(
        "postgresql://user:pass@example.com/app?sslmode=require",
      ),
    );

    expect(result.searchParams.get("sslmode")).toBe("require");
    expect(result.searchParams.get("connect_timeout")).toBe("5");
    expect(result.searchParams.get("connection_limit")).toBe("5");
    expect(result.searchParams.get("pool_timeout")).toBe("5");
    expect(result.searchParams.get("socket_timeout")).toBe("15");
  });

  it("keeps explicit PostgreSQL connection values", () => {
    const result = new URL(
      addPrismaConnectionDefaults(
        "postgres://user:pass@example.com/app?connect_timeout=2&pool_timeout=3&socket_timeout=4&connection_limit=7",
      ),
    );

    expect(result.searchParams.get("connect_timeout")).toBe("2");
    expect(result.searchParams.get("connection_limit")).toBe("7");
    expect(result.searchParams.get("pool_timeout")).toBe("3");
    expect(result.searchParams.get("socket_timeout")).toBe("4");
  });

  it("leaves non-PostgreSQL and invalid URLs unchanged", () => {
    expect(addPrismaConnectionDefaults("file:./dev.db")).toBe("file:./dev.db");
    expect(addPrismaConnectionDefaults("not a url")).toBe("not a url");
  });
});
