import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { PrismaClient } from "@prisma/client";

const DEFAULT_API_VERSION = "2026-04";
const DEFAULT_FIRST = 10;
const STOREFRONT_TOKEN_OUTPUT = ".tmp/shopify-storefront-token.txt";

const adminRequiredScopes = ["read_products"];
const checkoutRequiredScopes = [
  "unauthenticated_read_product_listings",
  "unauthenticated_write_checkouts",
];
const orderWebhookRequiredScopes = ["read_orders"];

const storefrontTokenCreateMutation = `#graphql
  mutation DropshipStorefrontTokenCreate($input: StorefrontAccessTokenInput!) {
    storefrontAccessTokenCreate(input: $input) {
      storefrontAccessToken {
        accessToken
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const webhookSubscriptionsQuery = `#graphql
  query DropshipWebhookSubscriptions {
    webhookSubscriptions(first: 50, topics: [ORDERS_CREATE]) {
      edges {
        node {
          id
          topic
          uri
        }
      }
    }
  }
`;

const webhookSubscriptionCreateMutation = `#graphql
  mutation DropshipWebhookSubscriptionCreate(
    $topic: WebhookSubscriptionTopic!
    $webhookSubscription: WebhookSubscriptionInput!
  ) {
    webhookSubscriptionCreate(
      topic: $topic
      webhookSubscription: $webhookSubscription
    ) {
      webhookSubscription {
        id
        topic
        uri
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const productsQuery = `#graphql
  query DropshipSetupProducts($first: Int!) {
    products(first: $first) {
      edges {
        node {
          id
          title
          handle
          status
          productType
          vendor
          variants(first: 20) {
            edges {
              node {
                id
                sku
                title
                price
              }
            }
          }
        }
      }
      pageInfo {
        hasNextPage
      }
    }
  }
`;

const scopesQuery = `#graphql
  query DropshipSetupScopes {
    currentAppInstallation {
      accessScopes {
        handle
      }
    }
  }
`;

const argv = process.argv.slice(2);
const options = parseArgs(argv);
const env = loadEnv(options.envFiles);

for (const [key, value] of Object.entries(env)) {
  if (value !== undefined) process.env[key] = value;
}

const summary = {
  ok: true,
  checks: {},
  blocking: [],
  manual: [],
  readiness: {
    catalogReady: false,
    checkoutReady: false,
    localReady: false,
    rolloutReady: false,
    webhookReady: false,
  },
};

summary.checks.database = await checkDatabase();
summary.checks.shopify = await checkShopify();
summary.readiness.localReady =
  summary.checks.database.ok === true && summary.checks.shopify.ok === true;
summary.readiness.catalogReady =
  summary.checks.shopify.products?.items?.some(
    (product) =>
      product.status === "ACTIVE" && product.pricedVariantCount > 0,
  ) ?? false;
summary.readiness.checkoutReady = Boolean(
  summary.checks.shopify.missingCheckoutScopes?.length === 0 &&
    summary.checks.shopify.storefrontToken?.existing,
);
summary.readiness.webhookReady = Boolean(
  summary.checks.shopify.missingOrderScopes?.length === 0 &&
    summary.checks.shopify.webhook?.registered,
);
summary.readiness.rolloutReady =
  summary.readiness.localReady &&
  summary.readiness.catalogReady &&
  summary.readiness.checkoutReady &&
  summary.readiness.webhookReady;

summary.ok =
  summary.blocking.length === 0 &&
  summary.checks.database.ok !== false &&
  summary.checks.shopify.ok !== false;

console.log(JSON.stringify(summary, null, 2));
process.exitCode = summary.ok ? 0 : 1;

function parseArgs(args) {
  const parsed = {
    createStorefrontToken: false,
    envFiles: [".env", ".env.local", ".env.development.local"],
    first: DEFAULT_FIRST,
    registerOrdersWebhook: false,
    siteUrl: undefined,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const next = args[index + 1];

    if (arg === "--create-storefront-token") {
      parsed.createStorefrontToken = true;
    } else if (arg === "--register-orders-webhook") {
      parsed.registerOrdersWebhook = true;
    } else if (arg === "--first" && next) {
      parsed.first = Number(next);
      index += 1;
    } else if (arg === "--site-url" && next) {
      parsed.siteUrl = next;
      index += 1;
    } else if (arg === "--env-file" && next) {
      parsed.envFiles.push(next);
      index += 1;
    }
  }

  if (!Number.isInteger(parsed.first) || parsed.first < 1) {
    parsed.first = DEFAULT_FIRST;
  }

  parsed.first = Math.min(parsed.first, 50);

  return parsed;
}

function loadEnv(files) {
  const values = new Map();

  for (const filename of files) {
    if (!existsSync(filename)) continue;

    for (const line of readFileSync(filename, "utf8").split(/\r?\n/u)) {
      const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)?\s*$/u.exec(
        line,
      );

      if (!match?.[1]) continue;

      values.set(match[1], parseEnvValue(match[2] ?? ""));
    }
  }

  return Object.fromEntries(values);
}

function parseEnvValue(value) {
  const trimmed = value.trim();
  const quoted =
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"));

  return quoted ? trimmed.slice(1, -1) : trimmed;
}

async function checkDatabase() {
  if (!env.DATABASE_URL?.trim()) {
    summary.manual.push("Set DATABASE_URL before running catalog writes.");

    return {
      ok: false,
      status: "missing",
    };
  }

  const db = new PrismaClient({ log: [] });

  try {
    const migrations = await db.$queryRaw`
      SELECT migration_name, finished_at
      FROM "_prisma_migrations"
      ORDER BY migration_name
    `;
    const productColumns = await db.$queryRaw`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'Product'
        AND column_name IN (
          'source',
          'externalProvider',
          'externalProductId',
          'externalHandle',
          'supplierKey',
          'externalSyncedAt'
        )
      ORDER BY column_name
    `;
    const variantColumns = await db.$queryRaw`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'ProductVariant'
        AND column_name = 'externalVariantId'
    `;
    const mirrorTable = await db.$queryRaw`
      SELECT to_regclass('public."ShopifyOrderMirror"')::text AS table_name
    `;
    const productCounts = await db.$queryRaw`
      SELECT "source"::text AS source, COUNT(*)::int AS count
      FROM "Product"
      GROUP BY "source"
      ORDER BY "source"
    `;
    const expectedProductColumns = [
      "externalHandle",
      "externalProductId",
      "externalProvider",
      "externalSyncedAt",
      "source",
      "supplierKey",
    ];
    const foundProductColumns = productColumns.map((row) => row.column_name);
    const missingProductColumns = expectedProductColumns.filter(
      (name) => !foundProductColumns.includes(name),
    );
    const hasVariantMapping = variantColumns.some(
      (row) => row.column_name === "externalVariantId",
    );
    const hasMirrorTable = Boolean(mirrorTable[0]?.table_name);

    if (missingProductColumns.length > 0) {
      summary.blocking.push(
        `Run Prisma migrations; missing Product columns: ${missingProductColumns.join(", ")}.`,
      );
    }

    if (!hasVariantMapping) {
      summary.blocking.push(
        "Run Prisma migrations; ProductVariant.externalVariantId is missing.",
      );
    }

    if (!hasMirrorTable) {
      summary.blocking.push(
        "Run Prisma migrations; ShopifyOrderMirror table is missing.",
      );
    }

    return {
      ok:
        missingProductColumns.length === 0 &&
        hasVariantMapping &&
        hasMirrorTable,
      status: "connected",
      migrationCount: migrations.length,
      lastMigration: migrations.at(-1)?.migration_name ?? null,
      productCounts,
      shopifySchemaReady:
        missingProductColumns.length === 0 &&
        hasVariantMapping &&
        hasMirrorTable,
    };
  } catch (error) {
    summary.blocking.push(
      "Fix DATABASE_URL; Prisma cannot authenticate or query the database.",
    );

    return {
      ok: false,
      status: "failed",
      message: getErrorMessage(error),
    };
  } finally {
    await db.$disconnect();
  }
}

async function checkShopify() {
  const domain = normalizeShopifyDomain(env.SHOPIFY_STORE_DOMAIN);
  const apiVersion = env.SHOPIFY_API_VERSION?.trim() || DEFAULT_API_VERSION;

  if (!domain) {
    summary.blocking.push("Set SHOPIFY_STORE_DOMAIN.");

    return {
      ok: false,
      status: "missing-domain",
    };
  }

  try {
    const adminToken = await getAdminAccessToken(domain);
    const graphql = (query, variables = {}) =>
      adminGraphql({ apiVersion, domain, query, token: adminToken, variables });
    const scopesPayload = await graphql(scopesQuery);
    const scopes = getAccessScopes(scopesPayload);
    const missingAdminScopes = missingScopes(scopes, adminRequiredScopes);
    const missingCheckoutScopes = missingScopes(scopes, checkoutRequiredScopes);
    const missingOrderScopes = missingScopes(scopes, orderWebhookRequiredScopes);
    const productsPayload = await graphql(productsQuery, {
      first: options.first,
    });
    const products = getProducts(productsPayload);
    const activeProducts = products.items.filter(
      (product) => product.status === "ACTIVE",
    );
    const pricedProducts = products.items.filter(
      (product) => product.pricedVariantCount > 0,
    );
    const storefrontToken = await maybeCreateStorefrontToken(graphql);
    const webhook = await maybeRegisterOrdersWebhook({
      graphql,
      missingOrderScopes,
    });

    if (missingAdminScopes.length > 0) {
      summary.blocking.push(
        `Add Shopify Admin API scopes: ${missingAdminScopes.join(", ")}.`,
      );
    }

    if (!env.SHOPIFY_STOREFRONT_ACCESS_TOKEN?.trim()) {
      summary.manual.push(
        "Add Storefront API permissions and create SHOPIFY_STOREFRONT_ACCESS_TOKEN before enabling Shopify checkout.",
      );
    }

    if (missingCheckoutScopes.length > 0) {
      summary.manual.push(
        `Add Shopify Storefront unauthenticated scopes: ${missingCheckoutScopes.join(", ")}.`,
      );
    }

    if (products.items.length === 0) {
      summary.manual.push(
        "Create or import active Shopify supplier products with priced variants.",
      );
    } else if (activeProducts.length === 0 || pricedProducts.length === 0) {
      summary.manual.push(
        "Publish Shopify supplier products and ensure each imported product has at least one priced variant.",
      );
    }

    if (missingOrderScopes.length > 0) {
      summary.manual.push(
        `Add Shopify Admin API scopes before webhook registration: ${missingOrderScopes.join(", ")}.`,
      );
    }

    return {
      ok: missingAdminScopes.length === 0,
      status: "connected",
      domain,
      apiVersion,
      scopes,
      missingCheckoutScopes,
      missingOrderScopes,
      products,
      storefrontToken,
      webhook,
    };
  } catch (error) {
    summary.blocking.push(
      "Fix Shopify credentials; Admin API token or GraphQL request failed.",
    );

    return {
      ok: false,
      status: "failed",
      domain,
      apiVersion,
      message: getErrorMessage(error),
    };
  }
}

async function getAdminAccessToken(domain) {
  const configuredToken = env.SHOPIFY_ADMIN_ACCESS_TOKEN?.trim();

  if (configuredToken) return configuredToken;

  const clientId = env.SHOPIFY_CLIENT_ID?.trim();
  const clientSecret = env.SHOPIFY_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    throw new Error(
      "SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET are required.",
    );
  }

  const response = await fetch(`https://${domain}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  const payload = await response.json();

  if (!response.ok || typeof payload.access_token !== "string") {
    throw new Error(`Admin token request failed with ${response.status}.`);
  }

  return payload.access_token;
}

async function adminGraphql({ apiVersion, domain, query, token, variables }) {
  const response = await fetch(
    `https://${domain}/admin/api/${apiVersion}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token,
      },
      body: JSON.stringify({ query, variables }),
    },
  );
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(`Admin GraphQL failed with ${response.status}.`);
  }

  if (Array.isArray(payload.errors) && payload.errors.length > 0) {
    throw new Error(
      `Admin GraphQL returned errors: ${payload.errors
        .map((error) => error.message)
        .join("; ")}`,
    );
  }

  return payload;
}

