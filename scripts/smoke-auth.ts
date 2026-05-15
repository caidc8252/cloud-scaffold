#!/usr/bin/env tsx
/**
 * 端到端 smoke test：
 *   1. fetch /api/auth/public-key 拿当前 dev server 的公钥
 *   2. 用 @cloud/security/client.rsaEncrypt 加密 {password, ts}
 *   3. 用 .env 中的私钥 + @cloud/security/server.rsaDecrypt 解密
 *   4. 校验明文一致 + ts 在 60s 窗内
 *   5. 用 prisma 拿 admin 用户的 hash + verifyPassword 验证
 *
 * 用法：在 dev server 已 ready 时运行
 *   pnpm -F @cloud/db exec tsx ../../scripts/smoke-auth.ts
 */
import { rsaEncrypt } from "@cloud/security/client";
import {
  assertFreshTimestamp,
  rsaDecrypt,
  verifyPassword,
} from "@cloud/security/server";
import { prisma } from "@cloud/db";

const ADMIN_URL = process.env.ADMIN_URL ?? "http://localhost:3002";
const PASSWORD = "ChangeMe!123";

function pass(msg: string) {
  console.log(`  ✓ ${msg}`);
}

async function main() {
  console.log("[1/5] fetching /api/auth/public-key");
  const res = await fetch(`${ADMIN_URL}/api/auth/public-key`);
  if (!res.ok) throw new Error(`public-key endpoint returned ${res.status}`);
  const { publicKey } = (await res.json()) as { publicKey: string };
  pass(`got publicKey (${publicKey.length} chars)`);

  console.log("[2/5] encrypting {password, ts} with public key");
  const ts = Date.now();
  const plaintext = JSON.stringify({ password: PASSWORD, ts });
  const cipher = await rsaEncrypt(plaintext, publicKey);
  pass(`ciphertext length = ${cipher.length} base64 chars`);

  console.log("[3/5] decrypting with .env private key");
  const privatePem = process.env.LOGIN_PRIVATE_KEY_PEM;
  if (!privatePem) throw new Error("LOGIN_PRIVATE_KEY_PEM not in env");
  const decoded = rsaDecrypt(cipher, privatePem.replace(/\\n/g, "\n"));
  if (decoded !== plaintext) throw new Error("decrypt mismatch");
  pass("round trip plaintext matches");

  console.log("[4/5] assertFreshTimestamp on decrypted ts");
  const parsed = JSON.parse(decoded) as { password: string; ts: number };
  assertFreshTimestamp(parsed.ts);
  pass(`ts ${parsed.ts} is within 60s window`);

  console.log("[5/5] verifying admin password against DB hash");
  const user = await prisma.user.findUnique({
    where: { account: "admin" },
    select: { password: true },
  });
  if (!user) throw new Error("admin user not found in DB — did seed run?");
  const ok = await verifyPassword(user.password, parsed.password);
  if (!ok) throw new Error("argon2 verify failed");
  pass("verifyPassword(hash, 'ChangeMe!123') === true");

  console.log("\nALL CHECKS PASSED");
}

main()
  .catch((err) => {
    console.error("\nFAILED:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
