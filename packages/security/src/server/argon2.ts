import argon2 from "argon2";

// OWASP 2023+ Password Storage Cheat Sheet 推荐档（argon2id, 19 MiB, t=2, p=1）。
// 调整这些常量不影响已存 hash 的 verify —— argon2 hash 字符串自带参数。
const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const;

export async function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, ARGON2_OPTIONS);
}

export async function verifyPassword(
  hash: string,
  plain: string,
): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain);
  } catch {
    return false;
  }
}
