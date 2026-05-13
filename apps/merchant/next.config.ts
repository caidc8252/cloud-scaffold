import type { NextConfig } from "next";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { loadEnvFile } from "node:process";

const rootEnvPath = join(process.cwd(), "..", "..", ".env");
if (existsSync(rootEnvPath)) {
  loadEnvFile(rootEnvPath);
}

const nextConfig: NextConfig = {
  transpilePackages: ["@cloud/ui"],
};

export default nextConfig;
