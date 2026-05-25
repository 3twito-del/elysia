import { afterEach, describe, expect, it } from "vitest";

import {
  shouldFallbackToCatalogFixturesOnDatabaseError,
  shouldUseCatalogFixtures,
} from "./catalog-fixtures";

const originalEnv = {
  CATALOG_DB_ERROR_FALLBACK: process.env.CATALOG_DB_ERROR_FALLBACK,
  CATALOG_FIXTURE_FALLBACK: process.env.CATALOG_FIXTURE_FALLBACK,
  DATABASE_URL: process.env.DATABASE_URL,
  E2E_CATALOG_FIXTURES: process.env.E2E_CATALOG_FIXTURES,
  VERCEL: process.env.VERCEL,
  VERCEL_ENV: process.env.VERCEL_ENV,
};

describe("catalog fixture flags", () => {
  afterEach(() => {
    restoreEnv("CATALOG_DB_ERROR_FALLBACK");
    restoreEnv("CATALOG_FIXTURE_FALLBACK");
    restoreEnv("DATABASE_URL");
    restoreEnv("E2E_CATALOG_FIXTURES");
    restoreEnv("VERCEL");
    restoreEnv("VERCEL_ENV");
  });

  it("keeps database-error fallback separate from forced fixtures", () => {
    process.env.CATALOG_DB_ERROR_FALLBACK = "1";
    delete process.env.CATALOG_FIXTURE_FALLBACK;
    delete process.env.E2E_CATALOG_FIXTURES;

    expect(shouldFallbackToCatalogFixturesOnDatabaseError()).toBe(true);
    expect(shouldUseCatalogFixtures()).toBe(false);
  });

  it("preserves existing forced fixture flags", () => {
    process.env.CATALOG_FIXTURE_FALLBACK = "1";
    delete process.env.CATALOG_DB_ERROR_FALLBACK;
    delete process.env.E2E_CATALOG_FIXTURES;

    expect(shouldFallbackToCatalogFixturesOnDatabaseError()).toBe(false);
    expect(shouldUseCatalogFixtures()).toBe(true);
  });

  it("uses fixtures for Vercel preview builds without database credentials", () => {
    process.env.VERCEL = "1";
    process.env.VERCEL_ENV = "preview";
    process.env.DATABASE_URL = "";
    delete process.env.CATALOG_DB_ERROR_FALLBACK;
    delete process.env.CATALOG_FIXTURE_FALLBACK;
    delete process.env.E2E_CATALOG_FIXTURES;

    expect(shouldUseCatalogFixtures()).toBe(true);
    expect(shouldFallbackToCatalogFixturesOnDatabaseError()).toBe(true);
  });

  it("keeps configured Vercel preview databases active while retaining fallback", () => {
    process.env.VERCEL = "1";
    process.env.VERCEL_ENV = "preview";
    process.env.DATABASE_URL =
      "postgresql://postgres:password@localhost:5432/elysia";
    delete process.env.CATALOG_DB_ERROR_FALLBACK;
    delete process.env.CATALOG_FIXTURE_FALLBACK;
    delete process.env.E2E_CATALOG_FIXTURES;

    expect(shouldUseCatalogFixtures()).toBe(false);
    expect(shouldFallbackToCatalogFixturesOnDatabaseError()).toBe(true);
  });
});

function restoreEnv(key: keyof typeof originalEnv) {
  const value = originalEnv[key];

  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
}
