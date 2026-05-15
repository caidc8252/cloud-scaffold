import { z } from "zod";

const envSchema = z.object({
  // === Shared backend (root .env) ===
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().default("redis://localhost:6379"),

  // === Per-app (apps/<app>/.env) ===
  NEXT_PUBLIC_APP_NAME: z.string().min(1),
});

export type AppEnv = z.infer<typeof envSchema>;

let cachedEnv: AppEnv | null = null;

export function getEnv() {
  if (!cachedEnv) {
    cachedEnv = envSchema.parse(process.env);
  }

  return cachedEnv;
}
