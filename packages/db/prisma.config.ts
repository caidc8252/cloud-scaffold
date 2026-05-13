import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import { defineConfig, env } from "prisma/config";

const here = path.dirname(fileURLToPath(import.meta.url));

// 根 .env 仍需手动注入：prisma CLI 进程不会走 Next 的加载链。
loadEnv({ path: path.resolve(here, "../../.env") });

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    path: path.join("prisma", "migrations"),
    seed: "node --import tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
