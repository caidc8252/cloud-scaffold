import type { NextConfig } from "next";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { loadEnvFile } from "node:process";

// 加载顺序：先 .env.development（dev 才加载），再 .env。
// loadEnvFile 已存在不覆盖，故 dev 值会胜出。生产仅读 .env，PaaS 注入再覆盖。
const rootDir = join(process.cwd(), "..", "..");
if (process.env.NODE_ENV !== "production") {
  const rootDevEnvPath = join(rootDir, ".env.development");
  if (existsSync(rootDevEnvPath)) {
    loadEnvFile(rootDevEnvPath);
  }
}
const rootEnvPath = join(rootDir, ".env");
if (existsSync(rootEnvPath)) {
  loadEnvFile(rootEnvPath);
}

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "127.0.0.1",
    "10.*.*.*",
    "192.168.*.*",
    "*.app.github.dev",
    "*.githubpreview.dev",
  ],
  transpilePackages: ["@cloud/ui"],
  experimental: {
    optimizePackageImports: ["@cloud/ui"],
  },
};

export default nextConfig;