function getAccessScopes(payload) {
  const scopes =
    payload.data?.currentAppInstallation?.accessScopes?.map(
      (scope) => scope.handle,
    ) ?? [];

  return scopes.filter((scope) => typeof scope === "string").sort();
}

function getProducts(payload) {
  const edges = payload.data?.products?.edges ?? [];
  const items = edges.map(({ node }) => {
    const variants = node.variants?.edges ?? [];

    return {
      handle: node.handle,
      pricedVariantCount: variants.filter(
        ({ node: variant }) => Number(variant.price) > 0,
      ).length,
      status: node.status,
      title: node.title,
      variantCount: variants.length,
    };
  });

  return {
    count: items.length,
    hasNextPage: Boolean(payload.data?.products?.pageInfo?.hasNextPage),
    handles: items.map((item) => item.handle),
    items,
  };
}

async function maybeCreateStorefrontToken(graphql) {
  const existing = Boolean(env.SHOPIFY_STOREFRONT_ACCESS_TOKEN?.trim());

  if (existing) {
    return {
      existing: true,
      created: false,
      outputFile: null,
    };
  }

  if (!options.createStorefrontToken) {
    return {
      existing: false,
      created: false,
      outputFile: null,
      skipped: "pass --create-storefront-token to create one after scopes exist",
    };
  }

  let payload;

  try {
    payload = await graphql(storefrontTokenCreateMutation, {
      input: { title: "Elysia Storefront API" },
    });
  } catch (error) {
    return {
      existing: false,
      created: false,
      error: getErrorMessage(error),
      outputFile: null,
    };
  }

  const userErrors =
    payload.data?.storefrontAccessTokenCreate?.userErrors ?? [];

  if (userErrors.length > 0) {
    return {
      existing: false,
      created: false,
      error: userErrors.map((error) => error.message).join("; "),
      outputFile: null,
    };
  }

  const token =
    payload.data?.storefrontAccessTokenCreate?.storefrontAccessToken
      ?.accessToken;

  if (typeof token !== "string" || token.length === 0) {
    return {
      existing: false,
      created: false,
      error: "Shopify did not return a storefront access token.",
      outputFile: null,
    };
  }

  const outputPath = resolve(STOREFRONT_TOKEN_OUTPUT);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, token, "utf8");

  return {
    existing: false,
    created: true,
    outputFile: STOREFRONT_TOKEN_OUTPUT,
  };
}

