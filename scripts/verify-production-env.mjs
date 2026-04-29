const requiredVercelEnv = [
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
];

const isVercelBuild = process.env.VERCEL === "1";

if (isVercelBuild) {
  const missing = requiredVercelEnv.filter((name) => !process.env[name]?.trim());

  if (missing.length > 0) {
    console.error(
      `Missing required Vercel environment variables: ${missing.join(", ")}`,
    );
    process.exit(1);
  }
}
