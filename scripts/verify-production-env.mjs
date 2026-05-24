import { pathToFileURL } from "node:url";

const requiredVercelEnv = [
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
];

export function getProductionEnvValidationError(env = process.env) {
  const isVercelProductionBuild =
    env.VERCEL === "1" && env.VERCEL_ENV === "production";

  if (isVercelProductionBuild) {
    const missing = getMissingEnv(requiredVercelEnv, env);

    if (missing.length > 0) {
      return `Missing required Vercel environment variables: ${missing.join(", ")}`;
    }
  }

  return null;
}

export function getProductionReadinessValidationError(
  env = process.env,
  { force = false } = {},
) {
  const isVercelProductionBuild =
    env.VERCEL === "1" && env.VERCEL_ENV === "production";

  if (!force && !isVercelProductionBuild) return null;

  const missing = [
    ...requiredVercelEnv.filter((name) => !env[name]?.trim()),
    ...getMissingEnv(["STORE_FROM_EMAIL", "OPERATIONS_EMAIL"], env),
  ];
  const cardComEnv = [
    "CARD_COM_TERMINAL",
    "CARD_COM_API_NAME",
    "CARD_COM_API_PASSWORD",
    "CARD_COM_WEBHOOK_SECRET",
  ];

  missing.push(...getMissingEnv(cardComEnv, env));
  missing.push(...getMissingEnv(["SMS_PROVIDER_API_KEY"], env));
  missing.push(...getMissingEnv(["TYPESENSE_HOST", "TYPESENSE_API_KEY"], env));
  pushMissingAny(missing, ["BREVO_API_KEY", "RESEND_API_KEY"], env);
  pushMissingAny(missing, ["JOB_RUNNER_SECRET", "CRON_SECRET"], env);
  pushMissingAny(
    missing,
    ["AI_GATEWAY_API_KEY", "VERCEL_OIDC_TOKEN", "GOOGLE_GENERATIVE_AI_API_KEY"],
    env,
  );

  if (missing.length > 0) {
    return `Missing production provider environment variables: ${missing.join(", ")}`;
  }

  return null;
}

export function verifyProductionEnv(env = process.env) {
  const error = getProductionEnvValidationError(env);

  if (!error) return { ok: true };

  return {
    ok: false,
    error,
  };
}

export function verifyProductionReadiness(env = process.env, options = {}) {
  const error = getProductionReadinessValidationError(env, options);

  if (!error) return { ok: true };

  return {
    ok: false,
    error,
  };
}

export function main(env = process.env, argv = process.argv.slice(2)) {
  const result = argv.includes("--readiness")
    ? verifyProductionReadiness(env, { force: argv.includes("--force") })
    : verifyProductionEnv(env);

  if (!result.ok) {
    console.error(result.error);
    return 1;
  }

  return 0;
}

function getMissingEnv(names, env) {
  return names.filter((name) => !env[name]?.trim());
}

function pushMissingAny(missing, names, env) {
  if (names.some((name) => env[name]?.trim())) return;

  missing.push(names.join(" or "));
}

if (isDirectExecution()) {
  process.exitCode = main();
}

function isDirectExecution() {
  const entry = process.argv[1];

  return Boolean(entry) && import.meta.url === pathToFileURL(entry).href;
}
