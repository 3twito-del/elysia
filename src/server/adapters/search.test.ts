import { describe, expect, it } from "vitest";

import { assertLocalSearchAllowed } from "./search";

describe("search adapter config", () => {
  it("allows the local catalog fallback outside production", () => {
    expect(() =>
      assertLocalSearchAllowed({
        NODE_ENV: "development",
        TYPESENSE_API_KEY: undefined,
        TYPESENSE_HOST: undefined,
      }),
    ).not.toThrow();

    expect(() =>
      assertLocalSearchAllowed({
        NODE_ENV: "test",
        TYPESENSE_API_KEY: undefined,
        TYPESENSE_HOST: undefined,
      }),
    ).not.toThrow();
  });

  it("blocks production search without Typesense credentials", () => {
    expect(() =>
      assertLocalSearchAllowed({
        NODE_ENV: "production",
        TYPESENSE_API_KEY: undefined,
        TYPESENSE_HOST: undefined,
      }),
    ).toThrow(/Typesense production search requires/);

    expect(() =>
      assertLocalSearchAllowed({
        NODE_ENV: "production",
        TYPESENSE_API_KEY: "typesense-key",
        TYPESENSE_HOST: "search.example.com",
      }),
    ).not.toThrow();
  });
});
