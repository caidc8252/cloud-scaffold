import { z } from "zod";

const isProd = () => process.env.NODE_ENV === "production";

const envSchema = z
  .object({
    // === Shared backend (root .env) ===
    DATABASE_URL: z.string().min(1),
    REDIS_URL: z.string().default("redis://localhost:6379"),
    BETTER_AUTH_SECRET: z.string().min(16).default("development-secret-change-me"),
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

    // === Per-app (apps/<app>/.env) ===
    BETTER_AUTH_URL: z.string().url(),
    // 留空时 dev 模式自动放行所有 origin；prod 模式由下方 superRefine 强制非空
    BETTER_AUTH_TRUSTED_ORIGINS: z.string().optional(),
    NEXT_PUBLIC_APP_NAME: z.string().min(1),
  })
  .superRefine((env, ctx) => {
    if (isProd() && !env.BETTER_AUTH_TRUSTED_ORIGINS?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["BETTER_AUTH_TRUSTED_ORIGINS"],
        message:
          "BETTER_AUTH_TRUSTED_ORIGINS is required in production (comma-separated, wildcards like *.example.com supported)",
      });
    }
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

function parseOriginList(value: string) {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
  );
}

/**
 * Better Auth trustedOrigins 的单点解析入口。
 *
 * 优先级（高 → 低，由 Node + Next.js 自身保证，这里不再额外加载）：
 *   1. 运行时注入的环境变量（Render / Docker / shell）
 *   2. apps/<app>/.env.local
 *   3. apps/<app>/.env
 *   4. 根 .env（通过 next.config.ts 的 loadEnvFile 注入）
 *
 * Dev 行为（NODE_ENV !== "production"）：env 缺省 → ["*"]，等效于不做校验，方便 LAN / ngrok / 改端口。
 * 写了值也尊重，便于本地有意测试白名单。
 *
 * Prod 行为：schema superRefine 已保证非空，直接按逗号拆分。
 * 通配符如 *.example.com 由 Better Auth 内置 matchesOriginPattern 处理，原样透传。
 */
export function resolveTrustedOrigins(): string[] {
  const raw = getEnv().BETTER_AUTH_TRUSTED_ORIGINS?.trim();

  if (!isProd() && !raw) {
    return ["*"];
  }

  return parseOriginList(raw ?? "");
}

/**
 * @deprecated 使用 resolveTrustedOrigins() 代替，它会处理 dev fallback 与 PaaS 优先级。
 */
export function parseTrustedOrigins(value: string) {
  return parseOriginList(value);
}
