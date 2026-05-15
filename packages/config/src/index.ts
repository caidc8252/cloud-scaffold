import { z } from "zod";

const PEM_PUB_RE = /^-----BEGIN PUBLIC KEY-----[\s\S]+-----END PUBLIC KEY-----\s*$/;
const PEM_PRIV_RE = /^-----BEGIN PRIVATE KEY-----[\s\S]+-----END PRIVATE KEY-----\s*$/;

// PaaS 控制台单行输入时 \n 是字面量；本地 .env 多行 quoted 写法时 \n 已是真实换行 —— 两种来源都还原成真实换行。
const pemSchema = (regex: RegExp, name: string) =>
  z
    .string()
    .transform((s) => s.replace(/\\n/g, "\n"))
    .pipe(z.string().regex(regex, `${name} must be a PEM-encoded key`));

const envSchema = z.object({
  // === Shared backend (root .env) ===
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().default("redis://localhost:6379"),

  // === Auth: RSA login keypair (static, rotate by editing env + restart) ===
  LOGIN_PUBLIC_KEY_PEM: pemSchema(PEM_PUB_RE, "LOGIN_PUBLIC_KEY_PEM"),
  LOGIN_PRIVATE_KEY_PEM: pemSchema(PEM_PRIV_RE, "LOGIN_PRIVATE_KEY_PEM"),

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
