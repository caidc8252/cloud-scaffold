// Populate env vars required by @cloud/config for tests that import packages
// which call getEnv() at module load.
process.env.DATABASE_URL ??=
  "postgresql://cloud:cloud_dev_password@localhost:5433/cloud_frontend?schema=public";
process.env.NEXT_PUBLIC_APP_NAME ??= "Cloud Test";
