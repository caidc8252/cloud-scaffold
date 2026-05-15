#!/usr/bin/env tsx
/**
 * 生成 RSA-2048 登录密钥对（SPKI 公钥 + PKCS8 私钥，PEM 格式）。
 *
 * 用法：
 *   pnpm keys:gen              # 打印 PEM 到 stdout
 *   pnpm keys:gen --write      # 同时写入根 .env 与 .env.example（已存在则跳过，加 --force 强制）
 *   pnpm keys:gen --write --force
 */
import { generateKeyPairSync } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(SCRIPT_DIR, "..");
const ENV_PATH = resolve(ROOT, ".env");
const ENV_EXAMPLE_PATH = resolve(ROOT, ".env.example");

const args = new Set(process.argv.slice(2));
const shouldWrite = args.has("--write");
const force = args.has("--force");

function generate() {
  const { publicKey, privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });
  return { publicKey: publicKey.trim(), privateKey: privateKey.trim() };
}

function pemToEnvLine(name: string, pem: string): string {
  // 多行 quoted —— dotenv 16+ / Next.js @next/env 默认支持
  return `${name}="${pem}"`;
}

function upsertEnvKey(file: string, name: string, value: string): "wrote" | "skipped" {
  const existing = existsSync(file) ? readFileSync(file, "utf-8") : "";
  const re = new RegExp(`(^|\\n)${name}=`);
  if (re.test(existing) && !force) {
    return "skipped";
  }
  const block = pemToEnvLine(name, value);
  if (re.test(existing)) {
    const updated = existing.replace(
      new RegExp(`(^|\\n)${name}=("[\\s\\S]*?"|.*)`),
      (_m, prefix) => `${prefix}${block}`,
    );
    writeFileSync(file, updated);
  } else {
    const sep = existing.endsWith("\n") || existing === "" ? "" : "\n";
    writeFileSync(file, `${existing}${sep}\n# --- Auth: RSA login keypair ---\n${block}\n`);
  }
  return "wrote";
}

function main() {
  const { publicKey, privateKey } = generate();

  if (!shouldWrite) {
    process.stdout.write(
      "# Paste these two blocks into the root .env (or set in your PaaS console).\n",
    );
    process.stdout.write(`${pemToEnvLine("LOGIN_PUBLIC_KEY_PEM", publicKey)}\n\n`);
    process.stdout.write(`${pemToEnvLine("LOGIN_PRIVATE_KEY_PEM", privateKey)}\n`);
    return;
  }

  const envPubResult = upsertEnvKey(ENV_PATH, "LOGIN_PUBLIC_KEY_PEM", publicKey);
  const envPrivResult = upsertEnvKey(ENV_PATH, "LOGIN_PRIVATE_KEY_PEM", privateKey);
  const examplePubResult = upsertEnvKey(ENV_EXAMPLE_PATH, "LOGIN_PUBLIC_KEY_PEM", publicKey);
  const examplePrivResult = upsertEnvKey(ENV_EXAMPLE_PATH, "LOGIN_PRIVATE_KEY_PEM", privateKey);

  console.log(`.env             public  -> ${envPubResult}`);
  console.log(`.env             private -> ${envPrivResult}`);
  console.log(`.env.example     public  -> ${examplePubResult}`);
  console.log(`.env.example     private -> ${examplePrivResult}`);

  if ([envPubResult, envPrivResult, examplePubResult, examplePrivResult].includes("skipped")) {
    console.log("\nSome keys were left untouched. Pass --force to overwrite.");
  }

  console.log(
    "\n.env.example now ships a working dev keypair so `cp .env.example .env` boots admin out of the box.",
  );
  console.log(
    "For production, run this script in your deploy environment and inject via your PaaS — do NOT use the committed dev keypair.",
  );
}

main();
