import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1)
    .default("postgresql://cloud:cloud_dev_password@localhost:5432/cloud_frontend?schema=public"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  BETTER_AUTH_SECRET: z.string().min(16).default("development-secret-change-me"),
  BETTER_AUTH_URL: z.string().url().default("http://localhost:3000"),
  BETTER_AUTH_TRUSTED_ORIGINS: z
    .string()
    .default("http://localhost:3000,http://localhost:3001,http://localhost:3002"),
  GOOGLE_CLIENT_ID: z.string().optional().default(""),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(""),
  SESSION_COOKIE_NAME: z.string().default("session-token"),
  SESSION_CACHE_PREFIX: z.string().default("session:"),
  SESSION_TTL_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(60 * 60 * 24),
  REQUEST_BODY_LIMIT_BYTES: z.coerce
    .number()
    .int()
    .positive()
    .default(10 * 1024 * 1024),
  NEXT_PUBLIC_APP_NAME: z.string().default("Cloud"),
});

export type AppEnv = z.infer<typeof envSchema>;

let cachedEnv: AppEnv | null = null;

export function getEnv() {
  if (!cachedEnv) {
    cachedEnv = envSchema.parse(process.env);
  }

  return cachedEnv;
}

export const publicRoutes = [
  "/login",
  "/api/auth",
  "/favicon.ico",
  "/next.svg",
  "/vercel.svg",
] as const;

export function isPublicPath(pathname: string) {
  return publicRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export function parseTrustedOrigins(value: string) {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
  );
}
