const requiredVercelEnv = [
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
];

const isVercelBuild = process.env.VERCEL === "1";
const isVercelProductionBuild =
  process.env.VERCEL === "1" && process.env.VERCEL_ENV === "production";

if (isVercelBuild) {
  const missing = requiredVercelEnv.filter((name) => !process.env[name]?.trim());

  if (missing.length > 0) {
    console.error(
      `Missing required Vercel environment variables: ${missing.join(", ")}`,
    );
    process.exit(1);
  }
}

if (isVercelProductionBuild) {
  const missing = ["STORE_FROM_EMAIL", "OPERATIONS_EMAIL"].filter(
    (name) => !process.env[name]?.trim(),
  );

  if (!process.env.BREVO_API_KEY?.trim() && !process.env.RESEND_API_KEY?.trim()) {
    missing.push("BREVO_API_KEY or RESEND_API_KEY");
  }

  if (missing.length > 0) {
    console.error(
      `Missing production transactional email environment variables: ${missing.join(", ")}`,
    );
    process.exit(1);
  }
}
