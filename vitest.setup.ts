// Populate env vars required by @cloud/config for tests that import packages
// (auth, request, etc.) which call getEnv() at module load.
process.env.DATABASE_URL ??=
  "postgresql://cloud:cloud_dev_password@localhost:5433/cloud_frontend?schema=public";
process.env.BETTER_AUTH_URL ??= "http://localhost:3000";
// BETTER_AUTH_TRUSTED_ORIGINS 在 dev/test 已可选（NODE_ENV!=production 时 fallback 为 ["*"]）
process.env.NEXT_PUBLIC_APP_NAME ??= "Cloud Test";
