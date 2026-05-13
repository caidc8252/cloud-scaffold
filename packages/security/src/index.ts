import bcrypt from "bcryptjs";
import { createHash } from "node:crypto";

const DEFAULT_SALT_ROUNDS = 12;
const SENSITIVE_KEYS = ["password", "token", "secret", "authorization", "cookie", "clientSecret"];

export async function hashPassword(password: string) {
  return bcrypt.hash(password, DEFAULT_SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function maskSensitive<T>(value: T): T {
  if (typeof value === "string") {
    return (value.length <= 8 ? "***" : `${value.slice(0, 4)}***${value.slice(-4)}`) as T;
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => maskSensitive(item)) as T;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => {
      const lowerKey = key.toLowerCase();
      const shouldMask = SENSITIVE_KEYS.some((sensitiveKey) => lowerKey.includes(sensitiveKey));
      return [key, shouldMask ? "***" : typeof item === "string" ? item : maskSensitive(item)];
    }),
  ) as T;
}
