import { describe, expect, it } from "vitest";

import {
  CUSTOMER_AUTH_FIXTURE_DEFAULTS,
  parseCustomerAuthFixtureInput,
  shouldUseCustomerAuthFixtures,
} from "./customer-auth-fixtures";

describe("customer auth fixture controls", () => {
  it("requires an explicit e2e auth fixture flag", () => {
    expect(shouldUseCustomerAuthFixtures({})).toBe(false);
    expect(
      shouldUseCustomerAuthFixtures({
        E2E_AUTH_FIXTURES: "1",
        VERCEL: "0",
      }),
    ).toBe(true);
  });

  it("stays disabled for Vercel production even if the flag is present", () => {
    expect(
      shouldUseCustomerAuthFixtures({
        E2E_AUTH_FIXTURES: "1",
        VERCEL: "1",
        VERCEL_ENV: "production",
      }),
    ).toBe(false);
  });

  it("normalizes fixture input with stable defaults", () => {
    expect(parseCustomerAuthFixtureInput({})).toEqual({
      email: CUSTOMER_AUTH_FIXTURE_DEFAULTS.email,
      sessionKey: CUSTOMER_AUTH_FIXTURE_DEFAULTS.sessionKey,
    });
    expect(
      parseCustomerAuthFixtureInput({
        email: " E2E.Customer@Elysia.Local ",
        sessionKey: "custom_customer_fixture_session",
      }),
    ).toEqual({
      email: CUSTOMER_AUTH_FIXTURE_DEFAULTS.email,
      sessionKey: "custom_customer_fixture_session",
    });
  });
});
