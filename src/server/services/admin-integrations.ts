export type AdminIntegrationStatus =
  | "configured"
  | "degraded"
  | "local-fallback"
  | "missing-secret"
  | "rollout-required";

export type AdminIntegrationSummary = {
  capabilities: string[];
  detail: string;
  name: string;
  status: AdminIntegrationStatus;
};

export type ProductionIntegrationConfig = {
  aiGatewayApiKey?: string;
  cardComApiName?: string;
  cardComApiPassword?: string;
  cardComTerminal?: string;
  cardComWebhookSecret?: string;
  cronSecret?: string;
  googleGenerativeAiApiKey?: string;
  jobRunnerSecret?: string;
  nodeEnv: string;
  notificationOperational: boolean;
  notificationProviderName: string;
  operationsEmail?: string;
  resendApiKey?: string;
  shopifyClientId?: string;
  shopifyClientSecret?: string;
  shopifyDropshipEnabled?: string;
  shopifyAdminAccessToken?: string;
  shopifyStoreDomain?: string;
  shopifyStorefrontAccessToken?: string;
  shopifyWebhookSecret?: string;
  smsProviderApiKey?: string;
  storeFromEmail?: string;
  typesenseApiKey?: string;
  typesenseHost?: string;
  vercelOidcToken?: string;
};

