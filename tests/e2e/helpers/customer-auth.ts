import { expect, type Page } from "@playwright/test";

export type CustomerAuthFixture = {
  code: string;
  customerId: string;
  email: string;
  localOrderId: string;
  localOrderNumber: string;
  sessionKey: string;
  shopifyOrderName: string;
  userId: string;
};

type CustomerAuthFixtureResponse = {
  fixture: CustomerAuthFixture;
  ok: true;
};

export async function signInCustomerWithFixture(
  page: Page,
  fixtureNamespace = "default",
) {
  const namespace = fixtureNamespace
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  const setupResponse = await page.request.post("/api/e2e/customer-auth", {
    data:
      namespace === "default"
        ? {}
        : {
            email: `e2e.customer+${namespace}@elysia.local`,
            sessionKey: `e2e_customer_auth_fixture_${namespace}`,
          },
  });

  expect(
    setupResponse.status(),
    "E2E_AUTH_FIXTURES=1 must be enabled for customer auth fixture setup.",
  ).toBe(200);

  const setup = (await setupResponse.json()) as CustomerAuthFixtureResponse;
  const csrfResponse = await page.request.get("/api/auth/csrf");

  expect(csrfResponse.status()).toBe(200);

  const csrf = (await csrfResponse.json()) as { csrfToken?: string };

  expect(csrf.csrfToken).toBeTruthy();

  const signInResponse = await page.request.post(
    "/api/auth/callback/otp?json=true",
    {
      form: {
        callbackUrl: "/account",
        code: setup.fixture.code,
        csrfToken: csrf.csrfToken ?? "",
        identifier: setup.fixture.email,
        redirect: "false",
        sessionKey: setup.fixture.sessionKey,
      },
    },
  );

  expect(signInResponse.status()).toBeLessThan(400);

  await page.goto("/account", { waitUntil: "domcontentloaded" });
  const visibleAccountSummary = page.locator(
    '[data-testid="account-summary-panel"]:visible',
  );

  await expect(visibleAccountSummary).toHaveCount(1);
  await expect(visibleAccountSummary).toBeVisible();

  return setup.fixture;
}
