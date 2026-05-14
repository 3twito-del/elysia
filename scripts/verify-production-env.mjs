import { pathToFileURL } from "node:url";

const requiredVercelEnv = [
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
];

export function getProductionEnvValidationError(env = process.env) {
  const isVercelBuild = env.VERCEL === "1";
  const isVercelProductionBuild =
    env.VERCEL === "1" && env.VERCEL_ENV === "production";

  if (isVercelBuild) {
    const missing = getMissingEnv(requiredVercelEnv, env);

    if (missing.length > 0) {
      return `Missing required Vercel environment variables: ${missing.join(", ")}`;
    }
  }

  if (!isVercelProductionBuild) {
    return null;
  }

  const missing = requiredVercelEnv.filter((name) => !env[name]?.trim());

  missing.push(...getMissingEnv(["STORE_FROM_EMAIL", "OPERATIONS_EMAIL"], env));

  const cardComEnv = [
    "CARD_COM_TERMINAL",
    "CARD_COM_API_NAME",
    "CARD_COM_API_PASSWORD",
  ];
  const hasAnyCardComEnv = cardComEnv.some((name) => env[name]?.trim());
  const missingCardComEnv = getMissingEnv(cardComEnv, env);

  if (!env.BREVO_API_KEY?.trim() && !env.RESEND_API_KEY?.trim()) {
    missing.push("BREVO_API_KEY or RESEND_API_KEY");
  }

  if (hasAnyCardComEnv) {
    missing.push(...missingCardComEnv);

    if (!env.CARD_COM_WEBHOOK_SECRET?.trim()) {
      missing.push("CARD_COM_WEBHOOK_SECRET");
    }
  }

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

export function main(env = process.env) {
  const result = verifyProductionEnv(env);

  if (!result.ok) {
    console.error(result.error);
    return 1;
  }

  return 0;
}

function getMissingEnv(names, env) {
  return names.filter((name) => !env[name]?.trim());
}

if (isDirectExecution()) {
  process.exitCode = main();
}

function isDirectExecution() {
  const entry = process.argv[1];

  return Boolean(entry) && import.meta.url === pathToFileURL(entry).href;
}
