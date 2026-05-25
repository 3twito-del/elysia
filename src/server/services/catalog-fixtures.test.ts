import { afterEach, describe, expect, it } from "vitest";

import {
  shouldFallbackToCatalogFixturesOnDatabaseError,
  shouldUseCatalogFixtures,
} from "./catalog-fixtures";

const originalEnv = {
  CATALOG_DB_ERROR_FALLBACK: process.env.CATALOG_DB_ERROR_FALLBACK,
  CATALOG_FIXTURE_FALLBACK: process.env.CATALOG_FIXTURE_FALLBACK,
  E2E_CATALOG_FIXTURES: process.env.E2E_CATALOG_FIXTURES,
};

describe("catalog fixture flags", () => {
  afterEach(() => {
    restoreEnv("CATALOG_DB_ERROR_FALLBACK");
    restoreEnv("CATALOG_FIXTURE_FALLBACK");
    restoreEnv("E2E_CATALOG_FIXTURES");
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
});

function restoreEnv(key: keyof typeof originalEnv) {
  const value = originalEnv[key];

  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
}