export function createProductionIntegrationSummaries(
  config: ProductionIntegrationConfig,
): AdminIntegrationSummary[] {
  const localFallback = config.nodeEnv !== "production";

  return [
    createIntegrationSummary({
      configured: Boolean(
        hasConfigValue(config.cardComTerminal) &&
        hasConfigValue(config.cardComApiName) &&
        hasConfigValue(config.cardComApiPassword) &&
        hasConfigValue(config.cardComWebhookSecret),
      ),
      fallback: localFallback,
      capabilities: [
        "checkout",
        "capture",
        "refund",
        "signed-webhook",
        "reconciliation",
      ],
      configuredDetail:
        "CardCom live checkout credentials and webhook signing secret are present.",
      fallbackDetail: "Manual payment workflow is active for local operations.",
      missingDetail:
        "CardCom terminal, API name, API password, and webhook secret are required for production payment readiness.",
      name: "CardCom payments",
    }),
    createIntegrationSummary({
      configured: Boolean(
        config.notificationOperational &&
        hasConfigValue(config.storeFromEmail) &&
        hasConfigValue(config.operationsEmail),
      ),
      fallback: localFallback,
      capabilities: [
        "transactional-email",
        "sender-domain",
        "operations-alerts",
        "retry-safe-outbox",
      ],
      configuredDetail: `${config.notificationProviderName} email is configured with sender and operations recipients.`,
      fallbackDetail: "Email delivery is using local/mock fallback behavior.",
      missingDetail:
        "Configure Resend or Brevo plus STORE_FROM_EMAIL and OPERATIONS_EMAIL.",
      name: "Transactional email",
    }),
    createIntegrationSummary({
      configured: hasConfigValue(config.smsProviderApiKey),
      fallback: localFallback,
      capabilities: ["otp-sms", "order-status-sms", "delivery-alerts"],
      configuredDetail: "SMS provider credentials are present.",
      fallbackDetail: "SMS sends use local/mock behavior outside production.",
      missingDetail:
        "SMS_PROVIDER_API_KEY is required for production customer notification readiness.",
      name: "SMS notifications",
    }),
    createIntegrationSummary({
      configured: Boolean(
        hasConfigValue(config.typesenseHost) &&
        hasConfigValue(config.typesenseApiKey),
      ),
      fallback: localFallback,
      capabilities: ["search", "facets", "reindex"],
      configuredDetail: "Typesense host and API key are configured.",
      fallbackDetail: "Local catalog search fallback is active.",
      missingDetail: "Typesense host and API key are required in production.",
      name: "Typesense search",
    }),
    createIntegrationSummary({
      configured: Boolean(
        isEnabled(config.shopifyDropshipEnabled) &&
        hasConfigValue(config.shopifyStoreDomain) &&
        (hasConfigValue(config.shopifyStorefrontAccessToken) ||
          hasConfigValue(config.shopifyAdminAccessToken) ||
          (hasConfigValue(config.shopifyClientId) &&
            hasConfigValue(config.shopifyClientSecret))) &&
        hasConfigValue(config.shopifyWebhookSecret),
      ),
      fallback: true,
      capabilities: [
        "dropship-catalog-sync",
        "source-split",
        "shopify-checkout",
        "signed-order-webhook",
      ],
      configuredDetail:
        "Shopify dropshipping is enabled with Shopify API credentials and signed order webhooks.",
      fallbackDetail:
        "Shopify dropshipping is optional and disabled; local commerce remains primary.",
      missingDetail:
        "Configure Shopify API credentials and webhook signing only when dropshipping rollout is enabled.",
      name: "Shopify dropshipping",
    }),
    createIntegrationSummary({
      configured: Boolean(
        hasConfigValue(config.jobRunnerSecret) ||
        hasConfigValue(config.cronSecret),
      ),
      fallback: localFallback,
      capabilities: [
        "outbox",
        "reservation-expiry",
        "search-reindex",
        "payment-reconciliation",
        "retry",
      ],
      configuredDetail: "Job runner endpoint is protected by a bearer secret.",
      fallbackDetail: "Local job runner is open for development.",
      missingDetail: "JOB_RUNNER_SECRET or CRON_SECRET is required.",
      name: "Outbox jobs",
    }),
    createIntegrationSummary({
      configured: Boolean(
        hasConfigValue(config.aiGatewayApiKey) ||
        hasConfigValue(config.vercelOidcToken) ||
        hasConfigValue(config.googleGenerativeAiApiKey),
      ),
      fallback: localFallback,
      capabilities: ["catalog-grounding", "tool-calls", "audit", "rate-limits"],
      configuredDetail: "AI model credentials are present for commerce flows.",
      fallbackDetail:
        "AI commerce can be tested locally when a model credential is supplied.",
      missingDetail:
        "Configure AI_GATEWAY_API_KEY, VERCEL_OIDC_TOKEN, or GOOGLE_GENERATIVE_AI_API_KEY for production AI readiness.",
      name: "AI commerce",
    }),
    {
      capabilities: [
        "waf",
        "edge-rate-limits",
        "observability",
        "alerts",
        "runbooks",
      ],
      detail: hasVercelPlatformAccess(config)
        ? "Vercel-linked credentials are present; production policies still require rollout."
        : "Code is ready for platform policy rollout when Vercel access is available.",
      name: "Vercel platform controls",
      status: hasVercelPlatformAccess(config) ? "degraded" : "rollout-required",
    },
  ];
}

export function createIntegrationSummary(input: {
  capabilities: string[];
  configured: boolean;
  configuredDetail: string;
  fallback: boolean;
  fallbackDetail: string;
  missingDetail: string;
  name: string;
}): AdminIntegrationSummary {
  if (input.configured) {
    return {
      capabilities: input.capabilities,
      detail: input.configuredDetail,
      name: input.name,
      status: "configured",
    };
  }

  if (input.fallback) {
    return {
      capabilities: input.capabilities,
      detail: input.fallbackDetail,
      name: input.name,
      status: "local-fallback",
    };
  }

  return {
    capabilities: input.capabilities,
    detail: input.missingDetail,
    name: input.name,
    status: "missing-secret",
  };
}

function hasVercelPlatformAccess(config: ProductionIntegrationConfig) {
  return Boolean(
    hasConfigValue(config.vercelOidcToken) ||
    hasConfigValue(config.aiGatewayApiKey),
  );
}

function hasConfigValue(value: string | undefined) {
  return Boolean(value?.trim());
}

function isEnabled(value: string | undefined) {
  return value === "1" || value?.toLowerCase() === "true";
}