async function maybeRegisterOrdersWebhook({ graphql, missingOrderScopes }) {
  if (!options.registerOrdersWebhook) {
    return {
      registered: false,
      skipped: "pass --register-orders-webhook after SITE_URL and read_orders exist",
    };
  }

  const siteUrl = normalizeSiteUrl(options.siteUrl ?? env.SITE_URL);

  if (!siteUrl) {
    return {
      registered: false,
      error: "SITE_URL or --site-url is required.",
    };
  }

  if (missingOrderScopes.length > 0) {
    return {
      registered: false,
      error: `Missing scopes: ${missingOrderScopes.join(", ")}.`,
    };
  }

  const uri = `${siteUrl}/api/webhooks/shopify/orders`;
  let existingPayload;

  try {
    existingPayload = await graphql(webhookSubscriptionsQuery);
  } catch (error) {
    return {
      registered: false,
      error: getErrorMessage(error),
      uri,
    };
  }

  const existing =
    existingPayload.data?.webhookSubscriptions?.edges?.find(
      ({ node }) => node.topic === "ORDERS_CREATE" && node.uri === uri,
    )?.node ?? null;

  if (existing) {
    return {
      registered: true,
      existing: true,
      id: existing.id,
      uri,
    };
  }

  let payload;

  try {
    payload = await graphql(webhookSubscriptionCreateMutation, {
      topic: "ORDERS_CREATE",
      webhookSubscription: { uri },
    });
  } catch (error) {
    return {
      registered: false,
      error: getErrorMessage(error),
      uri,
    };
  }

  const userErrors = payload.data?.webhookSubscriptionCreate?.userErrors ?? [];

  if (userErrors.length > 0) {
    return {
      registered: false,
      error: userErrors.map((error) => error.message).join("; "),
      uri,
    };
  }

  const created = payload.data?.webhookSubscriptionCreate?.webhookSubscription;

  return {
    registered: Boolean(created?.id),
    existing: false,
    id: created?.id ?? null,
    uri,
  };
}

function normalizeShopifyDomain(value) {
  return (value ?? "")
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/.*$/u, "");
}

function normalizeSiteUrl(value) {
  const trimmed = (value ?? "").trim().replace(/\/+$/u, "");

  return /^https:\/\//iu.test(trimmed) ? trimmed : "";
}

function missingScopes(scopes, required) {
  return required.filter((scope) => !scopes.includes(scope));
}

function getErrorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}
